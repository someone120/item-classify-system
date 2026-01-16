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
        .create_if_missing(true);

    let pool = SqlitePool::connect_with(options).await.unwrap();

    TestDb { _dir: dir, pool }
}

async fn run_migrations(pool: &SqlitePool) {
    let migration_sql_1 = include_str!("../migrations/1_initial.sql");
    let migration_sql_2 = include_str!("../migrations/2_fix_parent_id.sql");

    sqlx::query(migration_sql_1).execute(pool).await.unwrap();
    sqlx::query(migration_sql_2).execute(pool).await.unwrap();
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
