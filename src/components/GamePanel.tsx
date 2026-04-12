import { useState } from "react";
import { TwentyFourGame } from "./games/TwentyFourGame";
import { SudokuGame } from "./games/SudokuGame";
import { MinesweeperGame } from "./games/MinesweeperGame";
import { Leaderboard } from "./games/Leaderboard";
import { isTopScore, type LeaderboardData } from "../lib/leaderboard";

type GameType = keyof LeaderboardData;

interface GamePanelProps {
  onClose: () => void;
}

export function GamePanel({ onClose }: GamePanelProps) {
  const [currentGame, setCurrentGame] = useState<GameType>("24");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [newScore, setNewScore] = useState<{ time: number; difficulty?: string } | null>(null);

  const handleGameComplete = (time: number, difficulty?: string) => {
    // Check if score qualifies for top 20
    if (isTopScore(currentGame, time)) {
      setNewScore({ time, difficulty });
      setShowLeaderboard(true);
    }
  };

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
              className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-normal transition ${
                currentGame === "24"
                  ? "bg-white text-purple-400"
                  : "bg-white/20 text-white/60 hover:bg-white/30 hover:text-white/80"
              }`}
            >
              算24点
            </button>
            <button
              type="button"
              onClick={() => setCurrentGame("sudoku")}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-normal transition ${
                currentGame === "sudoku"
                  ? "bg-white text-purple-400"
                  : "bg-white/20 text-white/60 hover:bg-white/30 hover:text-white/80"
              }`}
            >
              数独
            </button>
            <button
              type="button"
              onClick={() => setCurrentGame("minesweeper")}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-xs font-normal transition ${
                currentGame === "minesweeper"
                  ? "bg-white text-purple-400"
                  : "bg-white/20 text-white/60 hover:bg-white/30 hover:text-white/80"
              }`}
            >
              扫雷
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Leaderboard Button */}
            <button
              type="button"
              onClick={() => setShowLeaderboard(true)}
              className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm text-white backdrop-blur-sm transition-all hover:bg-white/20"
              aria-label="排行榜"
            >
              🏆
            </button>

            <button
              type="button"
              aria-label="Close game panel"
              onClick={onClose}
              className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm text-white backdrop-blur-sm transition-all hover:bg-white/20"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Game Content */}
        <div className="flex-1 overflow-hidden">
          {currentGame === "24" && <TwentyFourGame onComplete={handleGameComplete} />}
          {currentGame === "sudoku" && <SudokuGame onComplete={handleGameComplete} />}
          {currentGame === "minesweeper" && <MinesweeperGame onComplete={handleGameComplete} />}
        </div>

        {/* Leaderboard Modal */}
        {showLeaderboard && (
          <Leaderboard
            gameType={currentGame}
            onClose={() => {
              setShowLeaderboard(false);
              setNewScore(null);
            }}
            newScore={newScore}
          />
        )}
      </div>
    </div>
  );
}
