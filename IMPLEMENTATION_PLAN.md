# 物品分类管理系统 - 完整实现方案

## 项目概述

基于 Tauri 2.0 的跨平台物品分类管理系统，用于管理电子元器件和小物品（如螺丝等）。

### 技术栈

**前端：**
- React 19.2.0 + TypeScript 5.9.3
- Vite 7.2.4
- Material-UI (MUI) 组件库
- html5-qrcode（移动端扫描二维码）

**后端：**
- Tauri 2.0
- Rust
- tauri-plugin-sql（SQLite 数据库）
- reqwest（HTTP 客户端，用于 WebDAV/S3 同步）
- qrcode（二维码生成）
- printpdf（PDF 标签生成）

**平台支持：**
- Windows（完整功能，不含扫描）
- Android（完整功能，含扫描）
- iOS（后续配置，需要 macOS）

---

## 数据库设计

### SQLite 表结构

```sql
-- 位置表（支持多层级嵌套）
CREATE TABLE locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,           -- 位置名称，如"3号架子"、"1号盒子"
    parent_id INTEGER,            -- 父位置ID，NULL表示根位置
    location_type TEXT NOT NULL,  -- 类型：'shelf', 'box', 'compartment'
    description TEXT,             -- 描述
    qr_code_id TEXT UNIQUE,       -- 二维码唯一标识
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES locations(id) ON DELETE CASCADE
);

-- 物品表
CREATE TABLE items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,           -- 物品名称，如"5.1k电阻"
    category TEXT,                -- 分类，如"电阻"、"电容"、"螺丝"
    specifications TEXT,          -- 规格参数
    quantity INTEGER DEFAULT 0,   -- 数量
    unit TEXT,                    -- 单位，如"个"、"包"
    location_id INTEGER,          -- 所在位置ID
    min_quantity INTEGER,         -- 最小库存预警
    notes TEXT,                   -- 备注
    image_path TEXT,              -- 图片路径
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
);

-- 库存变动记录
CREATE TABLE inventory_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_id INTEGER NOT NULL,
    quantity_change INTEGER NOT NULL,  -- 变动数量（正数增加，负数减少）
    quantity_after INTEGER NOT NULL,   -- 变动后数量
    operation_type TEXT NOT NULL,      -- 操作类型：'add', 'remove', 'adjust'
    source TEXT,                       -- 来源：'manual', 'qr_scan', 'sync'
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

-- 同步配置表
CREATE TABLE sync_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_type TEXT NOT NULL,      -- 'webdav' or 's3'
    enabled BOOLEAN DEFAULT 0,
    config TEXT NOT NULL,         -- JSON配置
    last_sync_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_locations_parent ON locations(parent_id);
CREATE INDEX idx_items_location ON items(location_id);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_inventory_log_item ON inventory_log(item_id);
CREATE INDEX idx_inventory_log_time ON inventory_log(created_at);
```

---

## 核心功能模块

### 1. 位置管理（多层嵌套）

**前端组件：**
```
components/locations/
├── LocationTree.tsx          # 位置树形视图
├── LocationCard.tsx          # 位置卡片
├── LocationDialog.tsx        # 新增/编辑位置对话框
└── LocationBreadcrumbs.tsx   # 面包屑导航
```

**Tauri Commands（Rust）：**
```rust
// 获取所有位置（树形结构）
#[tauri::command]
async fn get_locations() -> Result<Vec<Location>, String>

// 创建位置
#[tauri::command]
async fn create_location(name: String, parent_id: Option<i32>, location_type: String) -> Result<i32, String>

// 更新位置
#[tauri::command]
async fn update_location(id: i32, name: String, description: Option<String>) -> Result<(), String>

// 删除位置
#[tauri::command]
async fn delete_location(id: i32) -> Result<(), String>

// 根据二维码ID获取位置
#[tauri::command]
async fn get_location_by_qr(qr_code_id: String) -> Result<Location, String>
```

### 2. 物品管理

**前端组件：**
```
components/items/
├── ItemList.tsx              # 物品列表（支持筛选、搜索）
├── ItemCard.tsx              # 物品卡片
├── ItemDialog.tsx            # 新增/编辑物品对话框
├── ItemSearchBar.tsx         # 搜索栏
└── InventoryAlert.tsx        # 库存预警提示
```

**Tauri Commands（Rust）：**
```rust
// 获取所有物品
#[tauri::command]
async fn get_items(filter: Option<ItemFilter>) -> Result<Vec<Item>, String>

// 创建物品
#[tauri::command]
async fn create_item(item: ItemInput) -> Result<i32, String>

// 更新物品
#[tauri::command]
async fn update_item(id: i32, item: ItemInput) -> Result<(), String>

// 删除物品
#[tauri::command]
async fn delete_item(id: i32) -> Result<(), String>

// 更新库存
#[tauri::command]
async fn update_quantity(item_id: i32, change: i32, operation_type: String) -> Result<(), String>
```

### 3. 二维码功能

#### 3.1 生成二维码（所有平台）

**前端组件：**
```
components/qrcode/
├── QRCodeGenerator.tsx       # 二维码生成器
└── QRCodePreview.tsx         # 二维码预览
```

**Tauri Commands（Rust）：**
```rust
// 为位置生成二维码（返回二维码数据URL）
#[tauri::command]
async fn generate_location_qr(location_id: i32) -> Result<String, String>

// 批量为位置生成二维码
#[tauri::command]
async fn generate_batch_qr(location_ids: Vec<i32>) -> Result<Vec<QRCodeResult>, String>
```

**实现方式：**
- 使用 Rust `qrcode` crate 生成二维码
- 返回 base64 编码的 PNG 图片
- 前端显示并支持打印

#### 3.2 扫描二维码（仅移动端）

**前端组件：**
```
components/qrcode/
└── QRCodeScanner.tsx         # 二维码扫描器（仅移动端）
```

**实现方式：**
- 使用 `html5-qrcode` JavaScript 库
- 通过 Tauri 的摄像头权限 API 调用相机
- 平台检测：仅在 Android/iOS 显示扫描按钮
- Windows 端隐藏或禁用扫描功能

**使用场景：**
1. 扫描位置二维码 → 快速定位到该位置
2. 扫描物品二维码 → 显示物品详情
3. 扫描模式：扫描后直接输入数量变更

### 4. PDF 标签生成

**前端组件：**
```
components/pdf/
├── PDFLabelGenerator.tsx     # PDF标签生成器
├── LabelPreview.tsx          # 标签预览
└── PaperSizeSelector.tsx     # 纸张大小选择器
```

**Tauri Commands（Rust）：**
```rust
// 生成PDF标签
#[tauri::command]
async fn generate_pdf_labels(
    items: Vec<LabelItem>,
    paper_size: String,      // 'A4', 'Letter', 'A5', etc.
    columns: i32,            // 每行标签数
    rows: i32,               // 每列标签数
    margin: f64,             // 边距(mm)
) -> Result<String, String>  // 返回PDF文件路径
```

**标签内容：**
- 位置名称（如"3号架子 > 1号盒子"）
- 物品名称（如"5.1k电阻"）
- 当前数量
- 二维码（包含位置ID或物品ID）
- 日期

**支持的纸张格式：**
- A4 (210 x 297 mm)
- Letter (8.5 x 11 in)
- A5 (148 x 210 mm)
- 自定义

**布局选项：**
- 2行 x 3列（每页6个标签）
- 3行 x 4列（每页12个标签）
- 自定义行列数

### 5. 数据同步（WebDAV / S3）

**前端组件：**
```
components/sync/
├── SyncSettings.tsx          # 同步设置
├── SyncStatus.tsx            # 同步状态显示
└── SyncDialog.tsx            # WebDAV/S3配置对话框
```

**Tauri Commands（Rust）：**
```rust
// 配置WebDAV
#[tauri::command]
async fn configure_webdav(
    url: String,
    username: String,
    password: String,
    path: String,
) -> Result<(), String>

// 配置S3
#[tauri::command]
async fn configure_s3(
    bucket: String,
    region: String,
    access_key: String,
    secret_key: String,
    endpoint: Option<String>,  // 支持自定义S3兼容服务
) -> Result<(), String>

// 执行同步（上传）
#[tauri::command]
async fn sync_upload(sync_type: String) -> Result<SyncResult, String>

// 执行同步（下载）
#[tauri::command]
async fn sync_download(sync_type: String) -> Result<SyncResult, String>

// 自动同步（检查远程更新）
#[tauri::command]
async fn auto_sync() -> Result<Option<SyncResult>, String>
```

**同步策略：**
1. **全量同步**：每次上传完整的数据库文件（SQLite 的 `.db` 文件）
2. **增量同步**：记录上次同步时间，仅同步变更的记录
3. **冲突解决**：以时间戳为准，最新的数据覆盖旧数据
4. **同步频率**：支持手动同步和自动同步（可配置间隔）

**安全性：**
- WebDAV 密码使用加密存储（系统密钥库）
- S3 凭证使用加密存储
- 支持双向认证（WebDAV）

### 6. 主界面布局

**页面结构：**
```
App.tsx
├── Layout.tsx                # 主布局
│   ├── AppBar.tsx           # 顶部导航栏
│   ├── Drawer.tsx           # 侧边栏（位置树）
│   └── ContentArea.tsx      # 主内容区
├── pages/
│   ├── Dashboard.tsx        # 仪表盘（统计、预警）
│   ├── Locations.tsx        # 位置管理页
│   ├── Items.tsx            # 物品管理页
│   ├── Inventory.tsx        # 库存管理页
│   ├── Labels.tsx           # 标签打印页
│   └── Settings.tsx         # 设置页（同步、通用）
```

**功能导航：**
- 仪表盘：总览统计、库存预警、最近变动
- 位置管理：树形视图展示所有位置
- 物品管理：列表视图，支持筛选、搜索
- 库存管理：快速出入库、库存记录
- 标签打印：生成和打印标签
- 设置：同步配置、通用设置

---

## 项目结构

```
item-classify-system/
├── frontend/                    # React前端
│   ├── src/
│   │   ├── components/          # UI组件
│   │   ├── pages/               # 页面组件
│   │   ├── hooks/               # 自定义Hooks
│   │   ├── types/               # TypeScript类型定义
│   │   ├── utils/               # 工具函数
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── src-tauri/                   # Tauri后端（新建）
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   ├── main.rs              # 入口
│   │   ├── commands/            # Tauri命令
│   │   │   ├── mod.rs
│   │   │   ├── locations.rs
│   │   │   ├── items.rs
│   │   │   ├── qrcode.rs
│   │   │   ├── pdf.rs
│   │   │   └── sync.rs
│   │   ├── database/            # 数据库模块
│   │   │   ├── mod.rs
│   │   │   ├── models.rs
│   │   │   └── schema.sql
│   │   └── utils/               # 工具模块
│   │       ├── mod.rs
│   │       ├── webdav.rs
│   │       └── s3.rs
│   └── gen/                     # Android生成文件
├── .github/
│   └── workflows/
│       ├── build-windows.yml    # Windows构建
│       └── build-android.yml    # Android构建
├── CLAUDE.md
└── IMPLEMENTATION_PLAN.md
```

---

## GitHub Actions CI/CD 配置

### 1. Windows 构建配置

```yaml
name: Build Windows

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  release:
    types: [created]

jobs:
  build:
    runs-on: windows-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Rust
        uses: actions-rust-lang/setup-rust-toolchain@v1

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Build frontend
        run: |
          cd frontend
          npm run build

      - name: Install Tauri CLI
        run: cargo install tauri-cli --locked

      - name: Build Tauri app
        run: cargo tauri build

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: windows-installer
          path: src-tauri/target/release/bundle/nsis/*.exe
```

### 2. Android 构建配置

```yaml
name: Build Android

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  release:
    types: [created]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Rust
        uses: actions-rust-lang/setup-rust-toolchain@v1
        with:
          targets: aarch64-linux-android

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install Java
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Build frontend
        run: |
          cd frontend
          npm run build

      - name: Install Tauri CLI
        run: cargo install tauri-cli --locked

      - name: Initialize Android
        run: cargo tauri android init

      - name: Build Android APK
        run: cargo tauri android build

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: android-apk
          path: src-tauri/gen/android/app/build/outputs/**/*.apk
```

---

## 实现步骤

### 第一阶段：基础架构搭建
1. 初始化 Tauri 2.0 项目
2. 配置 SQLite 数据库
3. 创建基础页面布局
4. 集成 MUI 组件库

### 第二阶段：核心功能开发
1. 实现位置管理（树形结构）
2. 实现物品管理（CRUD）
3. 实现库存管理和变动记录
4. 实现二维码生成功能

### 第三阶段：高级功能开发
1. 实现二维码扫描（移动端）
2. 实现 PDF 标签生成
3. 实现 WebDAV 同步
4. 实现 S3 同步

### 第四阶段：平台适配
1. Android 平台适配
2. Windows 平台适配
3. 配置 GitHub Actions

### 第五阶段：测试和优化
1. 功能测试
2. 性能优化
3. UI/UX 优化

---

## 关键依赖项

### frontend/package.json
```json
{
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "@tauri-apps/plugin-sql": "^2.0.0",
    "@mui/material": "^6.0.0",
    "@mui/icons-material": "^6.0.0",
    "@emotion/react": "^11.11.0",
    "@emotion/styled": "^11.11.0",
    "html5-qrcode": "^2.3.8",
    "react": "^19.2.0",
    "react-router-dom": "^6.20.0"
  }
}
```

### src-tauri/Cargo.toml
```toml
[dependencies]
tauri = { version = "2.0", features = ["devtools"] }
tauri-plugin-sql = { version = "2.0", features = ["sqlite"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
qrcode = "0.14"
printpdf = "0.6"
reqwest = { version = "0.11", features = ["json"] }
tokio = { version = "1", features = ["full"] }
rusqlite = "0.30"
```

---

## 开发优先级

### 高优先级（核心功能）
- 数据库设计和初始化
- 位置管理（树形结构）
- 物品管理（CRUD）
- 二维码生成
- 基础UI布局

### 中优先级（增强功能）
- PDF 标签生成
- 库存预警
- 二维码扫描（移动端）
- WebDAV 同步

### 低优先级（辅助功能）
- S3 同步
- 高级筛选和搜索
- 统计图表
- 数据导入导出

---

## 注意事项

1. **iOS 构建限制**：iOS 构建需要 macOS 和 Xcode，前期只支持 Windows 和 Android
2. **相机权限**：Android 需要在 `AndroidManifest.xml` 中配置相机权限
3. **数据安全**：敏感信息（密码、密钥）使用系统密钥库加密存储
4. **离线优先**：应用应支持离线使用，同步为可选功能
5. **AGPL-3.0 许可**：任何网络使用都需要开放源代码

---

## 预估工作量

- **第一阶段**：基础架构 - 3-5天
- **第二阶段**：核心功能 - 7-10天
- **第三阶段**：高级功能 - 7-10天
- **第四阶段**：平台适配 - 3-5天
- **第五阶段**：测试优化 - 3-5天

**总计：23-35天**

---

## 待确认事项

1. ✅ 二维码功能：生成+扫描
2. ✅ 数据同步：WebDAV + S3
3. ✅ UI框架：Material-UI (MUI)
4. ✅ 移动端优先：Android优先
5. ✅ 电脑端不支持扫描
6. ⏳ PDF 标签尺寸要求（默认使用标准布局）
7. ⏳ 是否需要数据导入导出功能
8. ⏳ 是否需要多语言支持（中英文）

---

## 是否同意此方案？

请确认以上方案是否符合您的需求，我将开始实施开发。
