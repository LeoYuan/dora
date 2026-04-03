import { TwentyFourGame } from "./games/TwentyFourGame";

interface GamePanelProps {
  onClose: () => void;
}

export function GamePanel({ onClose }: GamePanelProps) {
  return (
    <div className="absolute inset-0 z-40 flex items-stretch justify-center bg-slate-900/10">
      <div className="flex h-full w-full max-w-xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex min-h-[72px] items-center justify-between bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
              <span className="text-2xl">🎮</span>
            </div>
            <div>
              <h2 className="font-semibold text-white">游戏</h2>
              <p className="text-xs text-white/70">放松一下</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close game panel"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/14 text-sm text-white backdrop-blur-sm transition-all hover:bg-white/24"
          >
            ✕
          </button>
        </div>

        {/* Game Content */}
        <div className="flex-1 overflow-hidden">
          <TwentyFourGame />
        </div>
      </div>
    </div>
  );
}
