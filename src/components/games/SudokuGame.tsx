import { useState, useCallback, useEffect } from "react";

interface Cell {
  value: number;
  isFixed: boolean;
  isValid: boolean;
  notes: number[];
}

interface GameState {
  board: Cell[][];
  selectedCell: { row: number; col: number } | null;
  difficulty: "easy" | "medium" | "hard";
  isComplete: boolean;
  isStarted: boolean;
  startTime: number;
  elapsedTime: number;
}

interface DifficultyConfig {
  size: 6 | 9;
  emptyCells: number;
  name: string;
  boxRows: number;
  boxCols: number;
}

const DIFFICULTY_LEVELS: Record<string, DifficultyConfig> = {
  easy: { size: 6, emptyCells: 18, name: "简单", boxRows: 2, boxCols: 3 },
  medium: { size: 9, emptyCells: 45, name: "中等", boxRows: 3, boxCols: 3 },
  hard: { size: 9, emptyCells: 55, name: "困难", boxRows: 3, boxCols: 3 },
};

function isValidPlacement(
  board: Cell[][],
  row: number,
  col: number,
  num: number,
  boxRows: number,
  boxCols: number
): boolean {
  const size = board.length;

  // Check row
  for (let c = 0; c < size; c++) {
    if (c !== col && board[row][c].value === num) return false;
  }

  // Check column
  for (let r = 0; r < size; r++) {
    if (r !== row && board[r][col].value === num) return false;
  }

  // Check box
  const boxRow = Math.floor(row / boxRows) * boxRows;
  const boxCol = Math.floor(col / boxCols) * boxCols;
  for (let r = boxRow; r < boxRow + boxRows; r++) {
    for (let c = boxCol; c < boxCol + boxCols; c++) {
      if ((r !== row || c !== col) && board[r][c].value === num) return false;
    }
  }

  return true;
}

function solveSudoku(board: number[][], boxRows: number, boxCols: number): boolean {
  const size = board.length;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= size; num++) {
          if (isValidNumber(board, row, col, num, boxRows, boxCols)) {
            board[row][col] = num;
            if (solveSudoku(board, boxRows, boxCols)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function isValidNumber(
  board: number[][],
  row: number,
  col: number,
  num: number,
  boxRows: number,
  boxCols: number
): boolean {
  const size = board.length;
  for (let i = 0; i < size; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;
  }
  const boxRow = Math.floor(row / boxRows) * boxRows;
  const boxCol = Math.floor(col / boxCols) * boxCols;
  for (let r = boxRow; r < boxRow + boxRows; r++) {
    for (let c = boxCol; c < boxCol + boxCols; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}

function generateSudoku(config: DifficultyConfig): Cell[][] {
  const { size, emptyCells, boxRows, boxCols } = config;
  const board = Array(size)
    .fill(null)
    .map(() => Array(size).fill(0));

  // For 9x9: Fill diagonal 3x3 boxes first (they are independent)
  // For 6x6: Fill diagonal 2x3 boxes
  const numDiagonalBoxes = size === 9 ? 3 : 2;
  for (let box = 0; box < numDiagonalBoxes; box++) {
    const nums = Array.from({ length: size }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    let idx = 0;
    for (let r = box * boxRows; r < box * boxRows + boxRows; r++) {
      for (let c = box * boxCols; c < box * boxCols + boxCols; c++) {
        if (r < size && c < size) {
          board[r][c] = nums[idx++];
        }
      }
    }
  }

  // Solve the rest
  solveSudoku(board, boxRows, boxCols);

  // Convert to Cell format
  const cellBoard: Cell[][] = board.map((row) =>
    row.map((value) => ({
      value,
      isFixed: true,
      isValid: true,
      notes: [],
    }))
  );

  // Remove random cells
  let removed = 0;
  while (removed < emptyCells) {
    const row = Math.floor(Math.random() * size);
    const col = Math.floor(Math.random() * size);
    if (cellBoard[row][col].value !== 0) {
      cellBoard[row][col].value = 0;
      cellBoard[row][col].isFixed = false;
      removed++;
    }
  }

  return cellBoard;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Exported for testing
export function getNextCell(
  board: Cell[][],
  currentRow: number,
  currentCol: number,
  direction: "up" | "down" | "left" | "right"
): { row: number; col: number } | null {
  const size = board.length;
  let row = currentRow;
  let col = currentCol;

  switch (direction) {
    case "up":
      row = Math.max(0, row - 1);
      break;
    case "down":
      row = Math.min(size - 1, row + 1);
      break;
    case "left":
      col = Math.max(0, col - 1);
      break;
    case "right":
      col = Math.min(size - 1, col + 1);
      break;
  }

  // If position didn't change, we're at boundary
  if (row === currentRow && col === currentCol) {
    return null;
  }

  // Find next editable cell in the direction, skipping fixed cells
  let targetRow = row;
  let targetCol = col;
  let attempts = 0;

  while (board[targetRow]?.[targetCol]?.isFixed && attempts < size) {
    switch (direction) {
      case "up":
        if (targetRow > 0) targetRow--;
        break;
      case "down":
        if (targetRow < size - 1) targetRow++;
        break;
      case "left":
        if (targetCol > 0) targetCol--;
        break;
      case "right":
        if (targetCol < size - 1) targetCol++;
        break;
    }
    attempts++;
  }

  // Return the cell if it's editable, otherwise null
  if (board[targetRow]?.[targetCol] && !board[targetRow][targetCol].isFixed) {
    return { row: targetRow, col: targetCol };
  }

  return null;
}

export function SudokuGame() {
  const [game, setGame] = useState<GameState>(() => ({
    board: generateSudoku(DIFFICULTY_LEVELS.easy),
    selectedCell: null,
    difficulty: "easy",
    isComplete: false,
    isStarted: false,
    startTime: Date.now(),
    elapsedTime: 0,
  }));

  useEffect(() => {
    if (!game.isStarted || game.isComplete) return;

    const timer = setInterval(() => {
      setGame((prev) => ({
        ...prev,
        elapsedTime: Math.floor((Date.now() - prev.startTime) / 1000),
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [game.isStarted, game.isComplete]);

  const newGame = useCallback((difficulty: "easy" | "medium" | "hard") => {
    setGame({
      board: generateSudoku(DIFFICULTY_LEVELS[difficulty]),
      selectedCell: null,
      difficulty,
      isComplete: false,
      isStarted: false,
      startTime: Date.now(),
      elapsedTime: 0,
    });
  }, []);

  const startGame = useCallback(() => {
    setGame((prev) => ({
      ...prev,
      isStarted: true,
      startTime: Date.now(),
    }));
  }, []);

  const selectCell = useCallback((row: number, col: number) => {
    setGame((prev) => ({
      ...prev,
      selectedCell: { row, col },
    }));
  }, []);

  const inputNumber = useCallback(
    (num: number) => {
      if (!game.selectedCell || game.isComplete) return;

      const { row, col } = game.selectedCell;
      // Only allow input on non-fixed cells
      if (game.board[row][col].isFixed) return;

      setGame((prev) => {
        const config = DIFFICULTY_LEVELS[prev.difficulty];
        const newBoard = prev.board.map((r) => r.map((c) => ({ ...c })));
        newBoard[row][col].value = num;

        // Re-validate all non-fixed cells after each input
        const size = newBoard.length;
        for (let r = 0; r < size; r++) {
          for (let c = 0; c < size; c++) {
            if (!newBoard[r][c].isFixed && newBoard[r][c].value !== 0) {
              newBoard[r][c].isValid = isValidPlacement(
                newBoard,
                r,
                c,
                newBoard[r][c].value,
                config.boxRows,
                config.boxCols
              );
            }
          }
        }

        // Check if complete - all cells filled and valid
        const isComplete = newBoard.every((r) =>
          r.every((c) => c.value !== 0 && c.isValid)
        );

        return { ...prev, board: newBoard, isComplete };
      });
    },
    [game.selectedCell, game.isComplete, game.board]
  );

  const clearCell = useCallback(() => {
    if (!game.selectedCell || game.isComplete) return;

    const { row, col } = game.selectedCell;
    if (game.board[row][col].isFixed) return;

    setGame((prev) => {
      const newBoard = prev.board.map((r) => r.map((c) => ({ ...c })));
      newBoard[row][col].value = 0;
      newBoard[row][col].isValid = true;
      return { ...prev, board: newBoard };
    });
  }, [game.selectedCell, game.isComplete, game.board]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (game.isComplete) return;

      const maxNum = game.board.length;
      const keyNum = parseInt(e.key, 10);

      // Number input - only works on non-fixed cells
      if (e.key >= "1" && e.key <= "9" && keyNum <= maxNum) {
        if (game.selectedCell && !game.board[game.selectedCell.row][game.selectedCell.col].isFixed) {
          inputNumber(keyNum);
        }
      } else if (e.key === "Backspace" || e.key === "Delete") {
        clearCell();
      } else if (game.selectedCell) {
        const { row, col } = game.selectedCell;
        const size = game.board.length;

        // Simple arrow navigation - move one cell at a time, wrap around
        let newRow = row;
        let newCol = col;

        switch (e.key) {
          case "ArrowUp":
            newRow = row > 0 ? row - 1 : size - 1;
            break;
          case "ArrowDown":
            newRow = row < size - 1 ? row + 1 : 0;
            break;
          case "ArrowLeft":
            newCol = col > 0 ? col - 1 : size - 1;
            break;
          case "ArrowRight":
            newCol = col < size - 1 ? col + 1 : 0;
            break;
        }

        if (newRow !== row || newCol !== col) {
          setGame((prev) => ({
            ...prev,
            selectedCell: { row: newRow, col: newCol },
          }));
        }
      }
    },
    [game.isComplete, game.selectedCell, game.board, inputNumber, clearCell]
  );

  return (
    <div
      className="flex h-full flex-col outline-none"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-medium text-slate-500">数独</h2>
          <p className="text-sm text-slate-500">
            时间: {formatTime(game.elapsedTime)} | 难度:
            {DIFFICULTY_LEVELS[game.difficulty].name}
          </p>
        </div>
        <div className="flex gap-2">
          {( ["easy", "medium", "hard"] as const).map((diff) => (
            <button
              key={diff}
              type="button"
              onClick={() => newGame(diff)}
              className={`rounded-lg px-3 py-1.5 text-sm font-normal transition ${
                game.difficulty === diff
                  ? "bg-sky-400 text-white"
                  : "border border-slate-200 bg-white text-slate-300 hover:bg-slate-50"
              }`}
            >
              {DIFFICULTY_LEVELS[diff].name}
            </button>
          ))}
        </div>
      </div>

      {/* Game Area */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-4 overflow-y-auto">
        {/* Board */}
        <div className="relative">
          {/* Start overlay */}
          {!game.isStarted && !game.isComplete && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/95">
              <button
                type="button"
                onClick={startGame}
                className="rounded-xl bg-sky-500 px-8 py-4 text-lg font-medium text-white shadow-lg transition hover:bg-sky-600"
              >
                开始游戏
              </button>
            </div>
          )}

          {game.isComplete && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/90">
              <div className="text-center">
                <div className="mb-2 text-4xl">🎉</div>
                <div className="text-xl font-bold text-green-600">完成!</div>
                <div className="text-sm text-slate-500">
                  用时: {formatTime(game.elapsedTime)}
                </div>
              </div>
            </div>
          )}

          <div
            className="grid gap-px rounded-lg border-2 border-slate-800 bg-slate-800 p-1"
            style={{
              gridTemplateColumns: `repeat(${game.board.length}, minmax(0, 1fr))`,
            }}
          >
            {game.board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const config = DIFFICULTY_LEVELS[game.difficulty];
                const isSelected =
                  game.selectedCell?.row === rowIndex &&
                  game.selectedCell?.col === colIndex;
                const isSameRow = game.selectedCell?.row === rowIndex;
                const isSameCol = game.selectedCell?.col === colIndex;
                const isSameBox =
                  game.selectedCell &&
                  Math.floor(game.selectedCell.row / config.boxRows) ===
                    Math.floor(rowIndex / config.boxRows) &&
                  Math.floor(game.selectedCell.col / config.boxCols) ===
                    Math.floor(colIndex / config.boxCols);

                const isBoxBorderRight = (colIndex + 1) % config.boxCols === 0 && colIndex !== config.size - 1;
                const isBoxBorderBottom = (rowIndex + 1) % config.boxRows === 0 && rowIndex !== config.size - 1;

                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    onClick={() => selectCell(rowIndex, colIndex)}
                    className={`
                      flex items-center justify-center text-base font-normal transition-all
                      ${config.size === 6 ? "h-10 w-10" : "h-8 w-8"}
                      ${isSelected
                        ? "bg-sky-300 ring-2 ring-sky-500 ring-inset z-10"
                        : cell.isFixed
                          ? "bg-slate-100 text-slate-500"
                          : "bg-white text-sky-600"}
                      ${!isSelected && (isSameRow || isSameCol || isSameBox) ? "bg-sky-50" : ""}
                      ${!cell.isValid && cell.value !== 0 ? "text-red-500" : ""}
                      ${isBoxBorderRight ? "border-r-2 border-r-slate-800" : ""}
                      ${isBoxBorderBottom ? "border-b-2 border-b-slate-800" : ""}
                    `}
                  >
                    {cell.value !== 0 ? cell.value : ""}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Number Pad */}
        <div className="flex flex-col gap-2 items-center">
          {game.board.length === 6 ? (
            // 6x6: 3x2 grid for numbers, clear button below
            <>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => inputNumber(num)}
                    disabled={game.isComplete}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-400 text-lg font-normal text-white transition hover:bg-sky-500 disabled:opacity-50"
                  >
                    {num}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={clearCell}
                disabled={game.isComplete}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-300 bg-white text-sm font-normal text-red-400 transition hover:bg-red-50 disabled:opacity-50"
              >
                清除
              </button>
            </>
          ) : (
            // 9x9: 5 numbers in first row, 4 numbers + clear in second row
            <>
              <div className="grid grid-cols-5 gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => inputNumber(num)}
                    disabled={game.isComplete}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-400 text-lg font-normal text-white transition hover:bg-sky-500 disabled:opacity-50"
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => inputNumber(num)}
                    disabled={game.isComplete}
                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-400 text-lg font-normal text-white transition hover:bg-sky-500 disabled:opacity-50"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearCell}
                  disabled={game.isComplete}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-300 bg-white text-sm font-normal text-red-400 transition hover:bg-red-50 disabled:opacity-50"
                >
                  清除
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-400">
        <p>
          规则：在 {game.board.length}×{game.board.length} 的格子中填入 1-{game.board.length}，使每行、每列、每个宫格内数字不重复
        </p>
        <p className="mt-1 text-xs text-slate-400">
          快捷键：数字键输入，方向键移动，Backspace 清除
        </p>
      </div>
    </div>
  );
}
