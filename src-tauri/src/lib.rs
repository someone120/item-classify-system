// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod database;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            tauri::async_runtime::block_on(async {
                // Initialize database on first run
                database::init(app.handle()).await?;
                Ok::<(), Box<dyn std::error::Error>>(())
            })?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::locations::get_locations,
            commands::locations::create_location,
            commands::locations::update_location,
            commands::locations::delete_location,
            commands::locations::get_location_by_qr,
            commands::items::get_items,
            commands::items::create_item,
            commands::items::update_item,
            commands::items::delete_item,
            commands::items::update_quantity,
            commands::qrcode::generate_location_qr,
            commands::qrcode::generate_batch_qr,
            commands::pdf::generate_pdf_labels,
            commands::sync::configure_webdav,
            commands::sync::configure_s3,
            commands::sync::sync_upload,
            commands::sync::sync_download,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
