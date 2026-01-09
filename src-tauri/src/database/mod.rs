use tauri::{AppHandle, Manager};
use std::sync::Arc;
use sqlx::SqlitePool;

pub mod models;

pub type DbPool = Arc<SqlitePool>;

/// Execute a query and return all rows
pub async fn query_all(pool: &DbPool, sql: &str, params: Vec<String>) -> Result<Vec<sqlx::sqlite::SqliteRow>, sqlx::Error> {
    let mut query = sqlx::query(sql);
    for param in params {
        query = query.bind(param);
    }
    query.fetch_all(&**pool).await
}

/// Execute a query and return the first row
pub async fn query_one(pool: &DbPool, sql: &str, params: Vec<String>) -> Result<Option<sqlx::sqlite::SqliteRow>, sqlx::Error> {
    let mut query = sqlx::query(sql);
    for param in params {
        query = query.bind(param);
    }
    query.fetch_optional(&**pool).await
}

/// Execute a query and return the number of affected rows
pub async fn execute(pool: &DbPool, sql: &str, params: Vec<String>) -> Result<u64, sqlx::Error> {
    let mut query = sqlx::query(sql);
    for param in params {
        query = query.bind(param);
    }
    query.execute(&**pool).await.map(|r| r.rows_affected())
}

/// Execute a query with optional parameters (can handle NULL values)
pub async fn execute_with_optional(
    pool: &DbPool,
    sql: &str,
    params: Vec<Option<String>>,
) -> Result<u64, sqlx::Error> {
    let mut query = sqlx::query(sql);
    for param in params {
        query = query.bind(param);
    }
    query.execute(&**pool).await.map(|r| r.rows_affected())
}

pub async fn get_pool(app: &AppHandle) -> Option<DbPool> {
    app.try_state::<DbPool>().map(|state| state.inner().clone())
}

pub async fn init(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    use sqlx::sqlite::SqliteConnectOptions;

    // Get app data directory
    let app_data_dir = app.path().app_data_dir()?;

    // Create directory if it doesn't exist
    std::fs::create_dir_all(&app_data_dir)?;

    // Create database path
    let db_path = app_data_dir.join("item_classify_system.db");

    eprintln!("Database path: {}", db_path.display());
    eprintln!("App data dir: {}", app_data_dir.display());
    eprintln!("Directory exists: {}", app_data_dir.exists());

    // Use SqliteConnectOptions for better Windows path handling
    let options = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true);

    let pool = SqlitePool::connect_with(options).await?;

    eprintln!("Database connected successfully");

    // Run migrations manually using the migration SQL
    let migration_sql_1 = include_str!("../../migrations/1_initial.sql");
    sqlx::query(migration_sql_1).execute(&pool).await?;

    // Run migration to fix parent_id = 0 values - do this every time to ensure data consistency
    let migration_sql_2 = include_str!("../../migrations/2_fix_parent_id.sql");
    let result = sqlx::query(migration_sql_2).execute(&pool).await?;
    eprintln!("Fixed {} locations with parent_id = 0", result.rows_affected());

    eprintln!("Migrations executed successfully");

    // Store pool in app state
    app.manage(DbPool::new(pool));

    Ok(())
}
