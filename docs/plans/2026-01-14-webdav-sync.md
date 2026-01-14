# WebDAV Sync Persistence & Upload Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 让 WebDAV 配置可持久化保存，并让 WebDAV 上传真正上传数据库文件。

**Architecture:** 在 `sync_config` 表中存储 JSON 配置，`sync_upload` 读取配置并使用 `reqwest` 将本地数据库文件 PUT 到 WebDAV 目标路径；为测试提供可注入的内部函数以避免真实网络依赖。

**Tech Stack:** Rust, Tauri 2, SQLx (SQLite), reqwest, tokio, serde_json

### Task 1: WebDAV 配置持久化测试（RED）

**Files:**
- Modify: `src-tauri/src/commands/sync.rs`
- Test: `src-tauri/src/commands/sync.rs`

**Step 1: 写失败测试（配置保存/读取）**

```rust
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
```

**Step 2: 运行测试并确认失败**

Run: `cd src-tauri; cargo test test_webdav_config_roundtrip`

Expected: FAIL（函数未实现或返回为空）

**Step 3: 写最小实现**

```rust
pub async fn save_webdav_config(db: &DbPool, cfg: &WebDavConfig) -> Result<(), String> {
    let config_json = serde_json::to_string(cfg).map_err(|e| e.to_string())?;
    execute(db, "DELETE FROM sync_config WHERE sync_type = ?1", vec!["webdav".to_string()])
        .await.map_err(|e| e.to_string())?;
    execute(db, "INSERT INTO sync_config (sync_type, enabled, config, updated_at) VALUES (?1, 1, ?2, CURRENT_TIMESTAMP)",
        vec!["webdav".to_string(), config_json])
        .await.map_err(|e| e.to_string())?;
    Ok(())
}
```

**Step 4: 运行测试并确认通过**

Run: `cd src-tauri; cargo test test_webdav_config_roundtrip`

Expected: PASS

### Task 2: 上传前置条件测试（RED）

**Files:**
- Modify: `src-tauri/src/commands/sync.rs`
- Test: `src-tauri/src/commands/sync.rs`

**Step 1: 写失败测试（未配置时报错）**

```rust
#[tokio::test]
async fn test_sync_upload_requires_config() {
    let db = init_test_db().await;
    let err = sync_upload_with_db_path(&db, "webdav", std::path::PathBuf::from("dummy.db"))
        .await
        .unwrap_err();
    assert!(err.contains("WebDAV"));
}
```

**Step 2: 运行测试并确认失败**

Run: `cd src-tauri; cargo test test_sync_upload_requires_config`

Expected: FAIL（函数未实现或错误消息不匹配）

**Step 3: 写最小实现**

```rust
pub async fn sync_upload_with_db_path(
    db: &DbPool,
    sync_type: &str,
    db_path: std::path::PathBuf,
) -> Result<SyncResult, String> {
    let cfg = load_webdav_config(db).await?.ok_or("WebDAV 未配置")?;
    let _ = (cfg, db_path);
    Err("WebDAV 未配置".to_string())
}
```

**Step 4: 运行测试并确认通过**

Run: `cd src-tauri; cargo test test_sync_upload_requires_config`

Expected: PASS

### Task 3: WebDAV 上传实现（GREEN）

**Files:**
- Modify: `src-tauri/src/commands/sync.rs`

**Step 1: 实现 WebDAV URL 构建与上传**

```rust
fn build_webdav_file_url(base: &str, path: &str, filename: &str) -> Result<String, String> {
    let mut url = reqwest::Url::parse(base).map_err(|e| e.to_string())?;
    let mut parts: Vec<&str> = Vec::new();
    if !path.trim().is_empty() {
        parts.extend(path.trim_matches('/').split('/'));
    }
    parts.push(filename);
    url.set_path(&parts.join("/"));
    Ok(url.to_string())
}

async fn upload_webdav_file(
    cfg: &WebDavConfig,
    db_path: &std::path::Path,
) -> Result<(), String> {
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
```

**Step 2: 让 `sync_upload` 使用真实实现**

```rust
pub async fn sync_upload(db: State<'_, DbPool>, app: AppHandle, sync_type: String) -> Result<SyncResult, String> {
    if sync_type != "webdav" {
        return Err("Only WebDAV is supported for now".to_string());
    }
    let cfg = load_webdav_config(&db).await?.ok_or("WebDAV 未配置")?;
    let db_path = app.path().app_data_dir()
        .map_err(|e| e.to_string())?
        .join("item_classify_system.db");
    upload_webdav_file(&cfg, &db_path).await?;
    execute(&db, "UPDATE sync_config SET last_sync_time = CURRENT_TIMESTAMP WHERE sync_type = ?1", vec!["webdav".to_string()])
        .await.map_err(|e| e.to_string())?;

    Ok(SyncResult {
        success: true,
        message: "WebDAV 上传完成".to_string(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}
```

**Step 3: 运行相关测试**

Run: `cd src-tauri; cargo test test_webdav_config_roundtrip test_sync_upload_requires_config`

Expected: PASS

### Task 4: 命令接线与配置保存

**Files:**
- Modify: `src-tauri/src/commands/sync.rs`

**Step 1: 让 `configure_webdav` 写入数据库**

```rust
#[tauri::command]
pub async fn configure_webdav(
    db: State<'_, DbPool>,
    url: String,
    username: String,
    password: String,
    path: String,
) -> Result<(), String> {
    if url.is_empty() || username.is_empty() || password.is_empty() {
        return Err("All fields are required".to_string());
    }
    save_webdav_config(&db, &WebDavConfig { url, username, password, path }).await
}
```

**Step 2: 运行测试**

Run: `cd src-tauri; cargo test test_webdav_config_roundtrip`

Expected: PASS

