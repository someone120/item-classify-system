use crate::database::models::{Item, ItemFilter, ItemInput};
use tauri_plugin_sql::SqlitePool;

#[tauri::command]
pub async fn get_items(
    db: tauri::State<'_, SqlitePool>,
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
            query.push_str(&format!(" AND category = ${}", param_count));
            params.push(category.clone());
        }
        if let Some(location_id) = f.location_id {
            param_count += 1;
            query.push_str(&format!(" AND location_id = ${}", param_count));
            params.push(location_id.to_string());
        }
        if let Some(search) = &f.search {
            param_count += 1;
            query.push_str(&format!(" AND (name LIKE ${} OR specifications LIKE ${})", param_count, param_count));
            params.push(format!("%{}%", search));
        }
    }

    query.push_str(" ORDER BY name");

    let param_values: Vec<_> = params.iter().map(|s| s.as_str().into()).collect();

    let result = db
        .execute(&query, param_values)
        .await
        .map_err(|e| e.to_string())?;

    let items: Vec<Item> = result
        .iter()
        .map(|row| Item {
            id: row.get("id").unwrap_or(0),
            name: row.get("name").unwrap_or_default(),
            category: row.get("category").ok(),
            specifications: row.get("specifications").ok(),
            quantity: row.get("quantity").unwrap_or(0),
            unit: row.get("unit").ok(),
            location_id: row.get("location_id").ok(),
            min_quantity: row.get("min_quantity").ok(),
            notes: row.get("notes").ok(),
            image_path: row.get("image_path").ok(),
            created_at: row.get("created_at").unwrap_or_default(),
            updated_at: row.get("updated_at").unwrap_or_default(),
        })
        .collect();

    Ok(items)
}

#[tauri::command]
pub async fn create_item(
    db: tauri::State<'_, SqlitePool>,
    item: ItemInput,
) -> Result<i32, String> {
    let result = db
        .execute(
            "INSERT INTO items (name, category, specifications, quantity, unit, location_id, min_quantity, notes, image_path) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id",
            vec![
                item.name.into(),
                item.category.map(|v| v.into()),
                item.specifications.map(|v| v.into()),
                item.quantity.into(),
                item.unit.map(|v| v.into()),
                item.location_id.map(|v| v.into()),
                item.min_quantity.map(|v| v.into()),
                item.notes.map(|v| v.into()),
                item.image_path.map(|v| v.into()),
            ],
        )
        .await
        .map_err(|e| e.to_string())?;

    let id: i32 = result[0].get("id").unwrap_or(0);

    // Log initial quantity
    db.execute(
        "INSERT INTO inventory_log (item_id, quantity_change, quantity_after, operation_type, source) VALUES ($1, $2, $3, $4, $5)",
        vec![
            id.into(),
            item.quantity.into(),
            item.quantity.into(),
            "add".into(),
            "manual".into(),
        ],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn update_item(
    db: tauri::State<'_, SqlitePool>,
    id: i32,
    item: ItemInput,
) -> Result<(), String> {
    db.execute(
        "UPDATE items SET name = $1, category = $2, specifications = $3, quantity = $4, unit = $5, location_id = $6, min_quantity = $7, notes = $8, image_path = $9, updated_at = CURRENT_TIMESTAMP WHERE id = $10",
        vec![
            item.name.into(),
            item.category.map(|v| v.into()),
            item.specifications.map(|v| v.into()),
            item.quantity.into(),
            item.unit.map(|v| v.into()),
            item.location_id.map(|v| v.into()),
            item.min_quantity.map(|v| v.into()),
            item.notes.map(|v| v.into()),
            item.image_path.map(|v| v.into()),
            id.into(),
        ],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn delete_item(
    db: tauri::State<'_, SqlitePool>,
    id: i32,
) -> Result<(), String> {
    db.execute(
        "DELETE FROM items WHERE id = $1",
        vec![id.into()],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn update_quantity(
    db: tauri::State<'_, SqlitePool>,
    item_id: i32,
    change: i32,
    operation_type: String,
) -> Result<(), String> {
    // Get current quantity
    let result = db
        .execute(
            "SELECT quantity FROM items WHERE id = $1",
            vec![item_id.into()],
        )
        .await
        .map_err(|e| e.to_string())?;

    if result.is_empty() {
        return Err("Item not found".to_string());
    }

    let current_quantity: i32 = result[0].get("quantity").unwrap_or(0);
    let new_quantity = current_quantity + change;

    if new_quantity < 0 {
        return Err("Insufficient quantity".to_string());
    }

    // Update quantity
    db.execute(
        "UPDATE items SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
        vec![new_quantity.into(), item_id.into()],
    )
    .await
    .map_err(|e| e.to_string())?;

    // Log the change
    db.execute(
        "INSERT INTO inventory_log (item_id, quantity_change, quantity_after, operation_type, source) VALUES ($1, $2, $3, $4, $5)",
        vec![
            item_id.into(),
            change.into(),
            new_quantity.into(),
            operation_type.clone().into(),
            "manual".into(),
        ],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}
