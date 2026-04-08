import { useState } from "react";
import { TwentyFourGame } from "./games/TwentyFourGame";
import { SudokuGame } from "./games/SudokuGame";
import { MinesweeperGame } from "./games/MinesweeperGame";

type GameType = "24" | "sudoku" | "minesweeper";

interface GamePanelProps {
  onClose: () => void;
}

export function GamePanel({ onClose }: GamePanelProps) {
  const [currentGame, setCurrentGame] = useState<GameType>("24");

  return (
    <div className="absolute inset-0 z-40 flex items-stretch justify-center bg-slate-900/10">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex min-h-[56px] items-center justify-between bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white">
              <span className="text-lg">🎮</span>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">游戏</h2>
              <p className="text-[10px] text-white/70">放松一下</p>
            </div>
          </div>

          {/* Game Selector */}
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setCurrentGame("24")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                currentGame === "24"
                  ? "bg-white text-purple-600"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              算24点
            </button>
            <button
              type="button"
              onClick={() => setCurrentGame("sudoku")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                currentGame === "sudoku"
                  ? "bg-white text-purple-600"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              数独
            </button>
            <button
              type="button"
              onClick={() => setCurrentGame("minesweeper")}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
                currentGame === "minesweeper"
                  ? "bg-white text-purple-600"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              扫雷
            </button>
          </div>

          <button
            type="button"
            aria-label="Close game panel"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/14 text-sm text-white backdrop-blur-sm transition-all hover:bg-white/24"
          >
            ✕
          </button>
        </div>

        {/* Game Content */}
        <div className="flex-1 overflow-hidden">
          {currentGame === "24" && <TwentyFourGame />}
          {currentGame === "sudoku" && <SudokuGame />}
          {currentGame === "minesweeper" && <MinesweeperGame />}
        </div>
      </div>
    </div>
  );
}
