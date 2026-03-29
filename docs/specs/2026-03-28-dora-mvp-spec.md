# Dora MVP Spec

**版本**: 1.1
**日期**: 2026-03-28
**状态**: 已确认 / 待实现

---

## 1. Context

Dora 的首个 MVP 目标不是一次性完成最终产品形态，而是先交付一个**可运行、可演示、可继续演进**的 macOS 桌面应用闭环。

本次已确认采用 **方案 A**：
- 先完成最小可运行闭环
- Live2D 先用占位角色实现，但保留后续替换接口
- Claude API 先用本地 mock / 规则回复实现，但保留后续切换能力
- 优先确保桌面形态、对话流程、便签功能真正可用

这样可以降低首版集成风险，尽快得到一个稳定的可演示版本。

---

## 2. Requirements

### 2.1 Functional Requirements

- [ ] REQ-1: 应用必须能够以 Tauri + React + TypeScript 形式在 macOS 本地启动。
- [ ] REQ-2: 应用启动后必须展示 Dora 的悬浮角色入口。
- [ ] REQ-3: 用户点击悬浮角色后，必须能够打开聊天窗口。
- [ ] REQ-4: 聊天窗口中，用户必须能够输入并发送文本消息。
- [ ] REQ-5: 用户发送消息后，系统必须返回一条 Dora 风格的回复。
- [ ] REQ-6: MVP 阶段的回复能力允许使用本地 mock / 规则回复，不强制接入真实 Claude API。
- [ ] REQ-13: 在方案 A 基线完成后，允许继续向前实现真实 Claude API 接入，作为 P0 的增强收敛步骤。
- [ ] REQ-14: 真实 Claude API 接入必须通过环境变量或本地配置读取 API Key，不得把密钥硬编码进前端代码。
- [ ] REQ-15: 当未配置 API Key 或调用失败时，应用必须自动回退到现有 mock 回复，保证聊天功能仍然可用。
- [ ] REQ-16: 真实 Claude API 接入不得改变现有聊天窗口交互方式，只替换回复来源。
- [ ] REQ-17: 真实 Claude API 接入完成后，Avatar 仍保持占位实现，Live2D 作为下一步单独推进。
- [ ] REQ-18: 主窗口应改为普通 app 风格，提供可见的 header/title bar 区域。
- [ ] REQ-19: 用户必须能够通过 header 区域拖动窗口移动位置。
- [ ] REQ-20: 主窗口必须支持最小化、最大化/恢复、关闭等标准窗口操作。
- [ ] REQ-21: header 改造后，聊天窗口、便签面板和 Dora 主入口的使用路径不能被破坏。
- [ ] REQ-22: header 风格应与 Dora 当前视觉风格保持一致，不能退化成完全默认的系统裸窗口。
- [ ] REQ-7: MVP 必须提供基础便签功能，允许用户新增便签。
- [ ] REQ-8: 用户必须能够删除已有便签。
- [ ] REQ-9: 便签功能必须能从 Dora 主入口触达。
- [ ] REQ-10: MVP 必须支持悬浮入口与聊天界面之间的基本切换。
- [ ] REQ-11: MVP 阶段允许使用占位 Avatar，不强制完成真实 Live2D SDK 集成。
- [ ] REQ-12: Avatar 组件结构必须为后续 Live2D 集成预留替换空间。

### 2.2 Non-Functional Requirements

- **平台**: 首版仅要求 macOS 本地运行。
- **实现策略**: 优先可运行闭环，不追求一次性完成最终架构。
- **可演进性**: Chat 和 Avatar 的实现必须可被真实 Claude API / Live2D 替换。
- **性能**: MVP 启动后应能流畅打开主要界面，不要求专项性能优化。
- **隐私**: MVP 阶段尽量本地优先，不引入不必要的云端依赖。
- **UX**: 交互必须直观，用户能够理解如何聊天和如何打开便签。
- **项目结构**: MVP 实现应直接以项目根目录作为应用根目录，使用清晰的 `docs / src / src-tauri / public` 结构，不保留额外嵌套的一层 `dora/` 目录。

---

## 3. Acceptance Criteria

- [ ] AC-1: Given 已完成依赖安装，when 启动开发环境，then Dora 桌面应用能够成功打开。
- [ ] AC-2: Given 应用已启动，when 用户看到主界面，then 能看到 Dora 悬浮角色入口。
- [ ] AC-3: Given 用户点击 Dora，when 触发打开动作，then 聊天窗口成功显示。
- [ ] AC-4: Given 聊天窗口已打开，when 用户输入文本并发送，then 消息显示在消息列表中。
- [ ] AC-5: Given 用户已发送消息，when 系统处理完成，then 用户能看到一条 Dora 风格回复。
- [ ] AC-6: Given 用户打开便签面板，when 输入内容并添加，then 新便签显示在列表中。
- [ ] AC-7: Given 便签列表中存在便签，when 用户执行删除操作，then 对应便签从列表中移除。
- [ ] AC-8: Given 当前处于聊天窗口或便签面板，when 用户关闭面板，then 能返回悬浮入口状态。
- [ ] AC-9: Given 当前 Avatar 为占位实现，when 后续接入 Live2D，then 不需要推翻整体 UI 结构。
- [ ] AC-10: Given 已配置有效 Claude API Key，when 用户发送消息，then 应用优先返回真实 Claude 回复。
- [ ] AC-11: Given 未配置 API Key 或 Claude 调用失败，when 用户发送消息，then 应用仍返回本地 fallback 回复而不是中断聊天流程。
- [ ] AC-12: Given 已接入真实 Claude API，when 用户使用聊天窗口，then 输入、发送、加载态和消息展示行为与当前 MVP 基线保持一致。
- [ ] AC-13: Given 真实 Claude API 已接入，when 查看 UI 架构，then Avatar 仍保持可替换为 Live2D 的占位结构。
- [ ] AC-14: Given 应用已启动，when 用户查看主窗口，then 能看到明确的 header/title bar 区域。
- [ ] AC-15: Given 用户按住 header 区域拖动，when 移动鼠标，then 窗口位置随之移动。
- [ ] AC-16: Given 用户点击最小化、最大化/恢复、关闭按钮，when 操作触发，then 对应窗口行为正确执行。
- [ ] AC-17: Given header 改造已完成，when 用户继续打开聊天或便签，then 原有交互流程仍然可用。

---

## 4. Scope Boundaries

### In Scope
- Tauri + React 基础桌面应用
- 悬浮 Dora 入口
- 聊天窗口
- 本地 mock 对话回复
- 基础便签新增/删除
- 基础界面切换
- Avatar 占位实现

### Out of Scope
- 真实 Claude API 接入
- 真实 Live2D SDK 集成
- 长期记忆系统
- 情绪识别
- 倒计时工具
- 系统托盘完整体验打磨
- 语音能力
- 全局快捷键完整配置体验
- SQLite 完整持久化方案

---

## 5. Interfaces

### Frontend Components

```ts
interface AppState {
  mode: 'floating' | 'chat' | 'tools';
  isChatOpen: boolean;
  isMemoOpen: boolean;
}

interface AvatarProps {
  onClick: () => void;
  onMemoClick: () => void;
}

interface ChatWindowProps {
  onClose: () => void;
}

interface MemoPadProps {
  onClose: () => void;
}
```

### Tauri Commands

```ts
invoke('chat', { message, history })
invoke('get_memos')
invoke('save_memo', { memo })
invoke('delete_memo', { id })
```

---

## 6. Test Cases

- Test 1: 应用能正常启动到主界面。
- Test 2: 点击悬浮 Dora 后打开聊天窗口。
- Test 3: 在聊天窗口发送消息后，显示用户消息与系统回复。
- Test 4: 打开便签面板后可新增便签。
- Test 5: 已有便签可删除。
- Test 6: 聊天窗口与便签面板都可关闭并返回主入口。
- Test 7: Avatar 组件仍可被后续 Live2D 实现替换。

---

## 7. Changes During Development

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-28 | 确认 MVP 严格限定为 spec 中的 5 个 P0 项 | 用户确认 |
| 2026-03-28 | 确认采用方案 A：先做可运行闭环，Live2D 和 Claude API 先占位/Mock | 用户确认 |
| 2026-03-28 | 调整项目目录为根目录直接承载应用代码，使用 `docs / src / src-tauri / public` 结构 | 用户要求结构更清晰 |
| 2026-03-29 | 在方案 A MVP 基线之上继续推进真实 Claude API 接入，保持失败时回退到 mock 回复 | 按推荐路径持续推进 |
| 2026-03-29 | 主窗口改为带 header 的普通 app 形态，支持拖动与标准窗口控制 | 用户要求符合普通 app 预期 |
