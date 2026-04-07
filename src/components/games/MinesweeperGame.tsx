import { useState, useCallback, useEffect } from "react";

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

interface GameState {
  board: Cell[][];
  gameStatus: "playing" | "won" | "lost";
  mineCount: number;
  flagCount: number;
  startTime: number;
  elapsedTime: number;
  difficulty: "easy" | "medium" | "hard";
}

const DIFFICULTY_CONFIG = {
  easy: { rows: 9, cols: 9, mines: 10, name: "简单" },
  medium: { rows: 16, cols: 16, mines: 40, name: "中等" },
  hard: { rows: 16, cols: 30, mines: 99, name: "困难" },
};

function createBoard(rows: number, cols: number, mines: number, firstClickRow?: number, firstClickCol?: number): Cell[][] {
  const board: Cell[][] = Array(rows)
    .fill(null)
    .map(() =>
      Array(cols)
        .fill(null)
        .map(() => ({
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        }))
    );

  // Place mines (avoiding first click position)
  let minesPlaced = 0;
  while (minesPlaced < mines) {
    const row = Math.floor(Math.random() * rows);
    const col = Math.floor(Math.random() * cols);
    if (!board[row][col].isMine && !(row === firstClickRow && col === firstClickCol)) {
      board[row][col].isMine = true;
      minesPlaced++;
    }
  }

  // Calculate neighbor mines
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!board[row][col].isMine) {
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = row + dr;
            const nc = col + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) {
              count++;
            }
          }
        }
        board[row][col].neighborMines = count;
      }
    }
  }

  return board;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function MinesweeperGame() {
  const [game, setGame] = useState<GameState>(() => {
    const config = DIFFICULTY_CONFIG.easy;
    return {
      board: createBoard(config.rows, config.cols, config.mines),
      gameStatus: "playing",
      mineCount: config.mines,
      flagCount: 0,
      startTime: Date.now(),
      elapsedTime: 0,
      difficulty: "easy",
    };
  });

  useEffect(() => {
    if (game.gameStatus !== "playing") return;
    const timer = setInterval(() => {
      setGame((prev) => ({
        ...prev,
        elapsedTime: Math.floor((Date.now() - prev.startTime) / 1000),
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [game.gameStatus, game.startTime]);

  const newGame = useCallback((difficulty: "easy" | "medium" | "hard") => {
    const config = DIFFICULTY_CONFIG[difficulty];
    setGame({
      board: createBoard(config.rows, config.cols, config.mines),
      gameStatus: "playing",
      mineCount: config.mines,
      flagCount: 0,
      startTime: Date.now(),
      elapsedTime: 0,
      difficulty,
    });
  }, []);

  const revealCell = useCallback(
    (row: number, col: number) => {
      if (game.gameStatus !== "playing") return;

      setGame((prev) => {
        const config = DIFFICULTY_CONFIG[prev.difficulty];
        let newBoard = prev.board.map((r) => r.map((c) => ({ ...c })));

        // First click - regenerate board if it's a mine
        if (prev.elapsedTime === 0 && !newBoard[row][col].isRevealed) {
          let attempts = 0;
          while (newBoard[row][col].isMine && attempts < 100) {
            newBoard = createBoard(config.rows, config.cols, config.mines, row, col);
            attempts++;
          }
        }

        if (newBoard[row][col].isRevealed || newBoard[row][col].isFlagged) {
          return prev;
        }

        // Reveal this cell
        const revealRecursive = (r: number, c: number) => {
          if (r < 0 || r >= config.rows || c < 0 || c >= config.cols) return;
          if (newBoard[r][c].isRevealed || newBoard[r][c].isFlagged) return;

          newBoard[r][c].isRevealed = true;

          if (newBoard[r][c].neighborMines === 0 && !newBoard[r][c].isMine) {
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                revealRecursive(r + dr, c + dc);
              }
            }
          }
        };

        if (newBoard[row][col].isMine) {
          // Game over - reveal all mines
          newBoard.forEach((r) =>
            r.forEach((c) => {
              if (c.isMine) c.isRevealed = true;
            })
          );
          return { ...prev, board: newBoard, gameStatus: "lost" };
        }

        revealRecursive(row, col);

        // Check win condition
        const revealedCount = newBoard.flat().filter((c) => c.isRevealed).length;
        const totalCells = config.rows * config.cols;
        if (revealedCount === totalCells - config.mines) {
          return { ...prev, board: newBoard, gameStatus: "won" };
        }

        return { ...prev, board: newBoard };
      });
    },
    [game.gameStatus, game.elapsedTime]
  );

  const toggleFlag = useCallback(
    (e: React.MouseEvent, row: number, col: number) => {
      e.preventDefault();
      if (game.gameStatus !== "playing") return;

      setGame((prev) => {
        const newBoard = prev.board.map((r) => r.map((c) => ({ ...c })));
        if (newBoard[row][col].isRevealed) return prev;

        if (newBoard[row][col].isFlagged) {
          newBoard[row][col].isFlagged = false;
          return { ...prev, board: newBoard, flagCount: prev.flagCount - 1 };
        } else {
          newBoard[row][col].isFlagged = true;
          return { ...prev, board: newBoard, flagCount: prev.flagCount + 1 };
        }
      });
    },
    [game.gameStatus]
  );

  const config = DIFFICULTY_CONFIG[game.difficulty];

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-medium text-slate-500">扫雷</h2>
          <p className="text-sm text-slate-500">
            时间: {formatTime(game.elapsedTime)} | 剩余: {game.mineCount - game.flagCount} 🚩
          </p>
        </div>
        <div className="flex gap-2">
          {(["easy", "medium", "hard"] as const).map((diff) => (
            <button
              key={diff}
              type="button"
              onClick={() => newGame(diff)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                game.difficulty === diff
                  ? "bg-sky-500 text-white"
                  : "border border-slate-200 bg-white text-slate-400 hover:bg-slate-50"
              }`}
            >
              {DIFFICULTY_CONFIG[diff].name}
            </button>
          ))}
        </div>
      </div>

      {/* Game Area */}
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="relative">
          {/* Status Overlay */}
          {game.gameStatus !== "playing" && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90">
              <div className="text-center">
                <div className="mb-2 text-4xl">{game.gameStatus === "won" ? "🎉" : "💥"}</div>
                <div className={`text-xl font-bold ${game.gameStatus === "won" ? "text-green-600" : "text-red-600"}`}>
                  {game.gameStatus === "won" ? "胜利!" : "游戏结束"}
                </div>
                <div className="text-sm text-slate-500">用时: {formatTime(game.elapsedTime)}</div>
                <button
                  type="button"
                  onClick={() => newGame(game.difficulty)}
                  className="mt-4 rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
                >
                  再玩一次
                </button>
              </div>
            </div>
          )}

          {/* Board */}
          <div
            className="grid gap-0.5 rounded-lg border-2 border-slate-400 bg-slate-400 p-0.5"
            style={{
              gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
            }}
          >
            {game.board.map((row, rowIndex) =>
              row.map((cell, colIndex) => (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  type="button"
                  onClick={() => revealCell(rowIndex, colIndex)}
                  onContextMenu={(e) => toggleFlag(e, rowIndex, colIndex)}
                  className={`
                    flex h-7 w-7 items-center justify-center text-sm font-medium
                    ${cell.isRevealed
                      ? cell.isMine
                        ? "bg-red-500 text-white"
                        : "bg-slate-200 text-slate-600"
                      : "bg-slate-300 hover:bg-slate-250"
                    }
                    ${!cell.isRevealed && cell.isFlagged ? "text-red-500" : ""}
                    ${cell.isRevealed && cell.neighborMines > 0 && !cell.isMine
                      ? cell.neighborMines === 1
                        ? "text-blue-600"
                        : cell.neighborMines === 2
                        ? "text-green-600"
                        : cell.neighborMines === 3
                        ? "text-red-600"
                        : cell.neighborMines === 4
                        ? "text-purple-600"
                        : "text-slate-600"
                      : ""
                    }
                  `}
                >
                  {cell.isFlagged && !cell.isRevealed
                    ? "🚩"
                    : cell.isRevealed && cell.isMine
                    ? "💣"
                    : cell.isRevealed && cell.neighborMines > 0
                    ? cell.neighborMines
                    : ""}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-400">
        <p>规则：点击格子翻开，右键标记地雷，找出所有安全格子</p>
        <p className="mt-1 text-xs text-slate-400">左键点击翻开，右键点击插旗</p>
      </div>
    </div>
  );
}
