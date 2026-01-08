use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Location {
    pub id: i32,
    pub name: String,
    pub parent_id: Option<i32>,
    pub location_type: String,
    pub description: Option<String>,
    pub qr_code_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Item {
    pub id: i32,
    pub name: String,
    pub category: Option<String>,
    pub specifications: Option<String>,
    pub quantity: i32,
    pub unit: Option<String>,
    pub location_id: Option<i32>,
    pub min_quantity: Option<i32>,
    pub notes: Option<String>,
    pub image_path: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct InventoryLog {
    pub id: i32,
    pub item_id: i32,
    pub quantity_change: i32,
    pub quantity_after: i32,
    pub operation_type: String,
    pub source: String,
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LocationInput {
    pub name: String,
    pub parent_id: Option<i32>,
    pub location_type: String,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ItemInput {
    pub name: String,
    pub category: Option<String>,
    pub specifications: Option<String>,
    pub quantity: i32,
    pub unit: Option<String>,
    pub location_id: Option<i32>,
    pub min_quantity: Option<i32>,
    pub notes: Option<String>,
    pub image_path: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ItemFilter {
    pub category: Option<String>,
    pub location_id: Option<i32>,
    pub search: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QRCodeResult {
    pub id: i32,
    pub qr_data: String,
    pub name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SyncResult {
    pub success: bool,
    pub message: String,
    pub timestamp: String,
}
