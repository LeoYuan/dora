# Dora

Dora 是一个基于 **Tauri + React + TypeScript + Rust** 的桌面陪伴助手原型项目。

当前项目主要在做一个本地优先的 macOS 桌面助手，核心方向是：
- 用 Dora 作为桌面常驻入口
- 支持聊天、便签、设置等日常交互
- 通过 Rust 承担本地存储和 Claude API 集成
- 在 Claude 不可用时保留 fallback，保证应用可用性

## 当前能力

- 独立主窗口：承载聊天、便签、设置
- 独立悬浮窗：常驻桌面角落，作为 Dora 入口
- 系统托盘：
  - 显示/隐藏悬浮窗
  - 打开主窗口
  - 退出应用
- 聊天：
  - 真实 Claude API 调用
  - fallback 回复
  - 聊天历史本地持久化
- 设置：
  - 用户名 / 主题 / API Key / Base URL
  - API Key 来源展示
  - 未保存表单值直接测试 API Key
- 便签：
  - 新增 / 删除 / 编辑
  - 拖拽定位
  - 搜索过滤

## 技术栈

- Frontend: React 19, TypeScript, Vite, Zustand
- Desktop shell: Tauri 2
- Backend/native: Rust
- Testing: Vitest, Testing Library

## 本地开发

安装依赖：

```bash
npm install
```

启动前端开发环境：

```bash
npm run dev
```

启动桌面应用：

```bash
npm run tauri dev
```

运行测试：

```bash
npm test -- --run
```

构建：

```bash
npm run build
```

## 项目目标

Dora 不是一个纯聊天窗口，而是一个更接近“桌面助手 / 陪伴入口”的应用原型。项目当前重点在于把以下几件事打通：

- 桌面入口体验
- 主窗口与悬浮窗协作
- Claude 集成与 fallback 容错
- 本地持久化
- 后续继续扩展的结构基础

## 目录

- `src/`：React 前端
- `src-tauri/`：Tauri + Rust 桌面能力
- `docs/specs/`：需求与规格文档
