use crate::database::{models::{Item, ItemFilter, ItemInput}, query_all, query_one, execute, execute_with_optional};
use crate::database::DbPool;
use tauri::State;
use sqlx::Row;

#[tauri::command]
pub async fn get_items(
    db: State<'_, DbPool>,
    filter: Option<ItemFilter>,
) -> Result<Vec<Item>, String> {
    let mut query = String::from(
        "SELECT id, name, category, specifications, quantity, unit, location_id, min_quantity, notes, image_path, created_at, updated_at FROM items WHERE 1=1"
    );
    let mut params: Vec<String> = vec![];
    let mut param_count = 0;

    if let Some(f) = &filter {
        if let Some(category) = &f.category {
            param_count += 1;
            query.push_str(&format!(" AND category = ?{}", param_count));
            params.push(category.clone());
        }
        if let Some(location_id) = f.location_id {
            param_count += 1;
            query.push_str(&format!(" AND location_id = ?{}", param_count));
            params.push(location_id.to_string());
        }
        if let Some(search) = &f.search {
            param_count += 1;
            query.push_str(&format!(" AND (name LIKE ?{} OR specifications LIKE ?{})", param_count, param_count));
            params.push(format!("%{}%", search));
        }
    }

    query.push_str(" ORDER BY name");

    let result = query_all(&db, &query, params)
        .await
        .map_err(|e| e.to_string())?;

    let items: Vec<Item> = result
        .iter()
        .map(|row| Item {
            id: row.get("id"),
            name: row.get("name"),
            category: row.try_get("category").ok(),
            specifications: row.try_get("specifications").ok(),
            quantity: row.get("quantity"),
            unit: row.try_get("unit").ok(),
            location_id: row.try_get("location_id").ok(),
            min_quantity: row.try_get("min_quantity").ok(),
            notes: row.try_get("notes").ok(),
            image_path: row.try_get("image_path").ok(),
            created_at: row.get("created_at"),
            updated_at: row.get("updated_at"),
        })
        .collect();

    Ok(items)
}

#[tauri::command]
pub async fn create_item(
    db: State<'_, DbPool>,
    item: ItemInput,
) -> Result<i32, String> {
    let _result = execute_with_optional(
        &db,
        "INSERT INTO items (name, category, specifications, quantity, unit, location_id, min_quantity, notes, image_path) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        vec![
            Some(item.name.clone()),
            item.category.clone(),
            item.specifications.clone(),
            Some(item.quantity.to_string()),
            item.unit.clone(),
            item.location_id.map(|v| v.to_string()),
            item.min_quantity.map(|v| v.to_string()),
            item.notes.clone(),
            item.image_path.clone(),
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

    let id: i32 = match result {
        Some(row) => row.get("id"),
        None => return Err("Failed to get inserted ID".to_string()),
    };

    // Log initial quantity
    execute(
        &db,
        "INSERT INTO inventory_log (item_id, quantity_change, quantity_after, operation_type, source) VALUES (?1, ?2, ?3, ?4, ?5)",
        vec![
            id.to_string(),
            item.quantity.to_string(),
            item.quantity.to_string(),
            "add".to_string(),
            "manual".to_string(),
        ],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn update_item(
    db: State<'_, DbPool>,
    id: i32,
    item: ItemInput,
) -> Result<(), String> {
    execute_with_optional(
        &db,
        "UPDATE items SET name = ?1, category = ?2, specifications = ?3, quantity = ?4, unit = ?5, location_id = ?6, min_quantity = ?7, notes = ?8, image_path = ?9, updated_at = CURRENT_TIMESTAMP WHERE id = ?10",
        vec![
            Some(item.name),
            item.category,
            item.specifications,
            Some(item.quantity.to_string()),
            item.unit,
            item.location_id.map(|v| v.to_string()),
            item.min_quantity.map(|v| v.to_string()),
            item.notes,
            item.image_path,
            Some(id.to_string()),
        ],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn delete_item(
    db: State<'_, DbPool>,
    id: i32,
) -> Result<(), String> {
    execute(
        &db,
        "DELETE FROM items WHERE id = ?1",
        vec![id.to_string()],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn update_quantity(
    db: State<'_, DbPool>,
    item_id: i32,
    change: i32,
    operation_type: String,
) -> Result<(), String> {
    // Get current quantity
    let result = query_one(
        &db,
        "SELECT quantity FROM items WHERE id = ?1",
        vec![item_id.to_string()],
    )
    .await
    .map_err(|e| e.to_string())?;

    let current_quantity: i32 = match result {
        Some(row) => row.get("quantity"),
        None => return Err("Item not found".to_string()),
    };

    let new_quantity = current_quantity + change;

    if new_quantity < 0 {
        return Err("Insufficient quantity".to_string());
    }

    // Update quantity
    execute(
        &db,
        "UPDATE items SET quantity = ?1, updated_at = CURRENT_TIMESTAMP WHERE id = ?2",
        vec![new_quantity.to_string(), item_id.to_string()],
    )
    .await
    .map_err(|e| e.to_string())?;

    // Log the change
    execute(
        &db,
        "INSERT INTO inventory_log (item_id, quantity_change, quantity_after, operation_type, source) VALUES (?1, ?2, ?3, ?4, ?5)",
        vec![
            item_id.to_string(),
            change.to_string(),
            new_quantity.to_string(),
            operation_type.clone(),
            "manual".to_string(),
        ],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}
