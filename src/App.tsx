import { Avatar } from "./components/Avatar";
import { ChatWindow } from "./components/ChatWindow";
import { MemoPad } from "./components/MemoPad";
import { MemoryPanel } from "./components/MemoryPanel";
import { SettingsPanel } from "./components/SettingsPanel";
import { useAppStore } from "./stores/appStore";

function MainApp() {
  const {
    isChatOpen,
    isMemoOpen,
    isMemoryOpen,
    isSettingsOpen,
    openChat,
    openMemo,
    openMemory,
    openSettings,
    closeChat,
    closeMemo,
    closeMemory,
    closeSettings,
  } = useAppStore();

  return (
    <div className="flex min-h-screen w-full flex-col overflow-hidden bg-slate-100 text-slate-900">
      <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-b from-sky-50 to-slate-100 px-6 py-8">
        {!isChatOpen && !isMemoOpen && !isMemoryOpen && !isSettingsOpen && (
          <section className="flex w-full max-w-2xl flex-col items-center justify-center text-center">
            <div className="w-full rounded-[32px] border border-white/70 bg-white/80 px-10 py-12 shadow-[0_24px_70px_rgba(15,23,42,0.10)] ring-1 ring-white/60 backdrop-blur-sm">
              <div className="flex justify-center">
                <Avatar onClick={openChat} />
              </div>

              <div className="mt-4 space-y-3">
                <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-[11px] font-medium text-sky-600 shadow-sm">
                  桌面陪伴助手
                </span>
                <div>
                  <h1 className="text-xl font-semibold tracking-tight text-slate-800">Dora</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    你的桌面小伙伴，陪你聊天、整理和记住重要内容。
                  </p>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={openChat}
                  className="rounded-2xl bg-sky-500 px-6 py-3 text-sm font-medium text-white shadow-md shadow-sky-200/70 transition hover:bg-sky-600 sm:col-span-1"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span aria-hidden="true">💬</span>
                    <span>开始聊天</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={openMemo}
                  className="rounded-2xl border border-slate-200/80 bg-white/70 px-6 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-white"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span aria-hidden="true">📝</span>
                    <span>便签</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={openMemory}
                  className="rounded-2xl border border-slate-200/80 bg-white/70 px-6 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-white"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span aria-hidden="true">🧠</span>
                    <span>记忆</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={openSettings}
                  className="rounded-2xl border border-slate-200/80 bg-white/70 px-6 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-white"
                >
                  <span className="flex items-center justify-center gap-2">
                    <span aria-hidden="true">⚙️</span>
                    <span>设置</span>
                  </span>
                </button>
              </div>
            </div>
          </section>
        )}

        {isChatOpen && <ChatWindow onClose={closeChat} />}
        {isMemoOpen && <MemoPad onClose={closeMemo} />}
        {isMemoryOpen && <MemoryPanel onClose={closeMemory} />}
        {isSettingsOpen && <SettingsPanel onClose={closeSettings} />}
      </main>
    </div>
  );
}

export default function App() {
  return <MainApp />;
}
