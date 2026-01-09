use printpdf::*;
use base64::Engine;
use crate::database::{query_one};
use crate::database::DbPool;
use tauri::State;
use sqlx::Row;

#[tauri::command]
pub async fn generate_pdf_labels(
    db: State<'_, DbPool>,
    item_ids: Vec<i32>,
    paper_size: String,
    columns: i32,
    rows: i32,
) -> Result<String, String> {
    // Get items
    let mut items_data = Vec::new();
    for item_id in item_ids {
        let result = query_one(
            &db,
            "SELECT i.id, i.name, i.specifications, i.quantity, i.unit, l.name as location_name, l.qr_code_id FROM items i LEFT JOIN locations l ON i.location_id = l.id WHERE i.id = ?1",
            vec![item_id.to_string()],
        )
        .await
        .map_err(|e| e.to_string())?;

        if let Some(row) = result {
            items_data.push((
                row.get::<i32, _>("id"),
                row.get::<String, _>("name"),
                row.try_get::<String, _>("specifications").ok(),
                row.get::<i32, _>("quantity"),
                row.try_get::<String, _>("unit").ok(),
                row.try_get::<String, _>("location_name").ok(),
                row.try_get::<String, _>("qr_code_id").ok(),
            ));
        }
    }

    if items_data.is_empty() {
        return Err("No items found".to_string());
    }

    // Determine page size
    let (page_width, page_height) = match paper_size.as_str() {
        "A4" => (Mm(210.0), Mm(297.0)),
        "Letter" => (Mm(215.9), Mm(279.4)),
        "A5" => (Mm(148.0), Mm(210.0)),
        _ => (Mm(210.0), Mm(297.0)), // Default A4
    };

    let (doc, page_id, _layer_id) = PdfDocument::new("Item Labels", page_width, page_height, "Layer 1");

    // Embed fonts into the document
    let font_regular = doc.add_builtin_font(BuiltinFont::Helvetica).map_err(|e| e.to_string())?;
    let font_bold = doc.add_builtin_font(BuiltinFont::HelveticaBold).map_err(|e| e.to_string())?;

    // Calculate label dimensions (convert Mm to Pt: 1mm ≈ 2.83pt)
    let page_width_pt = page_width.0 * 2.83;
    let page_height_pt = page_height.0 * 2.83;
    let label_width_pt = page_width_pt / columns as f32;
    let label_height_pt = page_height_pt / rows as f32;

    // Calculate how many pages we need
    let labels_per_page = (columns * rows) as usize;
    let total_pages = (items_data.len() + labels_per_page - 1) / labels_per_page;

    // Create additional pages if needed
    let mut page_ids = vec![page_id];
    for page_num in 1..total_pages {
        let (new_page_id, _new_layer_id) = doc.add_page(page_width, page_height, format!("Layer {}", page_num + 1));
        page_ids.push(new_page_id);
    }

    for page_num in 0..total_pages {
        let start_idx = page_num * labels_per_page;
        let end_idx = std::cmp::min(start_idx + labels_per_page, items_data.len());
        let page_items = &items_data[start_idx..end_idx];

        let current_page = doc.get_page(page_ids[page_num]);
        let layer_name = format!("Layer {}", page_num + 1);
        let current_layer: PdfLayerReference = current_page.add_layer(layer_name);

        for (idx, (_item_id, name, specs, qty, unit, location, _qr_id)) in page_items.iter().enumerate() {
            let row = (idx / columns as usize) as i32;
            let col = (idx % columns as usize) as i32;

            let x = Pt(label_width_pt * col as f32 + 10.0);
            let y = Pt(page_height_pt - label_height_pt * (row + 1) as f32 + 50.0);

            // Add item name
            let _ = current_layer.use_text(&name.chars().take(30).collect::<String>(), 12.0, x.into(), y.into(), &font_bold);

            // Add specifications if exists
            if let Some(s) = specs {
                let y2 = y - Pt(15.0);
                let _ = current_layer.use_text(&format!("规格: {}", s).chars().take(40).collect::<String>(), 9.0, x.into(), y2.into(), &font_regular);
            }

            // Add quantity
            let y3 = y - Pt(27.0);
            let unit_str = unit.as_ref().map(|s| s.as_str()).unwrap_or("个");
            let _ = current_layer.use_text(&format!("数量: {} {}", qty, unit_str), 10.0, x.into(), y3.into(), &font_bold);

            // Add location if exists
            if let Some(loc) = location {
                let y4 = y - Pt(39.0);
                let _ = current_layer.use_text(&format!("位置: {}", loc).chars().take(40).collect::<String>(), 9.0, x.into(), y4.into(), &font_regular);
            }

            // Add QR code text placeholder
            let qr_x = x + Pt(80.0);
            let qr_y = y - Pt(50.0);
            let _ = current_layer.use_text("二维码", 8.0, qr_x.into(), qr_y.into(), &font_regular);
        }
    }

    // Save to bytes
    let pdf_bytes = doc.save_to_bytes().map_err(|e| e.to_string())?;

    // Encode to base64
    let base64_string = base64::engine::general_purpose::STANDARD.encode(&pdf_bytes);

    Ok(format!("data:application/pdf;base64,{}", base64_string))
}
