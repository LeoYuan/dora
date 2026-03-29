# Dora MVP Local Closed Loop Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first Dora MVP as a local closed loop with home/chat/memo switching, mock chat replies, and memo persistence.

**Architecture:** Keep the app as a thin vertical slice. React owns panel state and UI interactions, while Tauri commands back chat replies and memo persistence. The implementation should preserve clear seams so mock chat can later be swapped for a real AI provider without rewriting the UI flow.

**Tech Stack:** Tauri v2, React, TypeScript, Zustand, Vitest, Rust

---

## File Structure

### Modify
- `REQUIREMENTS.md` — approved MVP requirements source of truth
- `src/App.tsx` — root shell and three-state view switching
- `src/components/Avatar.tsx` — Dora entry interactions
- `src/components/ChatWindow.tsx` — chat send/loading/error flow
- `src/components/MemoPad.tsx` — memo create/list/delete UI
- `src/stores/appStore.ts` — mutual-exclusive panel state
- `src-tauri/src/lib.rs` — `chat`, `get_memos`, `save_memo`, `delete_memo` commands and persistence behavior
- `src/styles.css` — minimal global sizing styles if needed
- `index.html` — shell title/background only if needed for MVP consistency

### Verify existing tests
- `src/components/__tests__/App.test.tsx`
- `src/components/__tests__/ChatWindow.test.tsx`
- `src/components/__tests__/MemoPad.test.tsx`
- `src/stores/__tests__/appStore.test.ts`

### Optional new files only if required by implementation
- `src/lib/mockChat.ts` — only if chat reply rules need to move out of UI and Rust keeps a matching contract
- `src-tauri/src/persistence.rs` — only if memo persistence logic becomes too large for `lib.rs`

### Responsibility boundaries
- `App.tsx` composes screens only; it should not own business logic.
- `appStore.ts` is the single source of truth for panel switching.
- `ChatWindow.tsx` handles optimistic UI state and invokes backend chat.
- `MemoPad.tsx` handles memo UI and invokes backend memo commands.
- Rust owns durable memo storage and backend reply generation.

---

## Chunk 1: Lock the MVP shell to documented requirements

### Task 1: Align root shell with the approved three-state flow

**Files:**
- Modify: `src/App.tsx`
- Test: `src/components/__tests__/App.test.tsx`

- [ ] **Step 1: Read `REQUIREMENTS.md` and `src/App.tsx` together before editing**

Confirm the root shell only needs three mutually exclusive states: home, chat, memo.

- [ ] **Step 2: Write or update the failing root flow test**

Cover:
```tsx
it('shows the home screen by default')
it('opens chat from the home CTA')
it('opens memos from the home CTA')
it('returns to home after closing an overlay')
```

- [ ] **Step 3: Run the app test to verify the starting behavior**

Run: `npm test -- App.test.tsx`
Expected: identify at least one failing or missing assertion before implementation changes.

- [ ] **Step 4: Keep `App.tsx` focused on composition**

Ensure:
- home content renders only when both panels are closed
- chat and memo are mutually exclusive
- close handlers return to home state
- no routing layer is introduced

- [ ] **Step 5: Re-run the app test**

Run: `npm test -- App.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/components/__tests__/App.test.tsx

git commit -m "feat: align dora root mvp flow"
```

### Task 2: Keep panel state centralized in the store

**Files:**
- Modify: `src/stores/appStore.ts`
- Test: `src/stores/__tests__/appStore.test.ts`

- [ ] **Step 1: Write the failing store tests**

Cover:
```ts
it('openChat closes memos')
it('openMemo closes chat')
it('resetPanels closes both')
```

- [ ] **Step 2: Run the store test to confirm current behavior**

Run: `npm test -- appStore.test.ts`
Expected: FAIL if behavior drifts or tests are incomplete.

- [ ] **Step 3: Implement the minimal store shape**

Keep only:
```ts
isChatOpen
isMemoOpen
openChat
closeChat
openMemo
closeMemo
resetPanels
```

- [ ] **Step 4: Re-run the store test**

Run: `npm test -- appStore.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/stores/appStore.ts src/stores/__tests__/appStore.test.ts

git commit -m "feat: centralize dora panel state"
```

---

## Chunk 2: Finish the local chat closed loop

### Task 3: Make chat interaction deterministic and test-backed

**Files:**
- Modify: `src/components/ChatWindow.tsx`
- Test: `src/components/__tests__/ChatWindow.test.tsx`
- Verify: `src/types/chat.ts`

- [ ] **Step 1: Write or extend the failing chat test**

Cover:
```tsx
it('shows the welcome message')
it('appends the user message immediately after send')
it('shows loading while waiting for the reply')
it('appends the assistant reply on success')
it('appends the fallback error reply on failure')
```

- [ ] **Step 2: Run the chat test before editing**

Run: `npm test -- ChatWindow.test.tsx`
Expected: at least one case fails or is not yet covered.

- [ ] **Step 3: Keep message typing and send behavior minimal**

Implement only:
- ignore empty input
- append user message before awaiting `invoke`
- show `isLoading` while request is active
- disable send during loading
- append fixed fallback reply on error

- [ ] **Step 4: Keep timestamp type aligned with frontend/backend serialization**

Use string timestamps consistently.

- [ ] **Step 5: Re-run the chat test**

Run: `npm test -- ChatWindow.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/ChatWindow.tsx src/components/__tests__/ChatWindow.test.tsx src/types/chat.ts

git commit -m "feat: complete local chat mvp loop"
```

### Task 4: Keep mock chat reply generation behind the backend command boundary

**Files:**
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Add or update a focused backend test if the Rust module structure allows it**

If unit tests are practical, cover `generate_response` keyword branches and default fallback.

- [ ] **Step 2: Run Rust tests or check command compilation**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: FAIL if new tests expose missing coverage, or PASS if command logic is already stable.

- [ ] **Step 3: Keep `chat` command contract narrow**

`chat(message, history)` should:
- accept current frontend payload shape
- ignore history for now if unused
- always return a single string reply
- preserve the current Dora tone

- [ ] **Step 4: Re-run Rust tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/lib.rs

git commit -m "feat: stabilize mock chat backend"
```

---

## Chunk 3: Complete memo create/list/delete with durable storage

### Task 5: Keep memo UI aligned with the MVP scope

**Files:**
- Modify: `src/components/MemoPad.tsx`
- Test: `src/components/__tests__/MemoPad.test.tsx`
- Verify: `src/types/memo.ts`

- [ ] **Step 1: Write or extend the failing memo test**

Cover:
```tsx
it('loads existing memos')
it('creates a memo from the input')
it('deletes a memo from the list')
it('returns an empty-state view when there are no memos')
```

- [ ] **Step 2: Run the memo test before editing**

Run: `npm test -- MemoPad.test.tsx`
Expected: identify failures or missing assertions.

- [ ] **Step 3: Keep the UI within scope**

Implement only:
- load memos on mount
- add memo with selected color
- delete memo
- empty/loading states

Do not add editing, drag-and-drop, pinning, or layout persistence beyond current fields.

- [ ] **Step 4: Keep memo type aligned with backend serialization**

Use the shared `Memo` type and string timestamps.

- [ ] **Step 5: Re-run the memo test**

Run: `npm test -- MemoPad.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/MemoPad.tsx src/components/__tests__/MemoPad.test.tsx src/types/memo.ts

git commit -m "feat: complete memo panel mvp flow"
```

### Task 6: Make memo data survive app restarts

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Optional Create: `src-tauri/src/persistence.rs`

- [ ] **Step 1: Inspect the current memo storage path before changing code**

The current Rust state is in-memory only, so this task must replace or augment it with file-backed persistence.

- [ ] **Step 2: Add a failing backend test if practical, or document the manual verification case first**

Minimum manual case:
1. save memo
2. relaunch app
3. call `get_memos`
4. expect saved memo returned

- [ ] **Step 3: Implement minimal durable persistence**

Recommended minimal approach:
- store memos as JSON in app data directory managed by Tauri
- load file contents into state at startup
- rewrite the file on save/delete

Keep it simple; do not introduce SQLite in this round.

- [ ] **Step 4: Verify persistence logic**

Run one of:
- `cargo test --manifest-path src-tauri/Cargo.toml`
- or manual verification through the app if filesystem APIs are hard to unit test cleanly

Expected: memo survives restart.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/lib.rs src-tauri/src/persistence.rs

git commit -m "feat: persist dora memos across restarts"
```

---

## Chunk 4: Final verification against requirements

### Task 7: Run the MVP verification sweep

**Files:**
- Verify only; no new files unless a small test fix is required

- [ ] **Step 1: Run frontend tests**

Run: `npm test`
Expected: all Vitest suites PASS.

- [ ] **Step 2: Run frontend build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Run Rust tests**

Run: `cargo test --manifest-path src-tauri/Cargo.toml`
Expected: PASS.

- [ ] **Step 4: Manually verify the acceptance path in the running app**

Check:
- home screen appears first
- open chat from home
- send a message and get a mock reply
- loading state appears
- open memos from home
- create and delete a memo
- restart app and confirm memo still exists
- close overlays and return home

- [ ] **Step 5: Compare results back to `REQUIREMENTS.md`**

Explicitly verify REQ-1 through REQ-12 and AC-1 through AC-12.

- [ ] **Step 6: Commit final fixes if any were needed during verification**

```bash
git add <exact files changed during verification>

git commit -m "test: verify dora mvp local closed loop"
```

---

Plan complete and saved to `docs/plans/2026-03-29-dora-mvp-local-closed-loop.md`. Ready to execute?
