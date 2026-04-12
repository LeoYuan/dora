import { useState } from "react";
import {
  getLeaderboard,
  saveScore,
  formatTime,
  formatDate,
  type LeaderboardData,
} from "../../lib/leaderboard";

type GameType = keyof LeaderboardData;

interface LeaderboardProps {
  gameType: GameType;
  onClose: () => void;
  newScore?: {
    time: number;
    difficulty?: string;
  } | null;
}

const GAME_NAMES: Record<GameType, string> = {
  "24": "算24点",
  sudoku: "数独",
  minesweeper: "扫雷",
};

export function Leaderboard({ gameType, onClose, newScore }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardData>(getLeaderboard());
  const [playerName, setPlayerName] = useState("");
  const [activeTab, setActiveTab] = useState<GameType>(gameType);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const scores = leaderboard[activeTab];
  const isNewScoreTop20 = newScore &&
    !hasSubmitted &&
    activeTab === gameType &&
    (scores.length < 20 || newScore.time < scores[scores.length - 1].time);

  const handleSubmit = () => {
    if (!playerName.trim() || !newScore) return;

    saveScore(gameType, {
      playerName: playerName.trim(),
      time: newScore.time,
      difficulty: newScore.difficulty,
    });

    setLeaderboard(getLeaderboard());
    setHasSubmitted(true);
    setPlayerName("");
  };

  return (
    <div className="absolute inset-0 z-50 flex items-stretch justify-center bg-slate-900/50">
      <div className="flex h-full w-full max-w-md flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex min-h-[64px] items-center justify-between bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <span className="text-lg">🏆</span>
            </div>
            <div>
              <h2 className="font-semibold text-white">排行榜</h2>
              <p className="text-xs text-white/70">前20名</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm text-white backdrop-blur-sm transition-all hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        {/* Game Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-100 px-6 pt-3">
          {(Object.keys(GAME_NAMES) as GameType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveTab(type)}
              className={`cursor-pointer relative px-4 py-2 text-[13px] font-normal transition ${
                activeTab === type
                  ? "text-amber-500"
                  : "text-slate-300 hover:text-slate-400"
              }`}
            >
              {GAME_NAMES[type]}
              {activeTab === type && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-amber-500" />
              )}
            </button>
          ))}
        </div>

        {/* New Score Input */}
        {isNewScoreTop20 && (
          <div className="border-b border-amber-100 bg-amber-50 px-6 py-4">
            <p className="mb-2 text-sm font-medium text-amber-600">
              🎉 恭喜！你的成绩进入了前20名！
            </p>
            <div className="flex items-center gap-2 text-xs text-amber-500 mb-3">
              <span>用时: {formatTime(newScore.time)}</span>
              {newScore.difficulty && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5">
                  {newScore.difficulty}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSubmit();
                }}
                placeholder="输入你的昵称..."
                maxLength={12}
                className="flex-1 rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!playerName.trim()}
                className="cursor-pointer rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-600 disabled:bg-slate-300"
              >
                提交
              </button>
            </div>
          </div>
        )}

        {/* Score List */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4">
          {scores.length > 0 ? (
            <div className="space-y-2">
              {scores.map((score, index) => (
                <div
                  key={`${score.playerName}-${score.date}`}
                  className={`flex items-center gap-3 rounded-xl border bg-white px-4 py-3 shadow-sm ${
                    index < 3
                      ? "border-amber-200"
                      : "border-slate-200"
                  }`}
                >
                  {/* Rank */}
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                      index === 0
                        ? "bg-yellow-400 text-white"
                        : index === 1
                        ? "bg-slate-300 text-white"
                        : index === 2
                        ? "bg-orange-400 text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {index + 1}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-slate-600">
                        {score.playerName}
                      </span>
                      {score.difficulty && (
                        <span className="shrink-0 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">
                          {score.difficulty}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {formatDate(score.date)}
                    </div>
                  </div>

                  {/* Time */}
                  <div className="text-right">
                    <div className="font-mono text-base font-medium text-slate-600">
                      {formatTime(score.time)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
              <span className="mb-2 text-3xl opacity-50">📊</span>
              <p className="text-sm text-slate-400">暂无记录</p>
              <p className="mt-1 text-xs text-slate-300">
                快来挑战，创造你的最佳成绩！
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
