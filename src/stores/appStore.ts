import { create } from "zustand";

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

export const useAppStore = create<AppState>((set) => ({
  isChatOpen: false,
  isMemoOpen: false,
  isSettingsOpen: false,
  openChat: () =>
    set({ isChatOpen: true, isMemoOpen: false, isSettingsOpen: false }),
  closeChat: () => set({ isChatOpen: false }),
  openMemo: () =>
    set({ isMemoOpen: true, isChatOpen: false, isSettingsOpen: false }),
  closeMemo: () => set({ isMemoOpen: false }),
  openSettings: () =>
    set({ isSettingsOpen: true, isChatOpen: false, isMemoOpen: false }),
  closeSettings: () => set({ isSettingsOpen: false }),
  resetPanels: () =>
    set({ isChatOpen: false, isMemoOpen: false, isSettingsOpen: false }),
}));
