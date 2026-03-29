import { useAppStore } from "../appStore";

describe("appStore", () => {
  beforeEach(() => {
    useAppStore.getState().resetPanels();
  });

  it("opens chat and closes memo when chat opens", () => {
    useAppStore.getState().openMemo();
    useAppStore.getState().openChat();

    expect(useAppStore.getState().isChatOpen).toBe(true);
    expect(useAppStore.getState().isMemoOpen).toBe(false);
  });

  it("opens memo and closes chat when memo opens", () => {
    useAppStore.getState().openChat();
    useAppStore.getState().openMemo();

    expect(useAppStore.getState().isMemoOpen).toBe(true);
    expect(useAppStore.getState().isChatOpen).toBe(false);
  });

  it("openSettings closes chat and memos", () => {
    useAppStore.getState().openChat();
    useAppStore.getState().openSettings();

    expect(useAppStore.getState().isSettingsOpen).toBe(true);
    expect(useAppStore.getState().isChatOpen).toBe(false);
    expect(useAppStore.getState().isMemoOpen).toBe(false);
  });

  it("closeSettings hides the settings panel", () => {
    useAppStore.getState().openSettings();
    useAppStore.getState().closeSettings();

    expect(useAppStore.getState().isSettingsOpen).toBe(false);
  });

  it("resets all panels", () => {
    useAppStore.getState().openSettings();
    useAppStore.getState().resetPanels();

    expect(useAppStore.getState().isChatOpen).toBe(false);
    expect(useAppStore.getState().isMemoOpen).toBe(false);
    expect(useAppStore.getState().isSettingsOpen).toBe(false);
  });
});
