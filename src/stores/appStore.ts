import { create } from "zustand";

interface AppState {
  isChatOpen: boolean;
  isMemoOpen: boolean;
  isMemoryOpen: boolean;
  isSettingsOpen: boolean;
  isGameOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  openMemo: () => void;
  closeMemo: () => void;
  openMemory: () => void;
  closeMemory: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openGame: () => void;
  closeGame: () => void;
  resetPanels: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isChatOpen: false,
  isMemoOpen: false,
  isMemoryOpen: false,
  isSettingsOpen: false,
  isGameOpen: false,
  openChat: () =>
    set({ isChatOpen: true, isMemoOpen: false, isMemoryOpen: false, isSettingsOpen: false, isGameOpen: false }),
  closeChat: () => set({ isChatOpen: false }),
  openMemo: () =>
    set({ isMemoOpen: true, isChatOpen: false, isMemoryOpen: false, isSettingsOpen: false, isGameOpen: false }),
  closeMemo: () => set({ isMemoOpen: false }),
  openMemory: () =>
    set({ isMemoryOpen: true, isChatOpen: false, isMemoOpen: false, isSettingsOpen: false, isGameOpen: false }),
  closeMemory: () => set({ isMemoryOpen: false }),
  openSettings: () =>
    set({ isSettingsOpen: true, isChatOpen: false, isMemoOpen: false, isMemoryOpen: false, isGameOpen: false }),
  closeSettings: () => set({ isSettingsOpen: false }),
  openGame: () =>
    set({ isGameOpen: true, isChatOpen: false, isMemoOpen: false, isMemoryOpen: false, isSettingsOpen: false }),
  closeGame: () => set({ isGameOpen: false }),
  resetPanels: () =>
    set({ isChatOpen: false, isMemoOpen: false, isMemoryOpen: false, isSettingsOpen: false, isGameOpen: false }),
}));
