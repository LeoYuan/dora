# Dora MVP

## Context
第一轮目标是交付一个可运行、可演示的本地 MVP，先形成聊天、便签、窗口切换的稳定闭环。当前轮次明确不做托盘、全局快捷键、设置页和真实 AI 接口，优先保证桌面形态和核心交互真正可用。

## Requirements

### Functional Requirements
- [ ] REQ-1: 用户可从首页进入聊天面板。
- [ ] REQ-2: 用户可在聊天面板输入并发送文本消息。
- [ ] REQ-3: 系统必须返回一条本地 mock assistant 回复。
- [ ] REQ-4: 回复生成期间必须显示加载状态。
- [ ] REQ-5: 回复失败时必须显示固定错误回复。
- [ ] REQ-6: 用户可从首页进入便签面板。
- [ ] REQ-7: 用户可新增便签。
- [ ] REQ-8: 用户可查看已保存便签列表。
- [ ] REQ-9: 用户可删除便签。
- [ ] REQ-10: 便签数据在应用重启后仍可读取。
- [ ] REQ-11: 首页、聊天、便签三种界面必须互斥切换。
- [ ] REQ-12: 第一轮不包含托盘、快捷键、设置页、真实 AI。

### Non-Functional Requirements
- 平台: 首版仅要求 macOS 本地运行。
- 架构: React 前端负责界面状态，Tauri/Rust 负责本地命令和 memo 持久化。
- 可演进性: 聊天回复源需要保留后续替换真实 AI 的空间。
- UX: 首页、聊天、便签的进入和返回路径必须直观。
- 范围控制: 不为第一轮引入路由、托盘、快捷键或设置体系。

## Acceptance Criteria
- [ ] AC-1: Given 应用已启动, when 用户看到首页, then 能看到 Dora 主入口。
- [ ] AC-2: Given 用户位于首页, when 打开聊天, then 聊天面板显示且首页入口隐藏。
- [ ] AC-3: Given 聊天面板已打开, when 用户发送文本消息, then 消息先显示在列表中。
- [ ] AC-4: Given 用户已发送消息, when 系统生成回复, then 界面显示加载状态。
- [ ] AC-5: Given mock 回复成功, when 返回结果, then 列表追加 assistant 回复。
- [ ] AC-6: Given mock 回复失败, when 调用结束, then 列表追加固定错误回复。
- [ ] AC-7: Given 用户位于首页, when 打开便签, then 便签面板显示且首页入口隐藏。
- [ ] AC-8: Given 用户创建便签, when 添加成功, then 新便签显示在列表中。
- [ ] AC-9: Given 已存在便签, when 用户删除, then 对应便签从列表移除。
- [ ] AC-10: Given 应用重启, when 再次打开便签, then 之前保存的便签仍能读取。
- [ ] AC-11: Given 用户关闭聊天或便签, when 返回首页, then Dora 主入口重新显示。
- [ ] AC-12: Given 第一轮 MVP 完成, when 审查功能范围, then 不包含托盘、快捷键、设置页和真实 AI。

## API/Interface
```ts
interface AppState {
  isChatOpen: boolean;
  isMemoOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  openMemo: () => void;
  closeMemo: () => void;
  resetPanels: () => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Memo {
  id: string;
  content: string;
  color: string;
  position: { x: number; y: number };
  isPinned: boolean;
  createdAt: string;
}
```

## Test Cases
- Test 1: 首页渲染 Dora 主入口，且可进入聊天。
- Test 2: 聊天发送消息后展示用户消息、加载态、mock 回复。
- Test 3: 聊天 invoke 失败时展示固定错误回复。
- Test 4: 便签面板能加载已有便签。
- Test 5: 便签面板能新增并删除便签。
- Test 6: 关闭聊天或便签后回到首页。
- Test 7: 重启应用后仍能读取已保存便签。

## Changes During Development
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-29 | 确认第一轮 MVP 只做基础聊天、基础便签、窗口切换 | 用户确认 |
| 2026-03-29 | 桌面壳能力在第一轮只保留窗口切换，不做托盘优先实现 | 用户确认 |
| 2026-03-29 | 聊天回复先使用本地 mock 闭环，不直接接真实 AI | 用户确认 |
