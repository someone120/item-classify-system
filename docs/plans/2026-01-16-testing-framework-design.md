# 测试框架设计

**目标**
- 前端引入 Vitest + Testing Library + jsdom，覆盖关键组件的渲染与交互。
- 后端引入基于 SQLite 的集成测试，验证迁移脚本与基本数据读写。

**架构与组件**
- 前端：在 `frontend/vite.config.ts` 增加 `test` 配置，新增 `frontend/src/setupTests.ts` 引入 `@testing-library/jest-dom`，统一测试环境与断言扩展。组件测试放在 `frontend/src/components/**/__tests__`，通过 `vi.mock` 替换 `utils/api` 的 Tauri 调用。
- 后端：在 `src-tauri/tests/` 新增集成测试，使用 `tempfile` 生成临时 SQLite 文件，`sqlx::SqlitePool` 连接后执行迁移 SQL，验证表结构与基础 CRUD 行为。

**数据流与错误处理**
- 前端测试以“渲染 → 用户输入 → 点击保存 → 断言回调参数”为主链路，覆盖字段裁剪、默认值、禁用状态等细节。必要时对异步 API 进行 mock 并 `await` 验证调用。
- 后端测试以“创建临时库 → 执行迁移 → 插入/查询/更新 → 断言结果”为主流程，失败时直接抛错，确保问题可定位。

**测试范围（初始）**
- `LocationDialog`：名称必填、保存参数中 `parent_id` 的条件注入、描述裁剪。
- `ItemDialog`：加载位置列表 API 调用、保存参数裁剪与数值字段处理。
- 迁移验证：表存在性、`parent_id = 0` 迁移修复行为。

**非目标**
- 不引入端到端测试（Playwright/Cypress）。
- 暂不覆盖 Tauri command 的完整业务链路，先保证数据库层面的行为稳定。
