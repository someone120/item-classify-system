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

pub async fn get_pool(app: &AppHandle) -> Option<DbPool> {
    app.try_state::<DbPool>().map(|state| state.inner().clone())
}

pub async fn init(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    // Create database connection pool
    let pool = SqlitePool::connect("sqlite:item_classify_system.db").await?;

    // Run migrations manually using the migration SQL
    let migration_sql = include_str!("../../migrations/1_initial.sql");
    sqlx::query(migration_sql).execute(&pool).await?;

    // Store pool in app state
    app.manage(DbPool::new(pool));

    Ok(())
}
