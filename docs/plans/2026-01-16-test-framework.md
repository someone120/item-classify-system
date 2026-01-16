# 测试框架 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在前端引入 Vitest + Testing Library，并在后端新增基于 SQLite 的集成测试用例。

**Architecture:** 前端通过 Vite 的 `test` 配置启用 vitest 与 jsdom，测试聚焦组件交互与回调参数；后端在 `src-tauri/tests` 使用临时 SQLite 数据库执行迁移并验证基本数据行为。

**Tech Stack:** Vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom, Rust `cargo test`, sqlx, tempfile

### Task 1: 前端测试框架脚手架（smoke test）

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Create: `frontend/src/setupTests.ts`
- Create: `frontend/src/__tests__/smoke.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('fails before test runner is wired', () => {
    expect(1).toBe(2);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test`
Expected: FAIL with "missing script: test" or "vitest: command not found"

**Step 3: Write minimal implementation**

- Install dev deps and add scripts in `frontend/package.json`:

```bash
cd frontend
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest"
}
```

- Add test config in `frontend/vite.config.ts`:

```ts
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.ts',
  },
});
```

- Create `frontend/src/setupTests.ts`:

```ts
import '@testing-library/jest-dom';
```

- Fix smoke test to pass:

```ts
expect(1).toBe(1);
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test`
Expected: PASS (1 test)

**Step 5: Commit**

```bash
git add frontend/package.json frontend/vite.config.ts frontend/src/setupTests.ts frontend/src/__tests__/smoke.test.ts
git commit -m "test: add vitest setup"
```

### Task 2: LocationDialog 组件测试

**Files:**
- Create: `frontend/src/components/locations/__tests__/LocationDialog.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import LocationDialog from '../LocationDialog';

it('saves trimmed name and optional parent_id', async () => {
  const user = userEvent.setup();
  const onSave = vi.fn().mockResolvedValue(undefined);
  render(
    <LocationDialog
      open
      location={null}
      parentId={3}
      onClose={vi.fn()}
      onSave={onSave}
    />
  );

  await user.click(screen.getByRole('button', { name: '保存' }));
  expect(onSave).toHaveBeenCalled();
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test`
Expected: FAIL (onSave not called because name is empty)

**Step 3: Write minimal implementation**

Update the test to enter a valid name and assert payload:

```tsx
await user.type(screen.getByLabelText('位置名称'), '  测试位置  ');
await user.click(screen.getByRole('button', { name: '保存' }));

expect(onSave).toHaveBeenCalledWith({
  name: '测试位置',
  location_type: 'box',
  description: undefined,
  parent_id: 3,
});
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test`
Expected: PASS (2 tests)

**Step 5: Commit**

```bash
git add frontend/src/components/locations/__tests__/LocationDialog.test.tsx
git commit -m "test: add LocationDialog component test"
```

### Task 3: ItemDialog 组件测试

**Files:**
- Create: `frontend/src/components/items/__tests__/ItemDialog.test.tsx`

**Step 1: Write the failing test**

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ItemDialog from '../ItemDialog';
import * as api from '../../../utils/api';

vi.mock('../../../utils/api', () => ({
  getLocations: vi.fn(),
}));

it('loads locations and submits trimmed input', async () => {
  const user = userEvent.setup();
  const onSave = vi.fn().mockResolvedValue(undefined);
  const getLocations = vi.mocked(api.getLocations);
  getLocations.mockResolvedValue([
    {
      id: 1,
      name: 'A1',
      parent_id: null,
      location_type: 'box',
      description: null,
      qr_code_id: null,
      created_at: '2025-01-01',
      updated_at: '2025-01-01',
    },
  ]);

  render(<ItemDialog open item={null} onClose={vi.fn()} onSave={onSave} />);

  await user.click(screen.getByRole('button', { name: '保存' }));
  expect(onSave).toHaveBeenCalled();
});
```

**Step 2: Run test to verify it fails**

Run: `cd frontend && npm run test`
Expected: FAIL (name is empty or mock selector mismatch)

**Step 3: Write minimal implementation**

Update the test to wait for API and fill fields:

```tsx
await waitFor(() => expect(getLocations).toHaveBeenCalledTimes(1));
await user.type(screen.getByLabelText(/物品名称/), '  电阻  ');
await user.clear(screen.getByLabelText(/数量/));
await user.type(screen.getByLabelText(/数量/), '5');
await user.click(screen.getByRole('button', { name: '保存' }));

expect(onSave).toHaveBeenCalledWith(
  expect.objectContaining({
    name: '电阻',
    quantity: 5,
  })
);
```

**Step 4: Run test to verify it passes**

Run: `cd frontend && npm run test`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add frontend/src/components/items/__tests__/ItemDialog.test.tsx
git commit -m "test: add ItemDialog component test"
```

### Task 4: Rust 集成测试基础设施

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Create: `src-tauri/tests/db_integration.rs`

**Step 1: Write the failing test**

```rust
#[tokio::test]
async fn migrations_create_tables() {
    let pool = setup_pool().await;
    run_migrations(&pool).await;
    let tables: Vec<(String,)> = sqlx::query_as(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='locations'"
    )
    .fetch_all(&pool)
    .await
    .unwrap();
    assert_eq!(tables.len(), 1);
}
```

**Step 2: Run test to verify it fails**

Run: `cd src-tauri && cargo test`
Expected: FAIL due to missing `tempfile` or missing helper functions

**Step 3: Write minimal implementation**

- Add dev dependency in `src-tauri/Cargo.toml`:

```toml
[dev-dependencies]
tempfile = "3"
```

- Implement helpers and migrations in `src-tauri/tests/db_integration.rs`:

```rust
use sqlx::{sqlite::SqliteConnectOptions, SqlitePool};
use tempfile::tempdir;

async fn setup_pool() -> SqlitePool {
    let dir = tempdir().unwrap();
    let db_path = dir.path().join("test.db");
    let options = SqliteConnectOptions::new()
        .filename(&db_path)
        .create_if_missing(true);
    SqlitePool::connect_with(options).await.unwrap()
}

async fn run_migrations(pool: &SqlitePool) {
    let migration_sql_1 = include_str!("../migrations/1_initial.sql");
    let migration_sql_2 = include_str!("../migrations/2_fix_parent_id.sql");
    sqlx::query(migration_sql_1).execute(pool).await.unwrap();
    sqlx::query(migration_sql_2).execute(pool).await.unwrap();
}
```

**Step 4: Run test to verify it passes**

Run: `cd src-tauri && cargo test`
Expected: PASS (1 test)

**Step 5: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/tests/db_integration.rs
git commit -m "test: add sqlite integration test harness"
```

### Task 5: 迁移与基础 CRUD 测试用例

**Files:**
- Modify: `src-tauri/tests/db_integration.rs`

**Step 1: Write the failing tests**

```rust
#[tokio::test]
async fn fixes_parent_id_zero_to_null() {
    let pool = setup_pool().await;
    let migration_sql_1 = include_str!("../migrations/1_initial.sql");
    sqlx::query(migration_sql_1).execute(&pool).await.unwrap();

    sqlx::query("INSERT INTO locations (name, parent_id, location_type) VALUES ('root', 0, 'box')")
        .execute(&pool)
        .await
        .unwrap();

    let migration_sql_2 = include_str!("../migrations/2_fix_parent_id.sql");
    sqlx::query(migration_sql_2).execute(&pool).await.unwrap();

    let parent: Option<i64> = sqlx::query_scalar("SELECT parent_id FROM locations WHERE name = 'root'")
        .fetch_one(&pool)
        .await
        .unwrap();

    assert!(parent.is_none());
}

#[tokio::test]
async fn inserts_location_and_item() {
    let pool = setup_pool().await;
    run_migrations(&pool).await;

    let location_id = insert_location(&pool, "A1").await;

    sqlx::query("INSERT INTO items (name, quantity, location_id) VALUES ('电阻', 10, ?1)")
        .bind(location_id)
        .execute(&pool)
        .await
        .unwrap();

    let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM items WHERE location_id = ?1")
        .bind(location_id)
        .fetch_one(&pool)
        .await
        .unwrap();

    assert_eq!(count, 1);
}
```

**Step 2: Run test to verify it fails**

Run: `cd src-tauri && cargo test`
Expected: FAIL with "cannot find function `insert_location`"

**Step 3: Write minimal implementation**

Add helper function in `src-tauri/tests/db_integration.rs`:

```rust
async fn insert_location(pool: &SqlitePool, name: &str) -> i64 {
    sqlx::query("INSERT INTO locations (name, location_type) VALUES (?1, 'box')")
        .bind(name)
        .execute(pool)
        .await
        .unwrap();

    sqlx::query_scalar("SELECT last_insert_rowid()")
        .fetch_one(pool)
        .await
        .unwrap()
}
```

**Step 4: Run test to verify it passes**

Run: `cd src-tauri && cargo test`
Expected: PASS (3 tests)

**Step 5: Commit**

```bash
git add src-tauri/tests/db_integration.rs
git commit -m "test: add sqlite migration and crud tests"
```
