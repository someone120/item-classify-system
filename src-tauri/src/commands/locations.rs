use crate::database::{models::{Location, LocationInput}, query_all, query_one, execute, execute_with_optional};
use crate::database::DbPool;
use tauri::State;
use sqlx::Row;

#[tauri::command]
pub async fn get_locations(
    db: State<'_, DbPool>,
) -> Result<Vec<Location>, String> {
    let result = query_all(
        &db,
        "SELECT id, name, parent_id, location_type, description, qr_code_id, created_at, updated_at FROM locations ORDER BY name",
        vec![],
    )
    .await
    .map_err(|e| e.to_string())?;

    eprintln!("Query returned {} rows", result.len());

    let locations: Vec<Location> = result
        .iter()
        .map(|row| {
            // Handle NULL parent_id properly - convert 0 to None
            let parent_id: Option<i32> = row.try_get("parent_id").ok();
            let parent_id = parent_id.and_then(|v| if v == 0 { None } else { Some(v) });

            Location {
                id: row.get("id"),
                name: row.get("name"),
                parent_id,
                location_type: row.get("location_type"),
                description: row.try_get("description").ok(),
                qr_code_id: row.try_get("qr_code_id").ok(),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            }
        })
        .collect();

    eprintln!("Serialized locations: {:?}", locations);

    Ok(locations)
}

#[tauri::command]
pub async fn create_location(
    db: State<'_, DbPool>,
    input: LocationInput,
) -> Result<i32, String> {
    let qr_code_id = format!("LOC-{}", uuid::Uuid::new_v4().to_string().split('-').next().unwrap());

    // Convert parent_id: Some(0) to None for root locations
    let parent_id = input.parent_id.and_then(|v| if v == 0 { None } else { Some(v) });

    let _result = execute_with_optional(
        &db,
        "INSERT INTO locations (name, parent_id, location_type, description, qr_code_id) VALUES (?1, ?2, ?3, ?4, ?5)",
        vec![
            Some(input.name),
            parent_id.map(|v| v.to_string()),
            Some(input.location_type),
            input.description,
            Some(qr_code_id.clone()),
        ],
    )
    .await
    .map_err(|e| e.to_string())?;

    // Get the last inserted id
    let result = query_one(
        &db,
        "SELECT last_insert_rowid() as id",
        vec![],
    )
    .await
    .map_err(|e| e.to_string())?;

    match result {
        Some(row) => Ok(row.get("id")),
        None => Err("Failed to get inserted ID".to_string()),
    }
}

#[tauri::command]
pub async fn update_location(
    db: State<'_, DbPool>,
    id: i32,
    name: String,
    description: Option<String>,
) -> Result<(), String> {
    execute_with_optional(
        &db,
        "UPDATE locations SET name = ?1, description = ?2, updated_at = CURRENT_TIMESTAMP WHERE id = ?3",
        vec![
            Some(name),
            description,
            Some(id.to_string()),
        ],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn delete_location(
    db: State<'_, DbPool>,
    id: i32,
) -> Result<(), String> {
    execute(
        &db,
        "DELETE FROM locations WHERE id = ?1",
        vec![id.to_string()],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn get_location_by_qr(
    db: State<'_, DbPool>,
    qr_code_id: String,
) -> Result<Location, String> {
    let result = query_one(
        &db,
        "SELECT id, name, parent_id, location_type, description, qr_code_id, created_at, updated_at FROM locations WHERE qr_code_id = ?1",
        vec![qr_code_id],
    )
    .await
    .map_err(|e| e.to_string())?;

    match result {
        Some(row) => {
            // Handle NULL parent_id properly - convert 0 to None
            let parent_id: Option<i32> = row.try_get("parent_id").ok();
            let parent_id = parent_id.and_then(|v| if v == 0 { None } else { Some(v) });

            Ok(Location {
                id: row.get("id"),
                name: row.get("name"),
                parent_id,
                location_type: row.get("location_type"),
                description: row.try_get("description").ok(),
                qr_code_id: row.try_get("qr_code_id").ok(),
                created_at: row.get("created_at"),
                updated_at: row.get("updated_at"),
            })
        },
        None => Err("Location not found".to_string()),
    }
}
