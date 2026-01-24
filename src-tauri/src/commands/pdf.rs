use printpdf::{
    PdfDocument, PdfLayerReference, Mm, Px, Color, Rgb,
    Polygon, PolygonMode, WindingOrder, Point, ImageXObject, Image, ImageTransform,
    ColorSpace, ColorBits,
};
use image::{ImageBuffer, RgbImage, Rgb as ImageRgb};
use base64::Engine;
use qrcode::QrCode;
use rusttype::{Font, Scale, point};
use crate::database::{query_one};
use crate::database::DbPool;
use tauri::State;
use sqlx::Row;
use std::io::Cursor;
use std::path::PathBuf;

/// Get the path to a Chinese font file (SimHei on Windows)
fn get_chinese_font_path() -> Result<PathBuf, String> {
    #[cfg(target_os = "windows")]
    {
        let font_paths = vec![
            PathBuf::from("C:\\Windows\\Fonts\\simhei.ttf"),  // 黑体
            PathBuf::from("C:\\Windows\\Fonts\\simsun.ttc"),  // 宋体
            PathBuf::from("C:\\Windows\\Fonts\\msyh.ttc"),    // 微软雅黑
            PathBuf::from("C:\\Windows\\Fonts\\simkai.ttf"),  // 楷体
        ];

        for path in font_paths {
            if path.exists() {
                eprintln!("Found Chinese font: {:?}", path);
                return Ok(path);
            }
        }

        Err("No Chinese font found in Windows system fonts".to_string())
    }

    #[cfg(not(target_os = "windows"))]
    {
        // For Linux/Mac, try common font locations
        let font_paths = vec![
            PathBuf::from("/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc"),
            PathBuf::from("/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf"),
            PathBuf::from("/System/Library/Fonts/PingFang.ttc"),  // macOS
        ];

        for path in font_paths {
            if path.exists() {
                eprintln!("Found Chinese font: {:?}", path);
                return Ok(path);
            }
        }

        Err("No Chinese font found in system fonts".to_string())
    }
}

#[tauri::command]
pub async fn generate_pdf_labels(
    db: State<'_, DbPool>,
    item_ids: Vec<i32>,
    paper_size: String,
    columns: i32,
    rows: i32,
    template: String,
    font_size: f32,
    show_fields: Vec<String>,
) -> Result<String, String> {
    eprintln!("PDF generation requested: {} items, paper: {}, {}x{} grid, template: {}, font: {}, fields: {:?}", 
        item_ids.len(), paper_size, columns, rows, template, font_size, show_fields);

    // Get items
    let mut items_data = Vec::new();
    for item_id in &item_ids {
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

    eprintln!("Retrieved {} items from database", items_data.len());

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

    // Load Chinese font file
    let font_path = get_chinese_font_path()?;
    let font_data = std::fs::read(&font_path)
        .map_err(|e| format!("Failed to read font file {:?}: {}", font_path, e))?;

    eprintln!("Loaded font data, size: {} bytes", font_data.len());

    // Embed external Chinese font into the document
    let font_regular = doc.add_external_font(Cursor::new(font_data.clone()))
        .map_err(|e| format!("Failed to add external font: {}", e))?;

    // For bold, we'll use the same font but could add a separate bold font file if needed
    let font_bold = font_regular.clone();

    // Calculate label dimensions
    let label_width = page_width.0 / columns as f32;
    let label_height = page_height.0 / rows as f32;

    // Cell padding
    let padding = Mm(5.0);
    let border_thickness = Mm(0.3);

    // Calculate how many pages we need
    let labels_per_page = (columns * rows) as usize;
    let total_pages = (items_data.len() + labels_per_page - 1) / labels_per_page;

    // Create additional pages if needed
    let mut page_ids = vec![page_id];
    for page_num in 1..total_pages {
        let (new_page_id, _new_layer_id) = doc.add_page(page_width, page_height, format!("Layer {}", page_num + 1));
        page_ids.push(new_page_id);
    }
    
    // Parse visible fields
    let show_name = show_fields.contains(&"name".to_string());
    let show_specs = show_fields.contains(&"specifications".to_string());
    let show_qty = show_fields.contains(&"quantity".to_string());
    let show_loc = show_fields.contains(&"location".to_string());
    let show_qr = show_fields.contains(&"qrCode".to_string());

    for page_num in 0..total_pages {
        let start_idx = page_num * labels_per_page;
        let end_idx = std::cmp::min(start_idx + labels_per_page, items_data.len());
        let page_items = &items_data[start_idx..end_idx];

        let current_page = doc.get_page(page_ids[page_num]);
        let layer_name = format!("Layer {}", page_num + 1);
        let current_layer: PdfLayerReference = current_page.add_layer(layer_name);

        // Draw cell borders
        for row in 0..rows {
            for col in 0..columns {
                let x = Mm(label_width * col as f32);
                let y = Mm(label_height * (rows - row - 1) as f32);

                // Create polygon points for rectangle
                let points = vec![
                    (Point::new(x, y), false),
                    (Point::new(x + Mm(label_width), y), false),
                    (Point::new(x + Mm(label_width), y + Mm(label_height)), false),
                    (Point::new(x, y + Mm(label_height)), false),
                ];

                let polygon = Polygon {
                    rings: vec![points],
                    mode: PolygonMode::Stroke,
                    winding_order: WindingOrder::NonZero,
                };

                current_layer.set_outline_color(Color::Rgb(Rgb::new(0.0, 0.0, 0.0, None)));
                current_layer.set_outline_thickness(border_thickness.0);
                current_layer.add_polygon(polygon);
            }
        }

        // Add content to each cell
        for (idx, (item_id, name, specs, qty, unit, location, qr_id)) in page_items.iter().enumerate() {
            let row = (idx / columns as usize) as i32;
            let col = (idx % columns as usize) as i32;

            // Calculate cell position
            let cell_x = Mm(label_width * col as f32);
            let cell_y_base = Mm(label_height * (rows - row - 1) as f32);

            // Content area inside the cell (with padding)
            let content_x = cell_x + padding;
            let content_y_base = cell_y_base + Mm(label_height) - padding;

            eprintln!("Drawing item {} at ({}, {}): {}", idx, col, row, name);

            // Split cell into left (text) and right (QR code) sections
            // Use configured settings
            let qr_size = if show_qr { Mm(label_height) - padding * 2.0 } else { Mm(0.0) };
            
            // Text area constraints
            let max_text_width = if show_qr {
                Mm(label_width) - qr_size - padding * 2.0
            } else {
                Mm(label_width) - padding * 2.0
            };

            // ===== LEFT SECTION: TEXT =====
            let mut current_y = content_y_base - Mm(2.0); // Start a bit lower
            
            // Base font sizes (scaled from config)
            let title_size = if template == "compact" { font_size } else { font_size * 1.2 };
            let body_size = font_size * 0.9;
            let line_gap = Mm(font_size * 0.353 * 1.5); // Convert pt to mm (approx) and add spacing

            // Item name (物料名)
            if show_name {
                let _ = current_layer.use_text(
                    &format!("{}", &name.chars().take(20).collect::<String>()),
                    title_size,
                    content_x,
                    current_y,
                    &font_bold
                );
                current_y = current_y - line_gap;
            }

            // Specifications
            if show_specs && template != "compact" {
                if let Some(s) = specs {
                    let spec_text = format!("规格: {}", &s.chars().take(30).collect::<String>());
                    let _ = current_layer.use_text(&spec_text, body_size, content_x, current_y, &font_regular);
                    current_y = current_y - line_gap;
                }
            }

            // Quantity
            if show_qty {
                let unit_str = unit.as_ref().map(|s| s.as_str()).unwrap_or("个");
                let _ = current_layer.use_text(
                    &format!("数量: {} {}", qty, unit_str),
                    body_size,
                    content_x,
                    current_y,
                    &font_bold
                );
                current_y = current_y - line_gap;
            }

            // Location
            if show_loc && template == "detailed" {
                if let Some(loc) = location {
                    let _ = current_layer.use_text(
                        &format!("位置: {}", &loc.chars().take(25).collect::<String>()),
                        body_size,
                        content_x,
                        current_y,
                        &font_regular
                    );
                }
            }

            // ===== RIGHT SECTION: QR CODE =====
            if show_qr {
                // Generate QR code
                let qr_data = if let Some(qr_id) = qr_id {
                    qr_id.clone()
                } else {
                    item_id.to_string()
                };
                let qr_code = QrCode::new(&qr_data)
                    .map_err(|e| format!("QR code generation failed: {}", e))?;

                let qr_pixel_size = 200;
                let qr_size_int = qr_code.width();
                let mut qr_bytes = vec![0u8; qr_pixel_size * qr_pixel_size];
                let scale = qr_pixel_size / qr_size_int;

                for y in 0..qr_pixel_size {
                    for x in 0..qr_pixel_size {
                        let qr_x = x / scale;
                        let qr_y = y / scale;
                        if qr_x < qr_size_int && qr_y < qr_size_int {
                            let module = qr_code[(qr_y, qr_x)];
                            let is_dark = module == qrcode::Color::Dark;
                            qr_bytes[y * qr_pixel_size + x] = if is_dark { 0 } else { 255 };
                        }
                    }
                }

                let qr_image_xobject = ImageXObject {
                    width: Px(qr_pixel_size),
                    height: Px(qr_pixel_size),
                    color_space: ColorSpace::Greyscale,
                    bits_per_component: ColorBits::Bit8,
                    interpolate: true,
                    image_data: qr_bytes,
                    image_filter: None,
                    clipping_bbox: None,
                };

                let qr_image_wrapper = Image::from(qr_image_xobject);

                // Calculate QR code position
                let qr_pos_x = cell_x + Mm(label_width) - qr_size - padding;
                let qr_pos_y = cell_y_base + padding;

                let transform = ImageTransform {
                    translate_x: Some(qr_pos_x),
                    translate_y: Some(qr_pos_y),
                    scale_x: Some(qr_size.0),
                    scale_y: Some(qr_size.0),
                    rotate: None,
                    dpi: Some(300.0),
                };

                qr_image_wrapper.add_to_layer(current_layer.clone(), transform);
            }
        }
    }

    // Save to bytes
    let pdf_bytes = doc.save_to_bytes().map_err(|e| e.to_string())?;

    eprintln!("PDF generated successfully, size: {} bytes", pdf_bytes.len());

    // Encode to base64
    let base64_string = base64::engine::general_purpose::STANDARD.encode(&pdf_bytes);

    eprintln!("Base64 encoded size: {} bytes", base64_string.len());

    Ok(format!("data:application/pdf;base64,{}", base64_string))
}

/// Generate image labels (PNG format) with items in a grid layout
/// Each cell contains the item name (left) and QR code (right)
#[tauri::command]
pub async fn generate_image_labels(
    db: State<'_, DbPool>,
    item_ids: Vec<i32>,
    columns: i32,
    rows: i32,
    template: String,
    font_size: f32,
    show_fields: Vec<String>,
) -> Result<String, String> {
    eprintln!("Image generation requested: {} items, {}x{} grid, template: {}, font: {}, fields: {:?}", 
        item_ids.len(), columns, rows, template, font_size, show_fields);

    // Validate input
    if columns < 1 || rows < 1 || columns > 10 || rows > 10 {
        return Err("Invalid grid size. Columns and rows must be between 1 and 10".to_string());
    }

    // Get items
    let mut items_data = Vec::new();
    for item_id in &item_ids {
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

    eprintln!("Retrieved {} items from database", items_data.len());

    if items_data.is_empty() {
        return Err("No items found".to_string());
    }

    // Load Chinese font for text rendering
    let font_path = get_chinese_font_path()?;
    let font_data = std::fs::read(&font_path)
        .map_err(|e| format!("Failed to read font file {:?}: {}", font_path, e))?;
    let font = Font::try_from_vec(font_data)
        .ok_or("Failed to parse font data")?;

    // Calculate how many pages we need
    let labels_per_page = (columns * rows) as usize;
    let _total_pages = (items_data.len() + labels_per_page - 1) / labels_per_page;

    // Image dimensions (high resolution for printing)
    let dpi_scale = 4; // Scale factor for high resolution. Base 300x400 fits A4 roughly
    let cell_width = 400 * dpi_scale;
    let cell_height = 300 * dpi_scale;
    let img_width = cell_width * columns as u32;
    let img_height = cell_height * rows as u32;

    // Create image buffer for the first page (or only page)
    let mut img: RgbImage = ImageBuffer::new(img_width, img_height);

    // Fill background with white
    for pixel in img.pixels_mut() {
        *pixel = ImageRgb([255, 255, 255]);
    }

    // Draw items on the first page
    let start_idx = 0;
    let end_idx = std::cmp::min(labels_per_page, items_data.len());
    let page_items = &items_data[start_idx..end_idx];

    // Parse visible fields
    let show_name = show_fields.contains(&"name".to_string());
    let show_specs = show_fields.contains(&"specifications".to_string());
    let show_qty = show_fields.contains(&"quantity".to_string());
    let show_loc = show_fields.contains(&"location".to_string());
    let show_qr = show_fields.contains(&"qrCode".to_string());

    // Process each item
    for (idx, (item_id, name, specs, qty, unit, location, qr_id)) in page_items.iter().enumerate() {
        let row = (idx / columns as usize) as i32;
        let col = (idx % columns as usize) as i32;

        // Calculate cell position
        let cell_x = col as u32 * cell_width;
        let cell_y = row as u32 * cell_height;

        // Draw cell border (black)
        draw_rect(&mut img, cell_x, cell_y, cell_width, cell_height, ImageRgb([0, 0, 0]), 3);

        // Padding inside cell
        let padding = 20 * dpi_scale;

        // QR size
        let qr_size = if show_qr { 180 * dpi_scale } else { 0 };
        let text_area_width = if show_qr {
            cell_width - qr_size - padding * 3 // extra padding between text and QR
        } else {
            cell_width - padding * 2
        };

        // Text positions
        let mut text_y = (cell_y + padding) as f32;
        
        // Font sizes
        let base_size = font_size * dpi_scale as f32; // Scale font by DPI
        let title_size = if template == "compact" { base_size } else { base_size * 1.2 };
        let body_size = base_size * 0.9;
        let line_gap = body_size * 1.5;

        // Draw item name
        if show_name {
            let name_text = if name.len() > 15 {
                format!("{}...", &name[..15])
            } else {
                name.clone()
            };
            draw_text_chinese(&mut img, &font, &name_text, cell_x + padding, text_y, title_size);
            text_y += title_size + (10 * dpi_scale) as f32; // Gap
        }

        // Draw Specifications
        if show_specs && template != "compact" {
            if let Some(s) = specs {
                let spec_text = format!("规格: {}", &s.chars().take(20).collect::<String>());
                draw_text_chinese(&mut img, &font, &spec_text, cell_x + padding, text_y, body_size);
                text_y += line_gap;
            }
        }

        // Draw Quantity
        if show_qty {
            let unit_str = unit.as_ref().map(|s| s.as_str()).unwrap_or("个");
            let qty_text = format!("数量: {} {}", qty, unit_str);
            draw_text_chinese(&mut img, &font, &qty_text, cell_x + padding, text_y, body_size);
            text_y += line_gap;
        }

        // Draw Location
        if show_loc && template == "detailed" {
            if let Some(loc) = location {
                let loc_text = format!("位置: {}", &loc.chars().take(15).collect::<String>());
                draw_text_chinese(&mut img, &font, &loc_text, cell_x + padding, text_y, body_size);
            }
        }

        // Generate and draw QR code (right side)
        if show_qr {
            let qr_data = if let Some(qr_id) = qr_id {
                qr_id.clone()
            } else {
                item_id.to_string()
            };

            let qr_code = QrCode::new(&qr_data)
                .map_err(|e| format!("QR code generation failed: {}", e))?;

            let qr_x = cell_x + cell_width - qr_size - padding;
            let qr_y = cell_y + (cell_height - qr_size) / 2;

            draw_qr_code(&mut img, &qr_code, qr_x, qr_y, qr_size);
        }
    }

    // Encode to PNG
    let mut png_bytes = Vec::new();
    {
        let mut cursor = Cursor::new(&mut png_bytes);
        img.write_to(&mut cursor, image::ImageFormat::Png)
            .map_err(|e| format!("PNG encoding failed: {}", e))?;
    }

    eprintln!("PNG generated successfully, size: {} bytes", png_bytes.len());

    // Encode to base64
    let base64_string = base64::engine::general_purpose::STANDARD.encode(&png_bytes);

    eprintln!("Base64 encoded size: {} bytes", base64_string.len());

    Ok(format!("data:image/png;base64,{}", base64_string))
}

/// Draw a rectangle on the image
fn draw_rect(img: &mut RgbImage, x: u32, y: u32, width: u32, height: u32, color: ImageRgb<u8>, thickness: u32) {
    // Draw top and bottom borders
    for i in 0..thickness {
        for px in x..x + width {
            if px < img.width() {
                let _ = img.put_pixel(px, y + i, color);
                if y + height - i < img.height() {
                    let _ = img.put_pixel(px, y + height - i, color);
                }
            }
        }
    }
    // Draw left and right borders
    for i in 0..thickness {
        for py in y..y + height {
            if py < img.height() {
                let _ = img.put_pixel(x + i, py, color);
                if x + width - i < img.width() {
                    let _ = img.put_pixel(x + width - i, py, color);
                }
            }
        }
    }
}

/// Draw Chinese text on the image using rusttype
fn draw_text_chinese(img: &mut RgbImage, font: &Font, text: &str, x: u32, y: f32, font_size: f32) {
    let scale_font = Scale::uniform(font_size);

    // Calculate vertical positioning (text baseline)
    let v_metrics = font.v_metrics(scale_font);
    let baseline = y + v_metrics.ascent;

    let mut cursor_x = x as f32;

    for c in text.chars() {
        let glyph = font.glyph(c);
        let glyph = glyph.scaled(scale_font).positioned(point(cursor_x, baseline));
        let bbox = glyph.pixel_bounding_box();

        if let Some(bbox) = bbox {
            // Draw the glyph
            glyph.draw(|gx, gy, intensity| {
                let gx = gx as i32 + bbox.min.x;
                let gy = gy as i32 + bbox.min.y;

                // Convert intensity to grayscale (black text on white background)
                let pixel_value = (255.0 * (1.0 - intensity)) as u8;

                if gx >= 0 && gy >= 0 {
                    let px = gx as u32;
                    let py = gy as u32;

                    if px < img.width() && py < img.height() {
                        // Blend with existing pixel (simple multiply)
                        let existing = img.get_pixel(px, py)[0];
                        let new_val = ((existing as u16 * pixel_value as u16) / 255) as u8;
                        let _ = img.put_pixel(px, py, ImageRgb([new_val, new_val, new_val]));
                    }
                }
            });

            // Advance cursor
            cursor_x += glyph.unpositioned().h_metrics().advance_width;
        } else {
            // Fallback for characters without bounding box
            cursor_x += font_size * 0.5;
        }
    }
}

/// Draw QR code on the image
fn draw_qr_code(img: &mut RgbImage, qr_code: &QrCode, x: u32, y: u32, size: u32) {
    let qr_size = qr_code.width();
    let scale = size / qr_size as u32;

    for qr_y in 0..qr_size {
        for qr_x in 0..qr_size {
            let module = qr_code[(qr_y, qr_x)];
            let is_dark = module == qrcode::Color::Dark;

            for sy in 0..scale {
                for sx in 0..scale {
                    let px = x + qr_x as u32 * scale + sx;
                    let py = y + qr_y as u32 * scale + sy;
                    if px < img.width() && py < img.height() {
                        let color = if is_dark {
                            ImageRgb([0, 0, 0])
                        } else {
                            ImageRgb([255, 255, 255])
                        };
                        let _ = img.put_pixel(px, py, color);
                    }
                }
            }
        }
    }
}
