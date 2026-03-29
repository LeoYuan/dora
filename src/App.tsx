import { Avatar } from "./components/Avatar";
import { ChatWindow } from "./components/ChatWindow";
import { MemoPad } from "./components/MemoPad";
import { SettingsPanel } from "./components/SettingsPanel";
import { WindowHeader } from "./components/WindowHeader";
import { useAppStore } from "./stores/appStore";

function App() {
  const {
    isChatOpen,
    isMemoOpen,
    isSettingsOpen,
    openChat,
    openMemo,
    openSettings,
    closeChat,
    closeMemo,
    closeSettings,
  } = useAppStore();

  return (
    <div className="flex min-h-screen w-full flex-col overflow-hidden bg-slate-100 text-slate-900">
      <WindowHeader />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-b from-sky-50 to-slate-100 px-6 py-8">
        {!isChatOpen && !isMemoOpen && !isSettingsOpen && (
          <section className="flex w-full max-w-2xl flex-col items-center justify-center text-center">
            <div className="w-full rounded-3xl border border-white bg-white px-10 py-12 shadow-2xl">
              <div className="flex justify-center">
                <Avatar onClick={openChat} onMemoClick={openMemo} />
              </div>

              <div className="mt-8 space-y-3">
                <p className="text-xs font-medium uppercase tracking-widest text-sky-600">
                  Dora 已准备好
                </p>
                <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
                  今天想聊什么？
                </h1>
                <p className="mx-auto max-w-md text-sm leading-6 text-slate-500">
                  从这里开始聊天、快速记便签，或者先调整 Dora 的陪伴方式。
                </p>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={openChat}
                  className="rounded-2xl bg-sky-500 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-sky-600"
                >
                  开始聊天
                </button>
                <button
                  type="button"
                  onClick={openMemo}
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  便签
                </button>
                <button
                  type="button"
                  onClick={openSettings}
                  className="rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  设置
                </button>
              </div>
            </div>
          </section>
        )}

        {isChatOpen && <ChatWindow onClose={closeChat} />}
        {isMemoOpen && <MemoPad onClose={closeMemo} />}
        {isSettingsOpen && <SettingsPanel onClose={closeSettings} />}
      </main>
    </div>
  );
}

export default App;
