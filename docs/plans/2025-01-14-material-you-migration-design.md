# Material You 迁移设计文档

**日期：** 2025-01-14
**项目：** Item Classification System
**设计目标：** 从 Material Design 迁移到 Material Design 3 (Material You)

## 1. 概述

### 1.1 目标

将现有的 Material Design 界面完全迁移到 Material You (Material Design 3)，实现：

- 完整的 Material You 体验，包括动态颜色、更新的组件样式、圆角设计、新的颜色系统
- 双模式支持（浅色/深色），支持手动切换和跟随系统
- 分阶段实现：先建立 MD3 基础，后续添加各平台动态颜色提取
- 完全重写所有页面和组件以符合 MD3 规范

### 1.2 迁移范围

**阶段 1：Material Design 3 基础迁移**（当前重点）
- 升级到 MUI v7 的 Material Design 3 主题系统
- 实现动态颜色架构（预设配色方案 + 扩展接口）
- 重构所有页面和组件使用 MD3 组件
- 实现浅色/深色双模式，支持手动切换和系统跟随
- 建立主题配置系统，为后续动态颜色做准备

**阶段 2：动态颜色集成**（后续）
- Android：通过 Tauri 插件访问 Android Material You API
- Windows：实现 Windows 11 壁纸取色
- iOS：实现深色模式跟随（iOS 动态颜色限制较多）

## 2. 架构设计

### 2.1 技术栈

保持现有技术栈，充分利用 MUI v7 的 MD3 能力：

- **MUI v7**：已完整支持 Material Design 3
- **Emotion**：用于动态样式生成
- **Context API**：管理主题状态和切换
- **CSS Variables**：实现动态颜色系统

### 2.2 文件结构

```
frontend/src/
├── theme/
│   ├── index.tsx              # 主题配置入口
│   ├── tokens.ts              # MD3 设计令牌（颜色、间距、圆角）
│   ├── themes.ts              # 预设主题（浅色/深色 + 多套配色）
│   ├── context.tsx            # 主题上下文
│   ├── utils.ts               # 色调生成器工具函数
│   └── components.ts          # MD3 组件样式覆盖
├── components/
│   ├── Layout.tsx             # 迁移到 MD3 导航
│   ├── QRCodeScanner.tsx      # 迁移到 MD3 样式
│   └── ThemeSelector.tsx      # 新增：主题选择器组件
└── pages/
    ├── Dashboard.tsx          # 完全重写
    ├── Locations.tsx          # 完全重写
    ├── Items.tsx              # 完全重写
    ├── Inventory.tsx          # 完全重写
    ├── Labels.tsx             # 完全重写
    └── Settings.tsx           # 完全重写（包含主题切换）
```

## 3. 颜色系统设计

### 3.1 Material You 颜色系统

Material Design 3 使用基于色调（Tonal Palette）的颜色系统，而不是传统的 Primary/Secondary。

**核心概念：**
- 从一个种子颜色生成完整的色调板（13级色调）
- 每个色调包含不同深浅的变化（从最浅到最深）
- 使用语义角色（Primary Container、On Primary、Surface 等）而不是直接使用颜色

### 3.2 预设配色方案

提供 4 套配色方案，每套包含浅色和深色变体：

1. **蓝色系**（默认）
   - 种子颜色：#1976d2（保留现有品牌色）
   - 适用：通用、专业场景

2. **紫色系**
   - 种子颜色：#7c4dff
   - 适用：现代科技感

3. **绿色系**
   - 种子颜色：#00c853
   - 适用：清新自然

4. **琥珀色系**
   - 种子颜色：#ffc107
   - 适用：温暖活力

### 3.3 语义颜色角色

MD3 使用语义化的颜色角色：

- **Primary / On Primary**：主要操作色
- **Primary Container / On Primary Container**：主要容器
- **Secondary / On Secondary**：次要操作色
- **Secondary Container / On Secondary Container**
- **Tertiary / On Tertiary**：强调色
- **Surface / On Surface**：背景色
- **Surface Variant / On Surface Variant**
- **Background / On Background**
- **Error / On Error**：错误色

### 3.4 状态指示

组件状态使用覆盖层（overlay）而非固定颜色：

- hover：添加 8% 透明度的当前色调
- focus：添加 12% 透明度 + focus ring
- pressed：添加 12% 透明度
- dragged：添加 16% 透明度

### 3.5 主题切换机制

```typescript
interface ThemeState {
  mode: 'light' | 'dark' | 'system';
  colorScheme: 'blue' | 'purple' | 'green' | 'amber';
  setMode: (mode: ThemeMode) => void;
  setColorScheme: (scheme: string) => void;
  // computed values
  isDark: boolean;
  currentTheme: Theme;
}
```

功能：
- 自动保存到 localStorage
- 监听系统主题变化（prefers-color-scheme）
- 提供平滑的过渡动画（300ms）

## 4. 组件样式系统

### 4.1 Material You 关键设计变化

**形状（Shape）**
- 小组件：8-12px 圆角（按钮、输入框）
- 中等组件：12-16px（卡片、对话框）
- 大组件：16-28px（底部导航、侧边栏）

**间距（Spacing）**
- 基础单位：8px 网格，但使用更灵活的间距
- 组件内部间距：12-16px
- 列表项高度：72px（从 56px 增加，提升触摸体验）

**排版（Typography）**
- 字体：Roboto
- MD3 新的排版尺度：
  - Display（大标题）：57/48
  - Headline（标题）：32-16
  - Title（题头）：22-14
  - Body（正文）：16-14
  - Label（标签）：14-11
- 行高增加，提升可读性

### 4.2 关键组件更新

**Button**
- 新的圆角样式
- 高度从 36px 增加到 40px
- 更明显的状态变化
- 三种变体：filled、outlined、text

**Card**
- 使用 Elevation + Surface Variant 组合
- 三种变体：elevated、outlined、filled
- 更大的内边距

**Navigation**
- **顶部导航**：使用 Navigation Bar（底部标签栏风格）
- **侧边栏**：更大的导航抽屉，支持头像和展开/收起
- 响应式：桌面显示侧边栏，移动端显示底部导航

**Input**
- 优先使用 Filled 样式（填充式）
- 移除 Outlined 样式作为次要选项
- 增加触摸目标尺寸

**List**
- 列表项高度从 56px 增加到 72px
- 更大的字体和图标
- 支持三行文本

### 4.3 组件迁移清单

**Layout.tsx**
- 迁移到 MD3 Navigation Drawer
- 添加响应式布局（桌面/移动端）
- 集成主题切换按钮
- 添加用户头像区域

**所有页面**
- Dashboard：Card + Grid + 新的图表样式
- Locations/Items：新列表样式 + 更大的触摸目标
- Settings：使用新的设置列表组件
- Labels：表单使用新的输入组件

**QRCodeScanner.tsx**
- 使用 MD3 FAB（悬浮按钮）
- 更新对话框样式
- 优化移动端触摸体验

## 5. 实施步骤

### 阶段 1：基础架构搭建

**步骤 1.1：创建主题系统**
- 安装必要的工具包
- 创建 `theme/` 目录结构
- 实现色调生成器（从种子颜色生成完整色调板）
- 配置 4 套预设配色方案
- 实现主题上下文和切换逻辑

**步骤 1.2：设置全局样式**
- 配置 CSS 变量用于动态颜色
- 更新 CssBaseline 使用 MD3 样式
- 配置全局字体和排版
- 添加主题切换过渡动画

**步骤 1.3：创建主题选择器 UI**
- 在设置页面添加主题选择界面
- 配色方案选择（圆形色块预览）
- 模式切换（浅色/深色/跟随系统）
- 保存用户偏好到 localStorage

### 阶段 2：组件迁移

**步骤 2.1：迁移 Layout**
- 重写为 MD3 Navigation Drawer
- 添加响应式布局（桌面/移动端）
- 集成主题切换按钮
- 添加用户头像区域

**步骤 2.2：迁移页面（按优先级）**
1. **Settings** - 最简单，包含主题切换界面
2. **Dashboard** - 主要展示页面，使用 MD3 Card
3. **Locations/Items** - 列表和表单页面
4. **Inventory** - 数据展示
5. **Labels** - 包含 QR 扫描功能

**步骤 2.3：更新 QRCodeScanner**
- 使用 MD3 FAB（悬浮按钮）
- 更新对话框样式
- 优化移动端触摸体验

### 阶段 3：优化和测试

**步骤 3.1：响应式优化**
- 测试不同屏幕尺寸
- 优化移动端触摸目标
- 确保深色模式可读性

**步骤 3.2：可访问性**
- 检查颜色对比度
- 键盘导航支持
- 屏幕阅读器兼容

**步骤 3.3：平台测试**
- Windows 桌面体验
- Android 触摸和手势
- 性能优化

## 6. 技术实现细节

### 6.1 主题状态管理数据流

```
用户操作 → ThemeContext
    ↓
保存到 localStorage
    ↓
更新 CSS 变量和 MUI 主题
    ↓
所有组件自动重新渲染
    ↓
平滑过渡动画
```

**系统主题监听：**
```typescript
useEffect(() => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', handleSystemThemeChange);
  return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
}, []);
```

### 6.2 错误处理

**主题加载失败**
- Fallback 到默认蓝色浅色主题
- 记录错误但不影响应用运行
- 控制台警告（生产环境静默）

**localStorage 不可用**
- 使用内存状态（当前会话有效）
- 优雅降级，不抛出错误

**系统主题检测失败**
- 默认使用浅色模式
- 添加重试机制

**浏览器兼容性**
- 检测 CSS 变量支持
- 不支持时使用静态样式
- 提供 polyfill 或降级方案

### 6.3 测试策略

**视觉回归测试**
- 截图对比所有页面在浅色/深色模式
- 验证所有 4 套配色方案
- 使用 Chromatic 或类似工具

**响应式测试**
- 测试断点：xs (0px), sm (600px), md (900px), lg (1200px), xl (1536px)
- 重点测试移动端和桌面端布局

**可访问性测试**
- axe-core 自动测试
- 颜色对比度检查（WCAG AA 标准）
- 键盘导航测试

**跨平台测试**
- Windows 桌面
- Android 模拟器/真机
- 不同 DPI 屏幕测试

## 7. 成功标准

- [ ] 所有页面使用 Material Design 3 组件
- [ ] 4 套配色方案正确应用
- [ ] 浅色/深色模式无缝切换
- [ ] 跟随系统主题正常工作
- [ ] 所有组件在移动端和桌面端正常显示
- [ ] 通过可访问性测试（WCAG AA）
- [ ] 主题切换动画流畅
- [ ] 无控制台错误或警告
- [ ] 所有现有功能保持正常工作

## 8. 后续扩展

**动态颜色提取（阶段 2）**
- 研究 Tauri 插件开发
- Android Material You API 集成
- Windows 11 壁纸取色实现
- 创建抽象接口支持未来平台

**可访问性增强**
- 高对比度模式
- 字体缩放支持
- 减少动画模式

**主题扩展**
- 自定义主题编辑器
- 导入/导出主题配置
- 社区主题分享
