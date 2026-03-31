import { create } from "zustand";

interface AppState {
  isChatOpen: boolean;
  isMemoOpen: boolean;
  isMemoryOpen: boolean;
  isSettingsOpen: boolean;
  openChat: () => void;
  closeChat: () => void;
  openMemo: () => void;
  closeMemo: () => void;
  openMemory: () => void;
  closeMemory: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  resetPanels: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  isChatOpen: false,
  isMemoOpen: false,
  isMemoryOpen: false,
  isSettingsOpen: false,
  openChat: () =>
    set({ isChatOpen: true, isMemoOpen: false, isMemoryOpen: false, isSettingsOpen: false }),
  closeChat: () => set({ isChatOpen: false }),
  openMemo: () =>
    set({ isMemoOpen: true, isChatOpen: false, isMemoryOpen: false, isSettingsOpen: false }),
  closeMemo: () => set({ isMemoOpen: false }),
  openMemory: () =>
    set({ isMemoryOpen: true, isChatOpen: false, isMemoOpen: false, isSettingsOpen: false }),
  closeMemory: () => set({ isMemoryOpen: false }),
  openSettings: () =>
    set({ isSettingsOpen: true, isChatOpen: false, isMemoOpen: false, isMemoryOpen: false }),
  closeSettings: () => set({ isSettingsOpen: false }),
  resetPanels: () =>
    set({ isChatOpen: false, isMemoOpen: false, isMemoryOpen: false, isSettingsOpen: false }),
}));
