use sqlx::{sqlite::SqliteConnectOptions, SqlitePool};
use tempfile::{tempdir, TempDir};

struct TestDb {
    _dir: TempDir,
    pool: SqlitePool,
}

async fn setup_pool() -> TestDb {
    let dir = tempdir().unwrap();
    let db_path = dir.path().join("test.db");
    let options = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true)
        .foreign_keys(false);

    let pool = SqlitePool::connect_with(options).await.unwrap();

    TestDb { _dir: dir, pool }
}

async fn run_migrations(pool: &SqlitePool) {
    let migration_sql_1 = include_str!("../migrations/1_initial.sql");
    let migration_sql_2 = include_str!("../migrations/2_fix_parent_id.sql");

    sqlx::query(migration_sql_1).execute(pool).await.unwrap();
    sqlx::query(migration_sql_2).execute(pool).await.unwrap();
}

async fn insert_location(pool: &SqlitePool, name: &str) -> i64 {
    let result = sqlx::query("INSERT INTO locations (name, location_type) VALUES (?1, 'box')")
        .bind(name)
        .execute(pool)
        .await
        .unwrap();

    result.last_insert_rowid()
}

#[tokio::test]
async fn migrations_create_tables() {
    let db = setup_pool().await;
    run_migrations(&db.pool).await;

    let tables: Vec<(String,)> = sqlx::query_as(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='locations'",
    )
    .fetch_all(&db.pool)
    .await
    .unwrap();

    assert_eq!(tables.len(), 1);
}

#[tokio::test]
async fn fixes_parent_id_zero_to_null() {
    let db = setup_pool().await;
    let migration_sql_1 = include_str!("../migrations/1_initial.sql");
    sqlx::query(migration_sql_1)
        .execute(&db.pool)
        .await
        .unwrap();

    sqlx::query("INSERT INTO locations (name, parent_id, location_type) VALUES ('root', 0, 'box')")
        .execute(&db.pool)
        .await
        .unwrap();

    let migration_sql_2 = include_str!("../migrations/2_fix_parent_id.sql");
    sqlx::query(migration_sql_2)
        .execute(&db.pool)
        .await
        .unwrap();

    let parent: Option<i64> = sqlx::query_scalar("SELECT parent_id FROM locations WHERE name = 'root'")
        .fetch_one(&db.pool)
        .await
        .unwrap();

    assert!(parent.is_none());
}

#[tokio::test]
async fn inserts_location_and_item() {
    let db = setup_pool().await;
    run_migrations(&db.pool).await;

    let location_id = insert_location(&db.pool, "A1").await;

    sqlx::query("INSERT INTO items (name, quantity, location_id) VALUES ('电阻', 10, ?1)")
        .bind(location_id)
        .execute(&db.pool)
        .await
        .unwrap();

    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM items WHERE location_id = ?1")
        .bind(location_id)
        .fetch_one(&db.pool)
        .await
        .unwrap();

    assert_eq!(count, 1);
}
