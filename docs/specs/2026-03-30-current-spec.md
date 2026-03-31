# Dora Current Spec

**版本**: 1.0
**日期**: 2026-03-30
**状态**: 当前有效 / 持续更新

---

## 1. Context

当前 Dora 已从最初 MVP 演进到 Phase 2 实现阶段。需求文档不再保留在仓库根目录，统一收敛到 `docs/specs/` 下维护；本文件作为当前有效需求真相，汇总已确认的产品范围、关键接口、验收标准，以及开发中新增的约束。

当前重点能力包括：
- 首页、聊天、便签、设置四个主要界面
- 真实 Claude 接入与失败 fallback
- 本地设置读写、聊天历史、便签持久化
- 可配置 Base URL
- API Key 测试、来源透明化
- 首页视觉简化

---

## 2. Requirements

### 2.1 Functional Requirements

- [ ] REQ-1: 用户必须能够从 Dora 首页进入聊天、便签和设置面板，三者保持互斥切换。
- [ ] REQ-2: 聊天窗口必须允许用户输入并发送文本消息，并在发送后先展示用户消息。
- [ ] REQ-3: 当存在有效 Claude 配置时，聊天必须优先调用真实 Claude API。
- [ ] REQ-4: 当 Claude Key 缺失、请求失败或响应异常时，聊天必须自动回退到本地 fallback 回复。
- [ ] REQ-5: 聊天回复来源必须由 Rust 后端显式返回，前端不得自行推断。
- [ ] REQ-6: Claude 失败时必须向前端传递可见失败原因。
- [ ] REQ-7: 聊天消息列表必须本地持久化，并在应用重启后恢复最近一次会话。
- [ ] REQ-8: 设置页必须允许用户查看和修改用户名、主题、provider、API Key、Base URL。
- [ ] REQ-9: 设置页保存后必须将配置持久化到本地 settings，并刷新来源状态。
- [ ] REQ-10: 本地 API Key 必须覆盖环境变量 API Key；若本地为空则回退环境变量。
- [ ] REQ-11: 设置页必须展示当前 API Key 的来源状态（环境变量 / 本地设置覆盖 / 未配置）。
- [ ] REQ-12: 设置页必须提供“测试 API Key”按钮。
- [ ] REQ-13: 测试 API Key 时必须直接使用当前表单中的未保存 API Key 与 Base URL，而不是只使用已持久化配置。
- [ ] REQ-14: Claude 聊天请求与 API Key 测试请求必须共用同一套 Base URL 解析逻辑。
- [ ] REQ-15: Base URL 必须支持默认官方地址和兼容 `anthropic-messages` 的自定义网关（如 `https://code2ai.codes`）。
- [ ] REQ-16: 设置页必须允许用户清空聊天历史。
- [ ] REQ-17: 便签必须支持新增、删除、编辑、拖拽位置和关键词过滤，并持久化结果。
- [ ] REQ-18: 首页不得再渲染自定义 `WindowHeader`。
- [ ] REQ-19: 系统窗口标题栏必须作为唯一主标题来源。
- [ ] REQ-20: Dora 头像 hover 时不得再出现额外操作 icon。
- [ ] REQ-21: 前端所有 Tauri command 调用必须走统一且稳定的 invoke 入口。
- [ ] REQ-22: 用户在项目根目录执行 `npm run tauri dev` 时必须能直接启动桌面应用。
- [ ] REQ-22a: 用户必须可以通过 `pnpm dev` 启动 Dora 开发版。
- [ ] REQ-22b: 用户必须可以通过 `pnpm build:app` 构建 Dora.app。
- [ ] REQ-22c: `pnpm build` 必须只执行前端构建，不得递归触发 Tauri 打包流程。
- [ ] REQ-23: 应用必须新增独立悬浮窗，用于常驻桌面角落展示 Dora 主入口。
- [ ] REQ-24: 独立悬浮窗必须与主窗口分离，聊天、便签、设置仍在主窗口中承载。
- [ ] REQ-25: 系统托盘必须提供显示/隐藏悬浮窗、打开主窗口、退出应用三个基础操作。
- [ ] REQ-26: 点击系统托盘图标时，必须支持直接显示或隐藏悬浮窗。
- [ ] REQ-27: 主窗口关闭时默认不得直接退出应用，而是最小化到系统托盘。
- [ ] REQ-28: 从系统托盘重新打开主窗口时，必须恢复到可交互状态并置前显示。
- [ ] REQ-29: 悬浮窗必须支持无任务栏存在感的常驻展示，避免与主窗口职责混淆。
- [ ] REQ-30: 当前阶段不包含流式输出、多 provider 真接入、全局快捷键、Live2D 真接入、标签系统和账户体系。
- [ ] REQ-31: 陪伴记忆必须作为独立面板管理，不得继续放在聊天界面中。
- [ ] REQ-31a: 首页必须新增“记忆”入口，与聊天、便签、设置并列。
- [ ] REQ-31b: 记忆面板必须允许用户查看、手动新增、删除记忆条目。
- [ ] REQ-31c: 当焦点位于记忆输入框时，按 Enter 必须直接保存该条记忆。
- [ ] REQ-32: 便签卡片必须支持一键加入陪伴记忆。
- [ ] REQ-33: 设置页必须允许用户配置陪伴模式（默认陪伴 / 温柔支持 / 专注搭子），并持久化到本地 settings。
- [ ] REQ-33a: 陪伴模式必须位于独立的“陪伴设置”区域，而不是混在 API / Base URL 等基础配置中。
- [ ] REQ-33b: 设置页必须为每种陪伴模式展示可理解的说明文案，帮助用户区分差异。

- [ ] REQ-34: Claude 聊天请求必须将陪伴模式、用户名和可见陪伴记忆注入系统提示词中。
- [ ] REQ-34: Claude 聊天请求必须将陪伴模式、用户名和可见陪伴记忆注入系统提示词中。
- [ ] REQ-35: 陪伴记忆必须独立持久化到应用数据目录，不得写入仓库。
- [ ] REQ-36: 陪伴记忆能力当前阶段仅支持用户显式管理，不包含自动记忆提取或后台主动提醒.

### 2.2 Non-Functional Requirements

- **平台**: 当前阶段仍以 macOS 本地运行为主。
- **安全**: API Key 不得硬编码在前端代码中，且只能写入应用数据目录，不得写入仓库。
- **容错**: Claude 请求失败时必须稳定 fallback，不能卡死界面。
- **一致性**: 需求文档统一维护在 `docs/specs/`，不再使用根目录 `REQUIREMENTS.md`。
- **可维护性**: 前后端类型、Base URL 解析、Tauri invoke 入口需保持集中和一致。
- **UX**: 首页视觉应简洁，不重复标题，不出现 hover 干扰项；悬浮窗与托盘交互必须直观。
- **桌面集成**: 悬浮窗与主窗口职责必须清晰分离，托盘行为应符合桌面助手应用预期。
- **可恢复性**: 误关主窗口后，用户必须仍能通过托盘恢复应用，而不是丢失入口。

---

## 3. Acceptance Criteria

- [ ] AC-1: Given 用户位于首页, when 点击聊天/便签/设置入口, then 对应面板打开且其他首页内容隐藏。
- [ ] AC-2: Given 用户发送聊天消息, when 请求发出, then 用户消息先显示并出现加载状态。
- [ ] AC-3: Given Claude 请求成功, when 前端收到回复, then 回复来源明确为 `claude`。
- [ ] AC-4: Given Claude 请求失败, when 系统回退, then 回复来源明确为 `fallback` 且包含失败原因。
- [ ] AC-5: Given 用户已有聊天记录, when 重启应用, then 最近一次会话仍可恢复。
- [ ] AC-6: Given 用户保存本地 API Key, when 保存成功, then 来源显示为“本地设置覆盖”。
- [ ] AC-7: Given 用户修改了 API Key 或 Base URL 但尚未保存, when 点击“测试 API Key”, then 后端使用当前表单值进行测试。
- [ ] AC-8: Given Base URL 配置为 `https://code2ai.codes`, when 发起聊天或测试 API Key, then 请求发往该网关。
- [ ] AC-9: Given 用户在设置页点击清空聊天记录, when 返回聊天窗口, then 历史消息被清空并恢复欢迎态。
- [ ] AC-10: Given 便签存在, when 用户新增、编辑、删除、拖拽或过滤, then 行为正确且结果可持久化。
- [ ] AC-11: Given 首页已打开, when 用户查看界面, then 不再看到自定义 `WindowHeader`。
- [ ] AC-12: Given 鼠标移入 Dora 头像, when hover 发生, then 不再出现额外操作 icon。
- [ ] AC-13: Given 用户位于项目根目录, when 执行 `npm run tauri dev`, then 桌面应用可直接启动。
- [ ] AC-13a: Given 用户位于项目根目录, when 执行 `pnpm dev`, then Dora 开发版可直接启动。
- [ ] AC-13b: Given 用户位于项目根目录, when 执行 `pnpm build:app`, then 可产出 Dora.app 构建产物。
- [ ] AC-13c: Given 用户位于项目根目录, when 执行 `pnpm build`, then 仅执行前端构建且不会递归进入 Tauri build。
- [ ] AC-14: Given 查看仓库需求文档, when 查找当前需求, then 仅在 `docs/specs/` 中维护，无需根目录 `REQUIREMENTS.md`。
- [ ] AC-15: Given 应用启动完成, when 用户观察桌面, then 可看到独立悬浮窗而不是只依赖主窗口首页入口。
- [ ] AC-16: Given 用户点击系统托盘图标, when 当前悬浮窗可见, then 悬浮窗被隐藏；反之则显示。
- [ ] AC-17: Given 用户打开系统托盘菜单, when 选择“打开主窗口”, then 主窗口恢复显示并置前。
- [ ] AC-18: Given 用户关闭主窗口, when 关闭动作发生, then 应用不退出而是保留在系统托盘中。
- [ ] AC-19: Given 用户在系统托盘菜单中选择“退出应用”, when 动作执行, then 应用完全退出。
- [ ] AC-20: Given 悬浮窗与主窗口同时存在, when 用户使用聊天/便签/设置, then 这些功能仍只在主窗口中打开。
- [ ] AC-21: Given 悬浮窗显示在桌面角落, when 查看任务栏或 Dock 行为, then 悬浮窗不作为独立任务入口干扰主窗口。
- [ ] AC-22: Given 主窗口已被关闭到托盘, when 用户从托盘重新打开, then 应用恢复到可继续使用状态。
- [ ] AC-23: Given 用户位于首页, when 点击“记忆”, then 打开独立记忆面板而不是聊天窗口内嵌区。
- [ ] AC-24: Given 用户在记忆面板新增陪伴记忆, when 应用重启后重新打开记忆面板, then 该记忆仍然存在。
- [ ] AC-25: Given 用户在便签卡片上点击“记住”, when 动作完成, then 该便签内容出现在独立记忆面板中。
- [ ] AC-26: Given 用户切换陪伴模式为“温柔支持”或“专注搭子”, when 后续发送聊天消息, then 后端构造的系统提示词包含对应模式指令。
- [ ] AC-27: Given 旧版本 settings 文件没有 `companionMode`, when 新版本读取配置, then 自动回退为 `default`。
- [ ] AC-28: Given 当前阶段陪伴记忆已上线, when 用户使用产品, then 不会收到后台自动提醒或自动提取出的隐式记忆。
- [ ] AC-29: Given 用户在记忆输入框聚焦, when 按 Enter, then 当前输入内容立即保存为新记忆。
- [ ] AC-30: Given 用户进入聊天窗口, when 查看底部输入区, then 不再看到陪伴记忆管理 UI。

---

## 4. Scope Boundaries

---

## 4. Scope Boundaries

---

## 4. Scope Boundaries

### In Scope
- 首页、聊天、便签、设置四个主要面板
- 独立悬浮窗
- 系统托盘菜单与点击行为
- 主窗口关闭到托盘而非直接退出
- Claude API 接入与 fallback
- Base URL 配置与 API Key 测试
- 本地 settings / chat history / memo 持久化
- 首页视觉简化
- 根目录 Tauri dev 启动修复
- 需求文档统一收敛到 `docs/specs/`

### Out of Scope
- 流式输出
- 多 provider 真接入
- 全局快捷键
- Live2D 真接入
- 标签系统
- 用户账户/同步
- 悬浮窗上的复杂工具面板
- 托盘通知或未读数体系

---

## 5. Interfaces

```ts
interface Settings {
  userName: string;
  theme: 'light' | 'dark' | 'auto';
  provider: 'claude';
  apiKey: string;
  baseUrl: string;
}

interface SettingsStatus {
  source: 'env' | 'local' | 'missing';
  hasApiKey: boolean;
}

interface ChatReply {
  content: string;
  source: 'claude' | 'fallback';
  debugError?: string | null;
}

interface FloatingWindowState {
  visible: boolean;
}
```

```ts
invoke('chat', { message, history })
invoke('get_settings')
invoke('save_settings', { settings })
invoke('get_settings_status')
invoke('test_api_key', { apiKey, baseUrl })
invoke('get_chat_history')
invoke('clear_chat_history')
invoke('get_memos')
invoke('save_memo', { memo })
invoke('update_memo', { memo })
invoke('delete_memo', { id })
invoke('show_main_window')
invoke('show_floating_window')
invoke('hide_floating_window')
invoke('toggle_floating_window')
invoke('quit_app')
```

托盘菜单：
- 显示/隐藏悬浮窗
- 打开主窗口
- 退出应用
```

---

## 6. Test Cases

- Test 1: 首页可进入聊天、便签、设置并互斥切换。
- Test 2: 聊天发送时展示用户消息、加载态、真实回复或 fallback。
- Test 3: Claude 失败原因与来源字段可传到前端。
- Test 4: 聊天记录可持久化并可清空。
- Test 5: 设置页可保存用户名、主题、API Key、Base URL。
- Test 6: 设置页正确显示 API Key 来源状态。
- Test 7: “测试 API Key” 使用未保存表单值。
- Test 8: 自定义 Base URL 可用于聊天和 API Key 测试。
- Test 9: 便签支持新增、编辑、删除、拖拽和过滤。
- Test 10: 首页不再渲染自定义 `WindowHeader`，头像 hover 不再出现额外 icon。
- Test 11: 根目录执行 `npm run tauri dev` 可直接启动。
- Test 11a: 根目录执行 `pnpm dev:app` 可直接启动 Dora 开发版。
- Test 11b: 根目录执行 `pnpm build:app` 可直接产出 Dora.app 构建产物。
- Test 12: 当前需求文档仅在 `docs/specs/` 中维护。
- Test 13: 应用启动后可显示独立悬浮窗。
- Test 14: 点击托盘图标可切换悬浮窗显示状态。
- Test 15: 托盘菜单可打开主窗口。
- Test 16: 关闭主窗口后应用仍保留在托盘。
- Test 17: 托盘菜单“退出应用”可完全退出进程。
- Test 18: 聊天/便签/设置仍只在主窗口中打开。

---

## 7. Changes During Development

| Date | Change | Reason |
|------|--------|--------|
| 2026-03-29 | 需求文档职责统一到 `docs/specs/`，并补 current spec | 用户确认 |
| 2026-03-29 | 本地 API key 必须可真实保存到本地 settings，并显示来源为“本地设置覆盖” | 用户确认 |
| 2026-03-29 | `npm run tauri dev` 必须可从项目根目录直接启动 | 用户确认 |
| 2026-03-29 | 聊天回复来源必须由 Rust 后端显式返回，并暴露失败原因 | 用户确认 |
| 2026-03-29 | 设置页需新增“测试 API key”按钮 | 用户确认 |
| 2026-03-30 | Claude 请求需支持可配置 Base URL，并兼容 `anthropic-messages` 网关 | 用户确认 |
| 2026-03-30 | 测试 API key 必须直接使用当前表单中的未保存 API Key 与 Base URL | 用户确认 |
| 2026-03-30 | 首页移除自定义 `WindowHeader`，并去掉头像 hover icon | 用户确认 |
| 2026-03-30 | 根目录 `REQUIREMENTS.md` 不再保留，需求文档完全收敛到 `docs/specs/` | 用户确认 |
| 2026-03-30 | 新增独立悬浮窗 + 系统托盘；托盘支持显示/隐藏悬浮窗、打开主窗口、退出应用；主窗口关闭默认最小化到托盘 | 用户确认 |
