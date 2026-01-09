use crate::database::{models::QRCodeResult, query_one};
use crate::database::DbPool;
use base64::Engine;
use qrcode::QrCode;
use tauri::State;
use sqlx::Row;

#[tauri::command]
pub async fn generate_location_qr(
    db: State<'_, DbPool>,
    location_id: i32,
) -> Result<String, String> {
    // Get location details
    let result = query_one(
        &db,
        "SELECT id, name, qr_code_id FROM locations WHERE id = ?1",
        vec![location_id.to_string()],
    )
    .await
    .map_err(|e| e.to_string())?;

    let (_id, _name, qr_code_id) = match result {
        Some(row) => (
            row.get::<i32, _>("id"),
            row.get::<String, _>("name"),
            row.get::<String, _>("qr_code_id"),
        ),
        None => return Err("Location not found".to_string()),
    };

    // Generate QR code
    let qr_code = QrCode::new(qr_code_id.clone()).map_err(|e: qrcode::types::QrError| e.to_string())?;

    // Render to image buffer manually
    let size = qr_code.width();
    let mut image_data = vec![0u8; size * size];
    for (y, row) in qr_code.render::<char>().build().lines().enumerate() {
        for (x, ch) in row.chars().enumerate() {
            if ch == '█' || ch == '▀' || ch == '▄' || ch == '■' {
                image_data[y * size + x] = 0;
            } else {
                image_data[y * size + x] = 255;
            }
        }
    }

    // Create image from buffer
    let image = image::GrayImage::from_raw(size as u32, size as u32, image_data)
        .unwrap();

    // Convert to PNG
    let mut buffer = vec![];
    let mut cursor = std::io::Cursor::new(&mut buffer);
    image.write_to(&mut cursor, image::ImageFormat::Png)
        .map_err(|e: image::error::ImageError| e.to_string())?;

    // Encode to base64
    let base64_string = base64::engine::general_purpose::STANDARD.encode(&buffer);

    Ok(format!("data:image/png;base64,{}", base64_string))
}

#[tauri::command]
pub async fn generate_batch_qr(
    db: State<'_, DbPool>,
    location_ids: Vec<i32>,
) -> Result<Vec<QRCodeResult>, String> {
    let mut results = vec![];

    for location_id in location_ids {
        let result = query_one(
            &db,
            "SELECT id, name, qr_code_id FROM locations WHERE id = ?1",
            vec![location_id.to_string()],
        )
        .await
        .map_err(|e| e.to_string())?;

        if let Some(row) = result {
            let id: i32 = row.get("id");
            let name: String = row.get("name");
            let qr_code_id: String = row.get("qr_code_id");

            // Generate QR code
            let qr_code = QrCode::new(qr_code_id.clone()).map_err(|e: qrcode::types::QrError| e.to_string())?;

            // Render to image buffer manually
            let size = qr_code.width();
            let mut image_data = vec![0u8; size * size];
            for (y, row) in qr_code.render::<char>().build().lines().enumerate() {
                for (x, ch) in row.chars().enumerate() {
                    if ch == '█' || ch == '▀' || ch == '▄' || ch == '■' {
                        image_data[y * size + x] = 0;
                    } else {
                        image_data[y * size + x] = 255;
                    }
                }
            }

            // Create image from buffer
            let image = image::GrayImage::from_raw(size as u32, size as u32, image_data)
                .unwrap();

            // Convert to PNG
            let mut buffer = vec![];
            let mut cursor = std::io::Cursor::new(&mut buffer);
            image.write_to(&mut cursor, image::ImageFormat::Png)
                .map_err(|e: image::error::ImageError| e.to_string())?;

            // Encode to base64
            let base64_string = base64::engine::general_purpose::STANDARD.encode(&buffer);

            results.push(QRCodeResult {
                id,
                qr_data: format!("data:image/png;base64,{}", base64_string),
                name,
            });
        }
    }

    Ok(results)
}
