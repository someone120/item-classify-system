use tauri::AppHandle;

pub mod models;

pub fn init(_app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Database is initialized by tauri-plugin-sql migrations
    Ok(())
}
