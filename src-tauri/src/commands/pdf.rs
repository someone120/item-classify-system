use printpdf::*;
use std::fs::File;
use std::io::Cursor;
use base64::Engine;
use tauri_plugin_sql::SqlitePool;

#[tauri::command]
pub async fn generate_pdf_labels(
    db: tauri::State<'_, SqlitePool>,
    item_ids: Vec<i32>,
    paper_size: String,
    columns: i32,
    rows: i32,
) -> Result<String, String> {
    // Get items
    let mut items_data = Vec::new();
    for item_id in item_ids {
        let result = db
            .execute(
                "SELECT i.id, i.name, i.specifications, i.quantity, i.unit, l.name as location_name, l.qr_code_id FROM items i LEFT JOIN locations l ON i.location_id = l.id WHERE i.id = $1",
                vec![item_id.into()],
            )
            .await
            .map_err(|e| e.to_string())?;

        if !result.is_empty() {
            let row = &result[0];
            items_data.push((
                row.get("id").unwrap_or(0),
                row.get("name").unwrap_or_default(),
                row.get::<Option<String>>("specifications").ok().flatten(),
                row.get("quantity").unwrap_or(0),
                row.get::<Option<String>>("unit").ok().flatten(),
                row.get::<Option<String>>("location_name").ok().flatten(),
                row.get::<Option<String>>("qr_code_id").ok().flatten(),
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

    let mut doc = PdfDocument::new("Item Labels");

    // Add built-in font
    let font_id = BuiltinFont::HelveticaBold;

    // Calculate label dimensions
    let label_width = Pt((page_width.0 * 10.0 / columns as f32) as i32);
    let label_height = Pt((page_height.0 * 10.0 / rows as f32) as i32);

    // Calculate how many pages we need
    let labels_per_page = (columns * rows) as usize;
    let total_pages = (items_data.len() + labels_per_page - 1) / labels_per_page;

    for page_num in 0..total_pages {
        let start_idx = page_num * labels_per_page;
        let end_idx = std::cmp::min(start_idx + labels_per_page, items_data.len());
        let page_items = &items_data[start_idx..end_idx];

        let mut ops = Vec::new();

        for (idx, (item_id, name, specs, qty, unit, location, qr_id)) in page_items.iter().enumerate() {
            let row = (idx / columns as usize) as i32;
            let col = (idx % columns as usize) as i32;

            let x = Pt((label_width.0 * col as f32) as i32) + Pt(10);
            let y = Pt((page_height.0 * 10.0) - (label_height.0 * (row + 1) as f32) as i32) + Pt(50);

            // Add item name
            let text_pos = Point { x: x.into(), y: y.into() };
            ops.push(Op::SetTextCursor { pos: text_pos });
            ops.push(Op::WriteTextBuiltinFont {
                text: name.chars().take(30).collect(),
                size: Pt(12.0),
                font: font_id.clone(),
            });

            // Add specifications if exists
            let y2 = y - Pt(15);
            if let Some(s) = specs {
                let text_pos = Point { x: x.into(), y: y2.into() };
                ops.push(Op::SetTextCursor { pos: text_pos });
                ops.push(Op::WriteTextBuiltinFont {
                    text: format!("规格: {}", s).chars().take(40).collect(),
                    size: Pt(9.0),
                    font: BuiltinFont::Helvetica,
                });
            }

            // Add quantity
            let y3 = y2 - Pt(12);
            let text_pos = Point { x: x.into(), y: y3.into() };
            ops.push(Op::SetTextCursor { pos: text_pos });
            ops.push(Op::WriteTextBuiltinFont {
                text: format!("数量: {} {}", qty, unit.as_ref().unwrap_or(&"个".to_string())),
                size: Pt(10.0),
                font: BuiltinFont::HelveticaBold,
            });

            // Add location if exists
            let y4 = y3 - Pt(12);
            if let Some(loc) = location {
                let text_pos = Point { x: x.into(), y: y4.into() };
                ops.push(Op::SetTextCursor { pos: text_pos });
                ops.push(Op::WriteTextBuiltinFont {
                    text: format!("位置: {}", loc).chars().take(40).collect(),
                    size: Pt(9.0),
                    font: BuiltinFont::Helvetica,
                });
            }

            // Generate QR code for the label
            if let Some(qr_code_id) = qr_id {
                if let Ok(qr_code) = qrcode::QrCode::new(qr_code_id.clone()) {
                    let image = qr_code.render::<image::Luma<u8>>().build();

                    // Convert to PNG
                    let mut buffer = vec![];
                    let mut cursor = Cursor::new(&mut buffer);
                    image.write_to(&mut cursor, image::ImageFormat::Png).ok();

                    // Add QR code image (small size for label)
                    let qr_x = x + Pt(80);
                    let qr_y = y - Pt(50);
                    // Note: Adding images to PDF requires more complex handling
                    // For now, we'll just add text indicating QR code
                    let text_pos = Point { x: qr_x.into(), y: qr_y.into() };
                    ops.push(Op::SetTextCursor { pos: text_pos });
                    ops.push(Op::WriteTextBuiltinFont {
                        text: "二维码".to_string(),
                        size: Pt(8.0),
                        font: BuiltinFont::Helvetica,
                    });
                }
            }
        }

        let page = PdfPage::new(page_width, page_height, ops);
        doc = doc.with_page(page);
    }

    // Save to bytes
    let pdf_bytes = doc.save(&PdfSaveOptions::default()).map_err(|e| e.to_string())?;

    // Encode to base64
    let base64_string = base64::engine::general_purpose::STANDARD.encode(&pdf_bytes);

    Ok(format!("data:application/pdf;base64,{}", base64_string))
}
