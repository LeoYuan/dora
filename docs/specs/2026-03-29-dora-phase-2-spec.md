# Dora Phase 2 Spec

**版本**: 1.0
**日期**: 2026-03-29
**状态**: 已确认 / 待实现

---

## 1. Context

Dora 第一轮 MVP 已经完成本地闭环：主首页、聊天、便签、窗口切换和本地 mock 回复可用。下一阶段目标是在不打破当前使用路径的前提下，补上用户真正会持续使用的能力：可配置设置页、真实 Claude API 接入、本地聊天历史，以及更可用的便签交互。

本阶段继续采用 **Tauri/Rust 作为本地能力与外部集成边界** 的方案：
- 前端负责 UI 与交互状态
- Rust 负责本地设置读写、聊天持久化、便签持久化和 Claude API 调用
- 当真实 Claude API 不可用时，聊天仍必须回退到现有 mock 回复，保证功能可用

这样既能提升产品可用性，也不会把 API Key 和本地存储逻辑散落到前端。

---

## 2. Requirements

### 2.1 Functional Requirements

- [ ] REQ-1: 用户必须能够从 Dora 首页进入设置页。
- [ ] REQ-2: 设置页必须允许用户查看和修改用户名。
- [ ] REQ-3: 设置页必须允许用户查看和修改主题模式（light / dark / auto）。
- [ ] REQ-4: 设置页必须包含 API Provider 字段；本阶段 UI 可仅提供 Claude，但数据结构必须保留 provider 字段。
- [ ] REQ-5: 设置页必须允许用户输入并保存本地 API Key。
- [ ] REQ-6: 系统必须优先读取环境变量中的 Claude API Key；若本地设置中存在 API Key，则本地值覆盖环境变量。
- [ ] REQ-7: 设置页必须明确展示当前 API Key 的生效来源（环境变量 / 本地设置覆盖 / 未配置）。
- [ ] REQ-8: 聊天请求必须继续通过 Tauri command 发起，不允许前端直接调用 Claude API。
- [ ] REQ-9: 当存在有效 Claude 配置时，聊天必须优先调用真实 Claude API。
- [ ] REQ-10: 当未配置有效 Claude Key、调用失败、或响应异常时，聊天必须自动回退到现有 mock 回复。
- [ ] REQ-11: 引入真实 Claude API 后，不得改变现有聊天窗口的发送、加载态、消息展示和关闭路径。
- [ ] REQ-12: 聊天消息列表必须本地持久化，并在应用重启后恢复最近一次会话。
- [ ] REQ-13: 用户必须能够从设置页触发清空聊天记录。
- [ ] REQ-14: 便签必须支持编辑内容。
- [ ] REQ-15: 便签必须支持拖拽位置，并把位置持久化到本地。
- [ ] REQ-16: 便签面板必须支持按关键词搜索 / 过滤便签内容。
- [ ] REQ-17: 搜索 / 过滤不得破坏新增、编辑、删除和拖拽便签的现有路径。
- [ ] REQ-18: 本阶段不包含流式输出、多 provider 真接入、便签置顶、标签系统、账户体系。
- [ ] REQ-19: 当前 Rust `lib.rs` 中的聊天、设置、便签、存储职责必须拆分为独立模块，避免继续堆积在单文件中。

### 2.2 Non-Functional Requirements

- **平台**: 本阶段仍以 macOS 本地运行为主。
- **安全**: API Key 不得硬编码在前端代码中；前端只能通过 Tauri command 间接使用配置。
- **容错**: Claude 调用失败时必须有稳定 fallback，不能让聊天界面卡死或中断。
- **可演进性**: Settings、Chat、Memo、Storage 模块边界必须清晰，便于后续增加更多 provider、tray、shortcut、Live2D。
- **UX**: 设置页、聊天页、便签页之间的进入和返回路径必须与当前 MVP 一致且直观。
- **性能**: 本地聊天记录和便签搜索应在当前小规模数据量下保持即时响应，不为本阶段引入复杂索引系统。

---

## 3. Acceptance Criteria

- [ ] AC-1: Given 用户位于首页, when 点击“设置”, then 设置页成功打开。
- [ ] AC-2: Given 设置页已打开, when 用户修改用户名并保存, then 重新打开应用后仍能看到更新后的用户名。
- [ ] AC-3: Given 设置页已打开, when 用户切换主题模式, then UI 按所选模式更新或按系统模式生效。
- [ ] AC-4: Given 环境变量中已存在 Claude API Key, when 用户查看设置页, then 页面显示当前来源为环境变量。
- [ ] AC-5: Given 环境变量已存在 Key 且用户在设置页保存本地 Key, when 再次发送消息, then 系统使用本地覆盖值并显示来源为本地设置。
- [ ] AC-6: Given 已存在有效 Claude 配置, when 用户发送聊天消息, then 应用优先返回真实 Claude 回复。
- [ ] AC-7: Given Claude Key 缺失或 Claude 调用失败, when 用户发送聊天消息, then 应用仍返回 mock 回复而不是中断聊天流程。
- [ ] AC-8: Given 用户已有聊天记录, when 关闭并重新打开应用, then 最近一次会话消息仍然可见。
- [ ] AC-9: Given 设置页中点击清空聊天记录, when 返回聊天窗口, then 历史消息被清空并恢复到初始欢迎态。
- [ ] AC-10: Given 便签列表中存在便签, when 用户编辑内容, then 更新后的内容立即显示并在重启后保留。
- [ ] AC-11: Given 便签列表中存在便签, when 用户拖拽便签到新位置, then 新位置立即生效并在重启后保留。
- [ ] AC-12: Given 便签列表中存在多条便签, when 用户输入搜索关键词, then 列表只显示匹配内容的便签。
- [ ] AC-13: Given 搜索过滤状态下, when 用户删除或编辑匹配便签, then 行为仍正确且过滤结果同步更新。
- [ ] AC-14: Given 本阶段实现完成, when 审查代码结构, then Rust 职责已拆分，不再由单个 `lib.rs` 承担所有业务逻辑。
- [ ] AC-15: Given 本阶段实现完成, when 审查功能范围, then 不包含流式回复、多 provider 真接入、置顶、标签系统和账户体系。

---

## 4. Scope Boundaries

### In Scope
- 设置页基础功能（用户名、主题、provider、API Key、来源提示）
- 真实 Claude API 接入
- Claude 失败 fallback 到 mock 回复
- 聊天记录本地持久化与清空
- 便签编辑
- 便签拖拽与位置持久化
- 便签搜索 / 过滤
- Rust 模块拆分

### Out of Scope
- 流式输出
- 多 provider 真接入
- 语音能力
- 系统托盘与全局快捷键
- Live2D 真接入
- 便签置顶
- 标签系统
- 用户登录或账户同步

---

## 5. Interfaces

### Frontend Types

```ts
interface AppState {
  isChatOpen: boolean;
  isMemoOpen: boolean;
  isSettingsOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  openMemo: () => void;
  closeMemo: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  resetPanels: () => void;
}

interface Settings {
  userName: string;
  theme: 'light' | 'dark' | 'auto';
  provider: 'claude';
  apiKey: string;
}

interface SettingsStatus {
  source: 'env' | 'local' | 'missing';
  hasApiKey: boolean;
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

### Tauri Commands

```ts
invoke('chat', { message, history })
invoke('get_settings')
invoke('save_settings', { settings })
invoke('get_settings_status')
invoke('clear_chat_history')
invoke('get_chat_history')
invoke('update_memo', { memo })
invoke('get_memos')
invoke('save_memo', { memo })
invoke('delete_memo', { id })
```

---

## 6. Test Cases

- Test 1: 首页可以进入设置页并返回。
- Test 2: 设置页可以保存用户名、主题和本地 API Key。
- Test 3: 设置页正确显示 API Key 来源状态。
- Test 4: 有效 Claude 配置下聊天走真实 Claude 路径。
- Test 5: Claude 调用失败时聊天回退到 mock。
- Test 6: 聊天记录可持久化并在重启后恢复。
- Test 7: 清空聊天记录后聊天窗口恢复欢迎态。
- Test 8: 便签可编辑并持久化。
- Test 9: 便签可拖拽并持久化位置。
- Test 10: 便签可按关键词过滤，过滤下编辑/删除仍正常。
- Test 11: Rust 模块拆分后命令注册与原有调用保持兼容。

---

## 7. Changes During Development

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-29 | 新阶段确认同时推进设置页、真实 Claude API、聊天记录持久化、便签增强 | 用户确认 |
| 2026-03-29 | Claude API Key 配置采用“优先环境变量，本地设置可覆盖”策略 | 用户确认 |
| 2026-03-29 | 聊天记录要求本地持久化并在重启后恢复 | 用户确认 |
| 2026-03-29 | 便签增强范围锁定为编辑、拖拽位置、搜索/过滤 | 用户确认 |
