use crate::database::models::SyncResult;
use crate::database::{execute, query_one, DbPool};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::Row;
use tauri::{AppHandle, Manager, State};

#[derive(Debug, Serialize, Deserialize)]
pub struct WebDavConfig {
    url: String,
    username: String,
    password: String,
    path: String,
}

async fn save_webdav_config(_db: &DbPool, _cfg: &WebDavConfig) -> Result<(), String> {
    let config_json = serde_json::to_string(_cfg).map_err(|e| e.to_string())?;
    execute(
        _db,
        "DELETE FROM sync_config WHERE sync_type = ?1",
        vec!["webdav".to_string()],
    )
    .await
    .map_err(|e| e.to_string())?;
    execute(
        _db,
        "INSERT INTO sync_config (sync_type, enabled, config, updated_at) VALUES (?1, 1, ?2, CURRENT_TIMESTAMP)",
        vec!["webdav".to_string(), config_json],
    )
    .await
    .map_err(|e| e.to_string())?;
    Ok(())
}

async fn load_webdav_config(_db: &DbPool) -> Result<Option<WebDavConfig>, String> {
    let result = query_one(
        _db,
        "SELECT config FROM sync_config WHERE sync_type = ?1 ORDER BY updated_at DESC LIMIT 1",
        vec!["webdav".to_string()],
    )
    .await
    .map_err(|e| e.to_string())?;

    match result {
        Some(row) => {
            let config_json: String = row.get("config");
            let cfg = serde_json::from_str::<WebDavConfig>(&config_json)
                .map_err(|e| e.to_string())?;
            Ok(Some(cfg))
        }
        None => Ok(None),
    }
}

async fn get_webdav_config_for_db(_db: &DbPool) -> Result<Option<WebDavConfig>, String> {
    load_webdav_config(_db).await
}

fn build_webdav_file_url(base: &str, path: &str, filename: &str) -> Result<String, String> {
    let mut url = reqwest::Url::parse(base).map_err(|e| e.to_string())?;
    let mut segments: Vec<String> = url
        .path_segments()
        .map(|s| s.filter(|p| !p.is_empty()).map(|s| s.to_string()).collect())
        .unwrap_or_default();
    if !path.trim().is_empty() {
        segments.extend(path.trim_matches('/').split('/').map(|s| s.to_string()));
    }
    segments.push(filename.to_string());
    url.set_path(&segments.join("/"));
    Ok(url.to_string())
}

async fn upload_webdav_file(cfg: &WebDavConfig, db_path: &std::path::Path) -> Result<(), String> {
    let file_name = db_path
        .file_name()
        .and_then(|v| v.to_str())
        .ok_or("Invalid database filename")?;
    let target = build_webdav_file_url(&cfg.url, &cfg.path, file_name)?;
    let body = tokio::fs::read(db_path).await.map_err(|e| e.to_string())?;

    let client = reqwest::Client::new();
    let resp = client
        .put(target)
        .basic_auth(&cfg.username, Some(&cfg.password))
        .body(body)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(format!("WebDAV 上传失败: {}", resp.status()));
    }
    Ok(())
}

async fn sync_upload_with_db_path(
    _db: &DbPool,
    _sync_type: &str,
    _db_path: std::path::PathBuf,
) -> Result<SyncResult, String> {
    if _sync_type != "webdav" {
        return Err("Only WebDAV is supported for now".to_string());
    }
    let cfg = load_webdav_config(_db).await?.ok_or("WebDAV 未配置")?;
    upload_webdav_file(&cfg, &_db_path).await?;
    execute(
        _db,
        "UPDATE sync_config SET last_sync_time = CURRENT_TIMESTAMP WHERE sync_type = ?1",
        vec!["webdav".to_string()],
    )
    .await
    .map_err(|e| e.to_string())?;

    Ok(SyncResult {
        success: true,
        message: "WebDAV 上传完成".to_string(),
        timestamp: Utc::now().to_rfc3339(),
    })
}

#[tauri::command]
pub async fn configure_webdav(
    db: State<'_, DbPool>,
    url: String,
    username: String,
    password: String,
    path: String,
) -> Result<(), String> {
    // TODO: Implement WebDAV configuration storage
    // For now, just validate inputs
    if url.is_empty() || username.is_empty() || password.is_empty() {
        return Err("All fields are required".to_string());
    }

    let cfg = WebDavConfig {
        url,
        username,
        password,
        path,
    };
    save_webdav_config(&db, &cfg).await
}

#[tauri::command]
pub async fn get_webdav_config(db: State<'_, DbPool>) -> Result<Option<WebDavConfig>, String> {
    get_webdav_config_for_db(&db).await
}

#[tauri::command]
pub async fn configure_s3(
    bucket: String,
    region: String,
    access_key: String,
    secret_key: String,
    _endpoint: Option<String>,
) -> Result<(), String> {
    // TODO: Implement S3 configuration storage
    // For now, just validate inputs
    if bucket.is_empty() || region.is_empty() || access_key.is_empty() || secret_key.is_empty() {
        return Err("All required fields must be filled".to_string());
    }

    Ok(())
}

#[tauri::command]
pub async fn sync_upload(
    _db: State<'_, DbPool>,
    _app: AppHandle,
    sync_type: String,
) -> Result<SyncResult, String> {
    let db_path = _app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("item_classify_system.db");
    sync_upload_with_db_path(&_db, &sync_type, db_path).await
}

#[tauri::command]
pub async fn sync_download(sync_type: String) -> Result<SyncResult, String> {   
    // TODO: Implement actual sync logic
    // For now, return a placeholder response

    Ok(SyncResult {
        success: true,
        message: format!("Download sync via {} completed", sync_type),
        timestamp: Utc::now().to_rfc3339(),
    })
}

#[cfg(test)]
mod tests {
    use super::{
        get_webdav_config_for_db, load_webdav_config, save_webdav_config, sync_upload_with_db_path,
        WebDavConfig,
    };
    use crate::database::DbPool;
    use sqlx::SqlitePool;
    use std::sync::Arc;

    async fn init_test_db() -> DbPool {
        let pool = SqlitePool::connect(":memory:")
            .await
            .expect("failed to create sqlite pool");
        let migration_sql_1 = include_str!("../../migrations/1_initial.sql");
        sqlx::query(migration_sql_1)
            .execute(&pool)
            .await
            .expect("failed to run migrations");
        Arc::new(pool)
    }

    #[tokio::test]
    async fn test_webdav_config_roundtrip() {
        let db = init_test_db().await;
        let cfg = WebDavConfig {
            url: "https://dav.example.com".to_string(),
            username: "u1".to_string(),
            password: "p1".to_string(),
            path: "/item-classify-system".to_string(),
        };

        save_webdav_config(&db, &cfg).await.unwrap();
        let loaded = load_webdav_config(&db).await.unwrap().unwrap();

        assert_eq!(loaded.url, cfg.url);
        assert_eq!(loaded.username, cfg.username);
        assert_eq!(loaded.password, cfg.password);
        assert_eq!(loaded.path, cfg.path);
    }

    #[tokio::test]
    async fn test_get_webdav_config_for_db_roundtrip() {
        let db = init_test_db().await;
        let cfg = WebDavConfig {
            url: "https://dav.example.com".to_string(),
            username: "u2".to_string(),
            password: "p2".to_string(),
            path: "/item-classify-system".to_string(),
        };

        save_webdav_config(&db, &cfg).await.unwrap();
        let loaded = get_webdav_config_for_db(&db).await.unwrap().unwrap();

        assert_eq!(loaded.url, cfg.url);
        assert_eq!(loaded.username, cfg.username);
        assert_eq!(loaded.password, cfg.password);
        assert_eq!(loaded.path, cfg.path);
    }

    #[tokio::test]
    async fn test_sync_upload_requires_config() {
        let db = init_test_db().await;
        let err = sync_upload_with_db_path(
            &db,
            "webdav",
            std::path::PathBuf::from("dummy.db"),
        )
        .await
        .unwrap_err();
        assert!(err.contains("WebDAV"));
    }
}
