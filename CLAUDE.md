# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Tauri-based cross-platform item classification management system** for organizing electronic components and small items. The application supports Windows, Android, and iOS platforms.

**License:** GNU Affero General Public License v3.0 (AGPL-3.0)

## Architecture

### Project Structure

```
item-classify-system/
├── frontend/          # React + TypeScript + Vite frontend
│   ├── src/
│   │   ├── App.tsx    # Main React application
│   │   └── assets/    # Static assets
│   ├── vite.config.ts # Vite configuration
│   ├── package.json   # Frontend dependencies
│   └── tsconfig*.json # TypeScript configurations
└── (Tauri backend to be added)
```

### Technology Stack

**Frontend:**
- React 19.2.0
- TypeScript 5.9.3
- Vite 7.2.4
- ESLint for linting

**Backend (Planned):**
- Tauri 2.0 framework
- Rust for native backend
- SQLite for data storage
- QR code generation/scanning
- PDF generation for labels

**Key Features:**
- Multi-platform support (Windows, Android, iOS)
- Nested hierarchical data structure (e.g., Shelf → Box → Component)
- QR code scanning for inventory management
- PDF label generation with QR codes
- Data synchronization via WebDAV or S3
- GitHub Actions for CI/CD

## Development Commands

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server with HMR
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

### Type Checking

The project uses project references for TypeScript. Build commands handle type checking automatically via `tsc -b && vite build`.

## Project Context

**Current State:** Early development phase. Only the basic React + TypeScript + Vite frontend template exists.

**To Be Implemented:**
1. Tauri backend integration
2. SQLite database schema
3. Hierarchical data structure for items
4. QR code functionality (generation and scanning)
5. PDF label generation
6. WebDAV/S3 synchronization
7. Multi-platform build configuration

## Important Notes

- iOS builds require macOS with Xcode (Apple restriction)
- Android builds can be done on any platform with Android Studio
- The project is AGPL-3.0 licensed - any network use requires source availability
- Frontend uses module type (`"type": "module"` in package.json) - use ES imports
