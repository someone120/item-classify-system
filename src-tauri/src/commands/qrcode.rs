use crate::database::models::QRCodeResult;
use base64::Engine;
use qrcode::QrCode;
use tauri_plugin_sql::SqlitePool;

#[tauri::command]
pub async fn generate_location_qr(
    db: tauri::State<'_, SqlitePool>,
    location_id: i32,
) -> Result<String, String> {
    // Get location details
    let result = db
        .execute(
            "SELECT id, name, qr_code_id FROM locations WHERE id = $1",
            vec![location_id.into()],
        )
        .await
        .map_err(|e| e.to_string())?;

    if result.is_empty() {
        return Err("Location not found".to_string());
    }

    let row = &result[0];
    let id: i32 = row.get("id").unwrap_or(0);
    let name: String = row.get("name").unwrap_or_default();
    let qr_code_id: String = row.get("qr_code_id").unwrap_or_default();

    // Generate QR code
    let qr_code = QrCode::new(qr_code_id.clone()).map_err(|e| e.to_string())?;
    let image = qr_code.render::<image::Luma<u8>>().build();

    // Convert to PNG
    let mut buffer = vec![];
    let mut cursor = std::io::Cursor::new(&mut buffer);
    image.write_to(&mut cursor, image::ImageFormat::Png)
        .map_err(|e| e.to_string())?;

    // Encode to base64
    let base64_string = base64::engine::general_purpose::STANDARD.encode(&buffer);

    Ok(format!("data:image/png;base64,{}", base64_string))
}

#[tauri::command]
pub async fn generate_batch_qr(
    db: tauri::State<'_, SqlitePool>,
    location_ids: Vec<i32>,
) -> Result<Vec<QRCodeResult>, String> {
    let mut results = vec![];

    for location_id in location_ids {
        let result = db
            .execute(
                "SELECT id, name, qr_code_id FROM locations WHERE id = $1",
                vec![location_id.into()],
            )
            .await
            .map_err(|e| e.to_string())?;

        if !result.is_empty() {
            let row = &result[0];
            let id: i32 = row.get("id").unwrap_or(0);
            let name: String = row.get("name").unwrap_or_default();
            let qr_code_id: String = row.get("qr_code_id").unwrap_or_default();

            // Generate QR code
            let qr_code = QrCode::new(qr_code_id.clone()).map_err(|e| e.to_string())?;
            let image = qr_code.render::<image::Luma<u8>>().build();

            // Convert to PNG
            let mut buffer = vec![];
            let mut cursor = std::io::Cursor::new(&mut buffer);
            image.write_to(&mut cursor, image::ImageFormat::Png)
                .map_err(|e| e.to_string())?;

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
