# Dora MVP Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable Dora MVP on macOS with a floating avatar entry, chat window, mock chat replies, memo panel, and basic window switching.

**Architecture:** Keep the MVP as a thin vertical slice. The React frontend owns UI state and invokes a small set of Tauri commands. The Rust backend provides mock chat behavior and memo storage behind stable command interfaces so real Claude API integration, SQLite persistence, and Live2D replacement can be added later without rewriting the UI flow.

**Tech Stack:** Tauri v2, React, TypeScript, Vite, Tailwind CSS v4, Zustand, Rust

---

## File Structure

### Existing files to modify
- `package.json` — frontend dependencies and scripts
- `index.html` — app title and transparent shell setup
- `src/main.tsx` — global stylesheet entry
- `src/App.tsx` — root app composition and panel switching
- `src-tauri/Cargo.toml` — Rust dependencies
- `src-tauri/src/lib.rs` — Tauri commands and app state
- `src-tauri/tauri.conf.json` — desktop window configuration
- `src-tauri/capabilities/default.json` — Tauri permissions

### Existing files to keep focused
- `src/components/Avatar.tsx` — floating entry / placeholder avatar only
- `src/components/ChatWindow.tsx` — chat panel only
- `src/components/MemoPad.tsx` — memo panel only
- `src/stores/appStore.ts` — app-level UI state only
- `src/styles.css` — global styles and Tailwind import only

### Files to create
- `src/types/chat.ts` — shared frontend chat types
- `src/types/memo.ts` — shared frontend memo types
- `src/lib/mockChat.ts` — optional frontend mock helpers if needed
- `src/components/__tests__/App.test.tsx` — root flow tests
- `src/components/__tests__/ChatWindow.test.tsx` — chat interaction tests
- `src/components/__tests__/MemoPad.test.tsx` — memo panel tests
- `src/stores/__tests__/appStore.test.ts` — state tests
- `vitest.config.ts` — test config if not already present
- `src/test/setup.ts` — test setup

### Responsibility boundaries
- UI state stays in Zustand and local component state, not mixed into Rust.
- Rust owns command contracts and backend-side memo state.
- Chat reply generation remains a separate function in Rust so it can later be swapped for a real provider.
- Avatar stays a placeholder shell; no Live2D SDK work is mixed into panel logic.

---

## Chunk 1: Stabilize project shell and toolchain

### Task 1: Align dependencies and test harness

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Add failing frontend test dependency expectations**

Document the expected toolchain in `package.json`:
- `vitest`
- `@testing-library/react`
- `@testing-library/jest-dom`
- `@testing-library/user-event`
- `jsdom`

- [ ] **Step 2: Install the test dependencies**

Run: `cd /Users/leo/workspace/dora && npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom`
Expected: install succeeds with no blocking errors

- [ ] **Step 3: Add test scripts to package.json**

Add scripts:
```json
{
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 4: Create Vitest config**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
})
```

- [ ] **Step 5: Create test setup file**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 6: Run test command to verify harness boots**

Run: `cd /Users/leo/workspace/dora && npm test`
Expected: command runs, currently fails because test files do not exist yet or passes with zero tests depending on config

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test/setup.ts
git commit -m "chore: add frontend test harness"
```

### Task 2: Clean the shell configuration around MVP requirements

**Files:**
- Modify: `index.html`
- Modify: `src/main.tsx`
- Modify: `src/styles.css`
- Test: `src/components/__tests__/App.test.tsx`

- [ ] **Step 1: Write the failing root render test**

```tsx
import { render, screen } from '@testing-library/react'
import App from '../../App'

test('renders Dora shell', () => {
  render(<App />)
  expect(screen.getByRole('button')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run the single test to verify failure**

Run: `cd /Users/leo/workspace/dora && npm test -- App.test.tsx`
Expected: FAIL if the app shell is not yet test-friendly

- [ ] **Step 3: Normalize the HTML shell**

Ensure:
- app title is Dora
- transparent background styles remain minimal
- no demo starter text remains

- [ ] **Step 4: Ensure main.tsx only mounts App and imports styles**

Keep this file tiny and stable.

- [ ] **Step 5: Keep styles.css focused on Tailwind import and root sizing**

Example:
```css
@import "tailwindcss";

html, body, #root {
  width: 100%;
  height: 100%;
  margin: 0;
}

body {
  background: transparent;
  overflow: hidden;
  font-family: Inter, system-ui, sans-serif;
}
```

- [ ] **Step 6: Re-run the root render test**

Run: `cd /Users/leo/workspace/dora && npm test -- App.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add index.html src/main.tsx src/styles.css src/components/__tests__/App.test.tsx
git commit -m "chore: clean dora app shell"
```

---

## Chunk 2: Lock down app state and root switching

### Task 3: Define shared frontend types

**Files:**
- Create: `src/types/chat.ts`
- Create: `src/types/memo.ts`
- Modify: `src/components/ChatWindow.tsx`
- Modify: `src/components/MemoPad.tsx`

- [ ] **Step 1: Create chat types file**

```ts
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}
```

- [ ] **Step 2: Create memo types file**

```ts
export interface Memo {
  id: string
  content: string
  color: string
  position: { x: number; y: number }
  isPinned: boolean
  createdAt: string
}
```

- [ ] **Step 3: Update components to import shared types**

Remove duplicated type definitions from components.

- [ ] **Step 4: Run tests or typecheck**

Run: `cd /Users/leo/workspace/dora && npm run build`
Expected: PASS or fail only for unrelated unfinished tests

- [ ] **Step 5: Commit**

```bash
git add src/types/chat.ts src/types/memo.ts src/components/ChatWindow.tsx src/components/MemoPad.tsx
git commit -m "refactor: share mvp ui types"
```

### Task 4: Make appStore the single source of truth for panel state

**Files:**
- Modify: `src/stores/appStore.ts`
- Modify: `src/App.tsx`
- Create: `src/stores/__tests__/appStore.test.ts`
- Test: `src/components/__tests__/App.test.tsx`

- [ ] **Step 1: Write failing store tests**

```ts
import { useAppStore } from '../appStore'

test('opens chat and closes memo when chat opens', () => {
  const state = useAppStore.getState()
  state.openChat()
  expect(useAppStore.getState().isChatOpen).toBe(true)
  expect(useAppStore.getState().isMemoOpen).toBe(false)
})
```

Add a complementary memo-opening test.

- [ ] **Step 2: Run store tests to verify failure**

Run: `cd /Users/leo/workspace/dora && npm test -- appStore.test.ts`
Expected: FAIL because actions do not exist yet

- [ ] **Step 3: Implement focused app store actions**

Store shape should look like:
```ts
interface AppState {
  isChatOpen: boolean
  isMemoOpen: boolean
  openChat: () => void
  closeChat: () => void
  openMemo: () => void
  closeMemo: () => void
  resetPanels: () => void
}
```

- [ ] **Step 4: Update App.tsx to use store actions instead of local booleans**

App should compose panels only; panel logic should not be duplicated.

- [ ] **Step 5: Add/update root app test**

Cover:
- initial avatar visible
- chat opens on click callback path
- memo opens on memo callback path

- [ ] **Step 6: Run tests**

Run: `cd /Users/leo/workspace/dora && npm test -- appStore.test.ts App.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/stores/appStore.ts src/stores/__tests__/appStore.test.ts src/App.tsx src/components/__tests__/App.test.tsx
git commit -m "feat: centralize mvp panel state"
```

---

## Chunk 3: Finish placeholder avatar flow

### Task 5: Tighten Avatar behavior to MVP-only responsibilities

**Files:**
- Modify: `src/components/Avatar.tsx`
- Test: `src/components/__tests__/App.test.tsx`

- [ ] **Step 1: Write/update failing avatar interaction test through App**

Test expectations:
- avatar renders as main entry button
- memo shortcut is hidden until hover if hover behavior remains
- clicking avatar opens chat

- [ ] **Step 2: Run test to verify failure**

Run: `cd /Users/leo/workspace/dora && npm test -- App.test.tsx`
Expected: FAIL until selectors and behavior stabilize

- [ ] **Step 3: Simplify Avatar to placeholder-only concerns**

Keep:
- main clickable avatar button
- optional memo shortcut
- lightweight idle animation

Do not add:
- settings
- tray logic
- Live2D SDK code

- [ ] **Step 4: Add accessible labels**

Examples:
- avatar button: `aria-label="Open Dora chat"`
- memo button: `aria-label="Open Dora memos"`

- [ ] **Step 5: Re-run the app interaction test**

Run: `cd /Users/leo/workspace/dora && npm test -- App.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/Avatar.tsx src/components/__tests__/App.test.tsx
git commit -m "feat: stabilize dora avatar entry"
```

---

## Chunk 4: Complete mock chat loop

### Task 6: Make ChatWindow testable and aligned with command contract

**Files:**
- Modify: `src/components/ChatWindow.tsx`
- Create: `src/components/__tests__/ChatWindow.test.tsx`
- Modify: `src/types/chat.ts`

- [ ] **Step 1: Write the failing ChatWindow test**

Cover:
- initial welcome message is shown
- typing then sending adds a user message
- successful invoke call appends assistant reply

Example skeleton:
```tsx
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue('mock reply'),
}))
```

- [ ] **Step 2: Run test to verify failure**

Run: `cd /Users/leo/workspace/dora && npm test -- ChatWindow.test.tsx`
Expected: FAIL because component is not yet fully test-stable

- [ ] **Step 3: Normalize message timestamps to string type**

Use ISO string in shared types to avoid Date serialization mismatches with Rust.

- [ ] **Step 4: Ensure send flow is minimal and deterministic**

Requirements:
- ignore empty input
- disable send while loading
- append user message before invoke
- append fallback assistant message on error

- [ ] **Step 5: Add accessible textarea/button labels if missing**

- [ ] **Step 6: Re-run ChatWindow tests**

Run: `cd /Users/leo/workspace/dora && npm test -- ChatWindow.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/ChatWindow.tsx src/components/__tests__/ChatWindow.test.tsx src/types/chat.ts
git commit -m "feat: complete mock chat flow"
```

### Task 7: Implement stable Rust mock chat command

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Test: backend compile check only for this MVP

- [ ] **Step 1: Add/adjust a focused failing expectation mentally from spec**

The `chat` command must:
- accept `message` and `history`
- return a string reply
- never crash on simple input

- [ ] **Step 2: Refine the Rust chat types to match frontend serialization**

Use snake_case / serde renames only if needed. Keep contracts simple.

- [ ] **Step 3: Keep `generate_response` as a separate pure function**

It should stay isolated from Tauri state so it can later be replaced by a real provider.

- [ ] **Step 4: Ensure fallback reply behavior is deterministic**

No randomness that makes tests flaky.

- [ ] **Step 5: Run Rust compile check**

Run: `cd /Users/leo/workspace/dora/src-tauri && . "$HOME/.cargo/env" && cargo check`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src-tauri/src/lib.rs
git commit -m "feat: add mvp mock chat backend"
```

---

## Chunk 5: Complete memo flow

### Task 8: Make MemoPad pass the MVP acceptance criteria

**Files:**
- Modify: `src/components/MemoPad.tsx`
- Create: `src/components/__tests__/MemoPad.test.tsx`
- Modify: `src/types/memo.ts`

- [ ] **Step 1: Write failing memo panel tests**

Cover:
- existing memos load on mount
- user can type and add a memo
- user can delete a memo
- fallback path still updates UI if invoke rejects

- [ ] **Step 2: Run memo tests to verify failure**

Run: `cd /Users/leo/workspace/dora && npm test -- MemoPad.test.tsx`
Expected: FAIL

- [ ] **Step 3: Keep MemoPad focused on add/delete/list only**

Do not add drag-and-drop, pinning workflows, or edit-in-place for MVP.

- [ ] **Step 4: Normalize create/delete flow**

Requirements:
- empty memo cannot be added
- create clears input
- delete removes memo immediately from UI
- loading/empty states are visible

- [ ] **Step 5: Add accessible labels and predictable text selectors**

- [ ] **Step 6: Re-run memo tests**

Run: `cd /Users/leo/workspace/dora && npm test -- MemoPad.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/components/MemoPad.tsx src/components/__tests__/MemoPad.test.tsx src/types/memo.ts
git commit -m "feat: add mvp memo panel"
```

### Task 9: Implement memo commands in Rust and keep storage swappable

**Files:**
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Verify the backend memo contract from the spec**

Commands required:
- `get_memos`
- `save_memo`
- `delete_memo`

- [ ] **Step 2: Keep memo storage in app state for MVP**

Use in-memory `Mutex<Vec<Memo>>` only. Do not add SQLite yet.

- [ ] **Step 3: Ensure serde field names match frontend payloads**

If frontend sends `createdAt` and `isPinned`, add serde rename attributes or switch the frontend payload consistently.

- [ ] **Step 4: Remove unused backend code not required for MVP**

If config/update commands are unused and create confusion, delete them rather than carrying extra surface area.

- [ ] **Step 5: Run Rust compile check**

Run: `cd /Users/leo/workspace/dora/src-tauri && . "$HOME/.cargo/env" && cargo check`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src-tauri/src/lib.rs
git commit -m "feat: add mvp memo backend"
```

---

## Chunk 6: Finish Tauri desktop configuration for MVP

### Task 10: Reduce Tauri config to exactly what MVP needs

**Files:**
- Modify: `src-tauri/tauri.conf.json`
- Modify: `src-tauri/capabilities/default.json`
- Modify: `src-tauri/Cargo.toml`

- [ ] **Step 1: Review current config against spec boundaries**

Keep only what MVP needs:
- transparent undecorated window
- always-on-top if desired for floating feel
- permissions for used window operations

- [ ] **Step 2: Remove speculative dependencies/plugins not used by MVP**

Examples to reconsider:
- SQL plugin if not used yet
- positioner/tray features if not exercised by current acceptance criteria
- reqwest if chat is still mock-only

- [ ] **Step 3: Make Cargo.toml match real runtime usage**

Every dependency should be justified by compiled code.

- [ ] **Step 4: Make capabilities match only invoked APIs**

Avoid over-permissioning.

- [ ] **Step 5: Run Rust compile check**

Run: `cd /Users/leo/workspace/dora/src-tauri && . "$HOME/.cargo/env" && cargo check`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src-tauri/tauri.conf.json src-tauri/capabilities/default.json src-tauri/Cargo.toml
git commit -m "chore: trim tauri config to mvp scope"
```

---

## Chunk 7: Verify end-to-end MVP behavior

### Task 11: Run full frontend and backend verification

**Files:**
- Test only

- [ ] **Step 1: Run frontend test suite**

Run: `cd /Users/leo/workspace/dora && npm test`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `cd /Users/leo/workspace/dora && npm run build`
Expected: PASS

- [ ] **Step 3: Run Rust compile check**

Run: `cd /Users/leo/workspace/dora/src-tauri && . "$HOME/.cargo/env" && cargo check`
Expected: PASS

- [ ] **Step 4: Run Tauri dev app manually**

Run: `cd /Users/leo/workspace/dora && . "$HOME/.cargo/env" && npm run tauri dev`
Expected:
- Dora window launches
- avatar visible
- clicking avatar opens chat
- sending a message returns mock reply
- memo panel opens and supports add/delete

- [ ] **Step 5: Execute manual acceptance checklist**

Validate AC-1 through AC-8 from `docs/specs/2026-03-28-dora-mvp-spec.md`.

- [ ] **Step 6: Commit final MVP stabilization changes**

```bash
git add .
git commit -m "feat: complete dora mvp vertical slice"
```

---

## Notes for implementation

- Prefer deleting speculative code over preserving future-looking scaffolding.
- Keep mock chat and placeholder avatar intentionally simple.
- Do not implement real Claude API, SQLite persistence, Live2D SDK, tray polish, or shortcut polish in this plan.
- If any new requirement appears during implementation, update `docs/specs/2026-03-28-dora-mvp-spec.md` first before changing code.
