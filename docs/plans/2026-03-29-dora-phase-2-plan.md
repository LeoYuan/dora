# Dora Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add settings, real Claude API integration with fallback, chat history persistence, and richer memo interactions without breaking the current Dora MVP flow.

**Architecture:** Keep React focused on presentation and panel state, and move native responsibilities into Rust modules with narrow command boundaries. Settings, chat history, memo storage, and Claude API calls all live behind Tauri commands so secrets and persistence remain outside the frontend. The chat command becomes a provider-or-fallback orchestrator, while the memo command set expands to support edits and persisted positions.

**Tech Stack:** Tauri v2, React, TypeScript, Zustand, Vitest, Rust, serde, local JSON persistence, Claude API over HTTPS from Rust

---

## File Structure

### Existing files to modify
- `REQUIREMENTS.md` — update requirements summary or add pointer to phase 2 spec if desired
- `src/App.tsx` — add settings entry flow and compose settings panel
- `src/stores/appStore.ts` — add settings panel state
- `src/components/ChatWindow.tsx` — load persisted history, keep UI stable while backend source changes
- `src/components/MemoPad.tsx` — editing, dragging, filtering UI
- `src/components/WindowHeader.tsx` — optionally show active user name/theme affordances if needed
- `src/components/__tests__/App.test.tsx` — root flow coverage including settings
- `src/components/__tests__/ChatWindow.test.tsx` — success/fallback/history/clear coverage
- `src/components/__tests__/MemoPad.test.tsx` — edit/filter/drag coverage
- `src/stores/__tests__/appStore.test.ts` — settings panel state coverage
- `src-tauri/src/lib.rs` — slim entrypoint, module wiring, command registration
- `src-tauri/Cargo.toml` — add dependencies for HTTP + storage support

### Files to create
- `src/components/SettingsPanel.tsx` — settings form UI
- `src/components/__tests__/SettingsPanel.test.tsx` — settings interaction tests
- `src/types/settings.ts` — shared frontend settings types
- `src-tauri/src/chat.rs` — Claude call orchestration, fallback reply generation, chat history persistence
- `src-tauri/src/settings.rs` — settings models, load/save, source resolution
- `src-tauri/src/memos.rs` — memo CRUD, edit, drag persistence helpers
- `src-tauri/src/storage.rs` — shared JSON file read/write helpers and app data path helpers
- `src-tauri/src/models.rs` — shared Rust data types for settings/chat/memo if extraction keeps modules smaller

### File responsibility map
- `App.tsx` only decides which panel is visible.
- `SettingsPanel.tsx` owns form rendering and local editing state, not persistence details.
- `ChatWindow.tsx` remains a client of `invoke('chat')`, `invoke('get_chat_history')`, and `invoke('clear_chat_history')`.
- `MemoPad.tsx` remains the only place with memo interaction UI.
- `settings.rs`, `chat.rs`, `memos.rs`, and `storage.rs` each own one backend concern.

---

## Chunk 1: Add settings flow and types

### Task 1: Extend app panel state to include settings

**Files:**
- Modify: `src/stores/appStore.ts`
- Modify: `src/stores/__tests__/appStore.test.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/__tests__/App.test.tsx`

- [ ] **Step 1: Write the failing store tests**

Add cases for:
```ts
it('openSettings closes chat and memos')
it('closeSettings hides the settings panel')
it('resetPanels closes settings too')
```

- [ ] **Step 2: Run the focused store test**

Run: `npm test -- appStore.test.ts`
Expected: FAIL because settings actions/state do not exist yet.

- [ ] **Step 3: Add settings state/actions to `appStore.ts`**

Keep the store minimal:
```ts
isSettingsOpen: boolean
openSettings: () => void
closeSettings: () => void
```
`openSettings` must close chat and memo panels.

- [ ] **Step 4: Update `App.tsx` to wire the settings button into store state**

Requirements:
- home view still shows only when all panels are closed
- clicking “设置” opens settings instead of doing nothing
- closing settings returns to home

- [ ] **Step 5: Update root flow tests**

Add cases for:
```tsx
it('opens settings from the home action')
it('returns to home after closing settings')
```

- [ ] **Step 6: Re-run the focused tests**

Run: `npm test -- appStore.test.ts App.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/stores/appStore.ts src/stores/__tests__/appStore.test.ts src/App.tsx src/components/__tests__/App.test.tsx

git commit -m "feat: add settings panel state"
```

### Task 2: Add frontend settings types and settings panel shell

**Files:**
- Create: `src/types/settings.ts`
- Create: `src/components/SettingsPanel.tsx`
- Create: `src/components/__tests__/SettingsPanel.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Write the failing settings panel test**

Cover:
```tsx
it('renders user name, theme, provider, and api key inputs')
it('shows settings source status text')
it('calls onClose when close button is clicked')
```

- [ ] **Step 2: Run the focused settings test**

Run: `npm test -- SettingsPanel.test.tsx`
Expected: FAIL because the panel does not exist yet.

- [ ] **Step 3: Create `src/types/settings.ts`**

Define:
```ts
export interface Settings {
  userName: string
  theme: 'light' | 'dark' | 'auto'
  provider: 'claude'
  apiKey: string
}

export interface SettingsStatus {
  source: 'env' | 'local' | 'missing'
  hasApiKey: boolean
}
```

- [ ] **Step 4: Create the minimal `SettingsPanel.tsx` shell**

Render:
- username input
- theme selector
- provider selector/label
- API key input
- source status text
- save button
- clear chat history button
- close button

Do not implement persistence yet; use props-driven data and callbacks.

- [ ] **Step 5: Mount the settings panel from `App.tsx`**

Pass temporary stub props if needed so the panel renders through the real app path.

- [ ] **Step 6: Re-run the focused settings test**

Run: `npm test -- SettingsPanel.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/types/settings.ts src/components/SettingsPanel.tsx src/components/__tests__/SettingsPanel.test.tsx src/App.tsx

git commit -m "feat: add settings panel shell"
```

---

## Chunk 2: Persist settings and expose source status

### Task 3: Add backend settings storage and source resolution

**Files:**
- Create: `src-tauri/src/settings.rs`
- Create: `src-tauri/src/storage.rs`
- Optional Create: `src-tauri/src/models.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/Cargo.toml`

- [ ] **Step 1: Add failing backend tests for settings source resolution**

At minimum cover:
- env key only → source `env`
- local key only → source `local`
- both present → source `local`
- neither present → source `missing`

- [ ] **Step 2: Run Rust tests to verify failure**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: FAIL because settings module and resolution logic do not exist yet.

- [ ] **Step 3: Add required Rust dependencies**

In `src-tauri/Cargo.toml`, add only what is necessary for:
- JSON persistence
- environment access
- HTTP client later in chat task (prefer adding here if shared)

- [ ] **Step 4: Create `storage.rs` shared helpers**

Implement helpers for:
- app data file path lookup
- read JSON file with default fallback
- write JSON file atomically enough for current local use

- [ ] **Step 5: Create `settings.rs`**

Implement:
```rust
pub struct Settings { ... }
pub struct SettingsStatus { ... }
#[tauri::command] fn get_settings(...)
#[tauri::command] fn save_settings(...)
#[tauri::command] fn get_settings_status(...)
```

Use env var name(s) explicitly in code and tests. Keep one canonical Claude key env var for this phase.

- [ ] **Step 6: Register settings commands from `lib.rs`**

Keep `lib.rs` limited to module imports and `generate_handler!` wiring.

- [ ] **Step 7: Re-run Rust tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/src/lib.rs src-tauri/src/settings.rs src-tauri/src/storage.rs src-tauri/src/models.rs

git commit -m "feat: add persisted settings and key source status"
```

### Task 4: Wire settings panel to backend commands

**Files:**
- Modify: `src/components/SettingsPanel.tsx`
- Modify: `src/components/__tests__/SettingsPanel.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Extend the failing settings panel test**

Add cases for:
```tsx
it('loads persisted settings on mount')
it('saves settings through invoke')
it('shows the resolved key source status returned by backend')
it('invokes clear chat history callback')
```

- [ ] **Step 2: Run the focused test to verify failure**

Run: `npm test -- SettingsPanel.test.tsx`
Expected: FAIL because backend wiring is missing.

- [ ] **Step 3: Implement invoke-based loading and saving in `SettingsPanel.tsx`**

Use:
- `invoke('get_settings')`
- `invoke('get_settings_status')`
- `invoke('save_settings', { settings })`

Keep the form local-state driven; do not move form state to Zustand.

- [ ] **Step 4: Add a clear chat history action hook**

Expose a button that calls a prop or directly invokes `clear_chat_history`, depending on the final component boundary you choose. Keep it simple and test it directly.

- [ ] **Step 5: Re-run the focused settings test**

Run: `npm test -- SettingsPanel.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/SettingsPanel.tsx src/components/__tests__/SettingsPanel.test.tsx src/App.tsx

git commit -m "feat: wire settings panel to backend"
```

---

## Chunk 3: Add real Claude API orchestration with fallback and persisted history

### Task 5: Load and clear chat history through the existing chat window

**Files:**
- Modify: `src/components/ChatWindow.tsx`
- Modify: `src/components/__tests__/ChatWindow.test.tsx`
- Create or Modify: `src-tauri/src/chat.rs`
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Write the failing chat window tests for history**

Add cases for:
```tsx
it('loads existing chat history on mount')
it('restores welcome state after clear history')
```

- [ ] **Step 2: Run the focused chat test**

Run: `npm test -- ChatWindow.test.tsx`
Expected: FAIL because history commands are not implemented yet.

- [ ] **Step 3: Add history persistence commands in `chat.rs`**

Implement:
```rust
#[tauri::command] fn get_chat_history(...) -> Vec<ChatMessage>
#[tauri::command] fn clear_chat_history(...) -> Result<(), String>
```

Persist the latest session as JSON through `storage.rs`.

- [ ] **Step 4: Update `ChatWindow.tsx` to load history on mount**

Rules:
- if saved history exists, render it
- if no history exists, keep welcome message
- keep send UX unchanged

- [ ] **Step 5: Re-run the focused chat test**

Run: `npm test -- ChatWindow.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/ChatWindow.tsx src/components/__tests__/ChatWindow.test.tsx src-tauri/src/chat.rs src-tauri/src/lib.rs

git commit -m "feat: persist and clear chat history"
```

### Task 6: Route chat through Claude first, then fallback to mock

**Files:**
- Modify: `src-tauri/src/chat.rs`
- Modify: `src-tauri/Cargo.toml`
- Modify: `src/components/__tests__/ChatWindow.test.tsx`

- [ ] **Step 1: Add failing backend tests around provider selection and fallback**

Cover:
- valid settings/env → Claude path selected
- missing key → mock path selected
- Claude request error → mock reply returned

- [ ] **Step 2: Run Rust tests to verify failure**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: FAIL because orchestration is not implemented yet.

- [ ] **Step 3: Add the minimal Claude client implementation in `chat.rs`**

Requirements:
- use a Rust HTTP client from the backend
- read resolved settings via `settings.rs`
- send a single prompt request to Claude
- return one reply string
- keep the Dora persona simple and inline for now
- no streaming

- [ ] **Step 4: Implement fallback behavior in the same command**

If key missing, request fails, or response is malformed:
- return existing mock reply generation result
- still append assistant message to persisted history

- [ ] **Step 5: Keep frontend contract unchanged**

`ChatWindow.tsx` should still call:
```ts
invoke('chat', { message, history })
```
No UI flow changes beyond history load/clear.

- [ ] **Step 6: Re-run Rust tests and frontend chat tests**

Run:
- `cargo test --manifest-path src-tauri/Cargo.toml`
- `npm test -- ChatWindow.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src-tauri/Cargo.toml src-tauri/src/chat.rs src/components/__tests__/ChatWindow.test.tsx

git commit -m "feat: add claude chat with mock fallback"
```

---

## Chunk 4: Expand memo interactions without broadening scope

### Task 7: Add memo editing and search/filter UI

**Files:**
- Modify: `src/components/MemoPad.tsx`
- Modify: `src/components/__tests__/MemoPad.test.tsx`
- Modify: `src-tauri/src/memos.rs`
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Extend the failing memo test for editing and filtering**

Add cases for:
```tsx
it('edits an existing memo')
it('filters memos by keyword')
it('keeps filter results in sync after edit/delete')
```

- [ ] **Step 2: Run the focused memo test**

Run: `npm test -- MemoPad.test.tsx`
Expected: FAIL because edit/filter behavior does not exist yet.

- [ ] **Step 3: Add backend `update_memo` command in `memos.rs`**

Persist updated content and position using existing JSON storage.

- [ ] **Step 4: Implement minimal editing UI in `MemoPad.tsx`**

Keep it simple:
- inline edit state per memo or one active editor
- save on explicit action or blur
- no rich text

- [ ] **Step 5: Implement search/filter UI**

Add one input at top of memo panel that filters current memo list by content substring.

- [ ] **Step 6: Re-run the focused memo test**

Run: `npm test -- MemoPad.test.tsx`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/MemoPad.tsx src/components/__tests__/MemoPad.test.tsx src-tauri/src/memos.rs src-tauri/src/lib.rs

git commit -m "feat: add memo editing and filtering"
```

### Task 8: Add persisted memo dragging

**Files:**
- Modify: `src/components/MemoPad.tsx`
- Modify: `src/components/__tests__/MemoPad.test.tsx`
- Modify: `src-tauri/src/memos.rs`

- [ ] **Step 1: Write the failing drag persistence test**

Cover:
```tsx
it('updates memo position after drag interaction')
```

Use the simplest interaction abstraction possible in tests; do not build a full drag framework.

- [ ] **Step 2: Run the focused memo test**

Run: `npm test -- MemoPad.test.tsx`
Expected: FAIL because drag persistence is missing.

- [ ] **Step 3: Implement minimal drag behavior in `MemoPad.tsx`**

Requirements:
- drag memo card within panel bounds or roughly within visible panel area
- update local position during drag
- persist final position through `invoke('update_memo', { memo })`

Keep it mouse-first for this phase. Touch support is out of scope unless nearly free.

- [ ] **Step 4: Re-run the focused memo test**

Run: `npm test -- MemoPad.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/MemoPad.tsx src/components/__tests__/MemoPad.test.tsx src-tauri/src/memos.rs

git commit -m "feat: persist dragged memo positions"
```

---

## Chunk 5: Final verification and regression sweep

### Task 9: Verify the full phase 2 surface

**Files:**
- Verify only, unless a final small fix is needed

- [ ] **Step 1: Run frontend tests**

Run: `npm test`
Expected: all Vitest suites PASS.

- [ ] **Step 2: Run frontend build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Run Rust tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: PASS.

- [ ] **Step 4: Run coverage for modified frontend behavior**

Run: `npm run test -- --coverage`
Expected: coverage succeeds and modified frontend code is fully covered.

- [ ] **Step 5: Manually verify the integrated app flow**

Check:
- home → settings → save username/theme/key
- settings shows correct key source
- chat with valid key uses Claude path
- chat with missing/bad key falls back to mock
- history survives restart
- clear history works
- memo edit works
- memo drag persists
- memo filter works without breaking edit/delete

- [ ] **Step 6: Compare results against `docs/specs/2026-03-29-dora-phase-2-spec.md`**

Explicitly verify REQ-1 through REQ-19 and AC-1 through AC-15.

- [ ] **Step 7: Commit any final verification fixes**

```bash
git add <exact files changed during verification>

git commit -m "test: verify dora phase 2 flow"
```

---

Plan complete and saved to `docs/plans/2026-03-29-dora-phase-2-plan.md`. Ready to execute?
