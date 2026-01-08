use crate::database::models::{Location, LocationInput};
use serde_json::Value;
use tauri_plugin_sql::SqlitePool;

#[tauri::command]
pub async fn get_locations(
    db: tauri::State<'_, SqlitePool>,
) -> Result<Vec<Location>, String> {
    let result = db
        .execute(
            "SELECT id, name, parent_id, location_type, description, qr_code_id, created_at, updated_at FROM locations ORDER BY name",
            vec![],
        )
        .await
        .map_err(|e| e.to_string())?;

    let locations: Vec<Location> = result
        .iter()
        .map(|row| Location {
            id: row.get("id").unwrap_or(0),
            name: row.get("name").unwrap_or_default(),
            parent_id: row.get("parent_id").ok(),
            location_type: row.get("location_type").unwrap_or_default(),
            description: row.get("description").ok(),
            qr_code_id: row.get("qr_code_id").ok(),
            created_at: row.get("created_at").unwrap_or_default(),
            updated_at: row.get("updated_at").unwrap_or_default(),
        })
        .collect();

    Ok(locations)
}

#[tauri::command]
pub async fn create_location(
    db: tauri::State<'_, SqlitePool>,
    input: LocationInput,
) -> Result<i32, String> {
    let qr_code_id = format!("LOC-{}", uuid::Uuid::new_v4().to_string().split('-').next().unwrap());

    let result = db
        .execute(
            "INSERT INTO locations (name, parent_id, location_type, description, qr_code_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
            vec![
                input.name.into(),
                input.parent_id.map(|v| v.into()),
                input.location_type.into(),
                input.description.map(|v| v.into()),
                qr_code_id.into(),
            ],
        )
        .await
        .map_err(|e| e.to_string())?;

    let id: i32 = result[0].get("id").unwrap_or(0);
    Ok(id)
}

#[tauri::command]
pub async fn update_location(
    db: tauri::State<'_, SqlitePool>,
    id: i32,
    name: String,
    description: Option<String>,
) -> Result<(), String> {
    db.execute(
        "UPDATE locations SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
        vec![
            name.into(),
            description.map(|v| v.into()),
            id.into(),
        ],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn delete_location(
    db: tauri::State<'_, SqlitePool>,
    id: i32,
) -> Result<(), String> {
    db.execute(
        "DELETE FROM locations WHERE id = $1",
        vec![id.into()],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_location_by_qr(
    db: tauri::State<'_, SqlitePool>,
    qr_code_id: String,
) -> Result<Location, String> {
    let result = db
        .execute(
            "SELECT id, name, parent_id, location_type, description, qr_code_id, created_at, updated_at FROM locations WHERE qr_code_id = $1",
            vec![qr_code_id.into()],
        )
        .await
        .map_err(|e| e.to_string())?;

    if result.is_empty() {
        return Err("Location not found".to_string());
    }

    let row = &result[0];
    Ok(Location {
        id: row.get("id").unwrap_or(0),
        name: row.get("name").unwrap_or_default(),
        parent_id: row.get("parent_id").ok(),
        location_type: row.get("location_type").unwrap_or_default(),
        description: row.get("description").ok(),
        qr_code_id: row.get("qr_code_id").ok(),
        created_at: row.get("created_at").unwrap_or_default(),
        updated_at: row.get("updated_at").unwrap_or_default(),
    })
}
