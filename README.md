# 物品分类管理系统

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](https://github.com/someone120/item-classify-system)
[![Tauri](https://img.shields.io/badge/Tauri-2.0-FFC131?logo=tauri)](https://tauri.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)

基于 Tauri 2.0 的跨平台物品分类管理系统，用于管理电子元器件和小物品（如螺丝等）。支持 Windows、Android 和 iOS 平台。

## ✨ 主要功能

- 🗂️ **多层嵌套结构**：货架 → 盒子 → 元件，灵活管理物品层级
- 📦 **物品管理**：完整的 CRUD 操作，支持分类、规格、库存等信息
- 📊 **库存管理**：快速入库/出库，库存预警提示
- 🏷️ **二维码标签**：生成并打印带二维码的标签，支持自定义布局
- 📱 **移动端扫描**：Android/iOS 支持扫描二维码快速定位位置
- ☁️ **数据同步**：支持 WebDAV 和 S3 云存储同步数据
- 🎨 **现代化界面**：Material-UI 设计，响应式布局

## 📸 功能截图

### 位置管理
树形结构展示所有位置，支持多层级嵌套。

### 物品管理
卡片式展示物品，支持分类筛选、搜索和多条件过滤。

### 库存管理
快速出入库操作，库存不足预警。

### 标签打印
批量生成 PDF 标签，支持多种纸张尺寸和布局。

## 🚀 快速开始

### 环境要求

#### 开发环境
- Node.js 20+
- Rust 1.70+ （用于 Tauri 后端）
- npm 或 yarn

#### Android 构建（可选）
- Java 17+
- Android Studio
- Android SDK

#### iOS 构建（可选）
- macOS
- Xcode
- CocoaPods

### 安装

```bash
# 克隆项目
git clone https://github.com/someone120/item-classify-system.git
cd item-classify-system

# 安装前端依赖
cd frontend
npm install

# 启动开发服务器
npm run dev
```

### 构建

#### Windows
```bash
npm run tauri build
```

#### Android
```bash
npm run tauri android build
```

#### iOS
```bash
npm run tauri ios build
```

## 🛠️ 技术栈

### 前端
- **React 19.2.0** - UI 框架
- **TypeScript 5.9.3** - 类型安全
- **Vite 7.2.4** - 构建工具
- **Material-UI (MUI)** - UI 组件库
- **React Router** - 路由管理
- **html5-qrcode** - 二维码扫描（移动端）

### 后端
- **Tauri 2.0** - 跨平台应用框架
- **Rust** - 后端逻辑
- **SQLite (tauri-plugin-sql)** - 数据存储
- **qrcode** - 二维码生成
- **printpdf** - PDF 生成

### CI/CD
- **GitHub Actions** - 自动化构建和发布
- 支持自动构建 Windows 和 Android 版本

## 📦 项目结构

```
item-classify-system/
├── frontend/              # React 前端
│   ├── src/
│   │   ├── components/    # UI 组件
│   │   ├── pages/         # 页面组件
│   │   ├── types/         # TypeScript 类型
│   │   └── utils/         # 工具函数
│   ├── package.json
│   └── vite.config.ts
├── src-tauri/             # Tauri 后端（Rust）
│   ├── src/
│   │   ├── commands/      # Tauri Commands
│   │   ├── database/      # 数据库模块
│   │   └── main.rs        # 入口
│   ├── migrations/        # SQL 迁移
│   └── Cargo.toml
├── .github/
│   └── workflows/         # CI/CD 配置
├── CLAUDE.md             # 项目指南
└── README.md             # 本文件
```

## 📊 数据库设计

### 核心表

- **locations** - 位置表（支持多层级嵌套）
- **items** - 物品表
- **inventory_log** - 库存变动记录
- **sync_config** - 同步配置表

详细的数据库设计请参考 [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)。

## 🔄 数据同步

系统支持两种云存储同步方式：

### WebDAV
适用于坚果云、Nextcloud 等支持 WebDAV 协议的网盘。

### S3
适用于 AWS S3、MinIO、阿里云 OSS 等对象存储服务。

## 📝 开发指南

### 添加新的 Tauri Command

1. 在 `src-tauri/src/commands/` 中创建模块
2. 在 `mod.rs` 中导出模块
3. 在 `src-tauri/src/main.rs` 中注册 command
4. 在前端 `src/utils/api.ts` 中添加调用函数

### 运行测试

```bash
# 前端测试
cd frontend
npm run lint

# Rust 测试
cd src-tauri
cargo test
```

## 📄 许可证

本项目采用 [GNU Affero General Public License v3.0 (AGPL-3.0)](./LICENSE) 许可证。

**重要提示**：根据 AGPL-3.0 许可证，如果您在网络上使用此程序（包括通过网络提供服务），您需要向用户公开源代码。

## 🤝 贡献

欢迎贡献！请随时提交 Pull Request。

## 📧 联系方式

- 问题反馈：[GitHub Issues](https://github.com/someone120/item-classify-system/issues)
- 项目文档：[CLAUDE.md](./CLAUDE.md)

## 🙏 致谢

感谢以下开源项目：

- [Tauri](https://tauri.app/) - 跨平台应用框架
- [React](https://react.dev/) - UI 框架
- [Material-UI](https://mui.com/) - UI 组件库
- [html5-qrcode](https://github.com/mebjas/html5-qrcode) - 二维码扫描
- [printpdf](https://github.com/fschutt/printpdf) - PDF 生成

---

**物品分类管理系统** © 2026
