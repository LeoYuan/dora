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
  startTime: number;
  elapsedTime: number;
}

const DIFFICULTY_LEVELS = {
  easy: { emptyCells: 35, name: "简单" },
  medium: { emptyCells: 45, name: "中等" },
  hard: { emptyCells: 55, name: "困难" },
};

function isValidPlacement(board: Cell[][], row: number, col: number, num: number): boolean {
  // Check row
  for (let c = 0; c < 9; c++) {
    if (c !== col && board[row][c].value === num) return false;
  }

  // Check column
  for (let r = 0; r < 9; r++) {
    if (r !== row && board[r][col].value === num) return false;
  }

  // Check 3x3 box
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if ((r !== row || c !== col) && board[r][c].value === num) return false;
    }
  }

  return true;
}

function solveSudoku(board: number[][]): boolean {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValidNumber(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function isValidNumber(board: number[][], row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
    if (board[i][col] === num) return false;
  }
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}

function generateSudoku(emptyCells: number): Cell[][] {
  const board = Array(9)
    .fill(null)
    .map(() => Array(9).fill(0));

  // Fill diagonal 3x3 boxes first (they are independent)
  for (let box = 0; box < 3; box++) {
    const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
    let idx = 0;
    for (let r = box * 3; r < box * 3 + 3; r++) {
      for (let c = box * 3; c < box * 3 + 3; c++) {
        board[r][c] = nums[idx++];
      }
    }
  }

  // Solve the rest
  solveSudoku(board);

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
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);
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

export function SudokuGame() {
  const [game, setGame] = useState<GameState>(() => ({
    board: generateSudoku(DIFFICULTY_LEVELS.easy.emptyCells),
    selectedCell: null,
    difficulty: "easy",
    isComplete: false,
    startTime: Date.now(),
    elapsedTime: 0,
  }));

  useEffect(() => {
    const timer = setInterval(() => {
      setGame((prev) => ({
        ...prev,
        elapsedTime: Math.floor((Date.now() - prev.startTime) / 1000),
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const newGame = useCallback((difficulty: "easy" | "medium" | "hard") => {
    setGame({
      board: generateSudoku(DIFFICULTY_LEVELS[difficulty].emptyCells),
      selectedCell: null,
      difficulty,
      isComplete: false,
      startTime: Date.now(),
      elapsedTime: 0,
    });
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
      if (game.board[row][col].isFixed) return;

      setGame((prev) => {
        const newBoard = prev.board.map((r) => r.map((c) => ({ ...c })));
        newBoard[row][col].value = num;
        newBoard[row][col].isValid = isValidPlacement(newBoard, row, col, num);

        // Check if complete
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

      if (e.key >= "1" && e.key <= "9") {
        inputNumber(parseInt(e.key, 10));
      } else if (e.key === "Backspace" || e.key === "Delete") {
        clearCell();
      } else if (game.selectedCell) {
        const { row, col } = game.selectedCell;
        switch (e.key) {
          case "ArrowUp":
            if (row > 0) selectCell(row - 1, col);
            break;
          case "ArrowDown":
            if (row < 8) selectCell(row + 1, col);
            break;
          case "ArrowLeft":
            if (col > 0) selectCell(row, col - 1);
            break;
          case "ArrowRight":
            if (col < 8) selectCell(row, col + 1);
            break;
        }
      }
    },
    [game.isComplete, game.selectedCell, inputNumber, clearCell, selectCell]
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
      <div className="flex flex-1 items-center justify-center gap-8 p-6">
        {/* Board */}
        <div className="relative">
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

          <div className="grid grid-cols-9 gap-0.5 rounded-lg border-2 border-slate-800 bg-slate-800">
            {game.board.map((row, rowIndex) =>
              row.map((cell, colIndex) => {
                const isSelected =
                  game.selectedCell?.row === rowIndex &&
                  game.selectedCell?.col === colIndex;
                const isSameRow = game.selectedCell?.row === rowIndex;
                const isSameCol = game.selectedCell?.col === colIndex;
                const isSameBox =
                  game.selectedCell &&
                  Math.floor(game.selectedCell.row / 3) ===
                    Math.floor(rowIndex / 3) &&
                  Math.floor(game.selectedCell.col / 3) ===
                    Math.floor(colIndex / 3);

                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    type="button"
                    onClick={() => selectCell(rowIndex, colIndex)}
                    className={`
                      flex h-10 w-10 items-center justify-center text-lg font-medium
                      ${cell.isFixed ? "bg-slate-100 text-slate-500" : "bg-white text-sky-600"}
                      ${isSelected ? "bg-sky-200" : ""}
                      ${!isSelected && (isSameRow || isSameCol || isSameBox) ? "bg-sky-50" : ""}
                      ${!cell.isValid && cell.value !== 0 ? "text-red-500" : ""}
                      ${colIndex % 3 === 2 && colIndex !== 8 ? "border-r-2 border-r-slate-800" : ""}
                      ${rowIndex % 3 === 2 && rowIndex !== 8 ? "border-b-2 border-b-slate-800" : ""}
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
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => inputNumber(num)}
                disabled={game.isComplete}
                className="flex h-12 w-12 items-center justify-center rounded-lg bg-sky-500 text-xl font-medium text-white transition hover:bg-sky-600 disabled:opacity-50"
              >
                {num}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={clearCell}
            disabled={game.isComplete}
            className="rounded-lg border-2 border-red-400 bg-white py-3 text-base font-medium text-red-500 transition hover:bg-red-50 disabled:opacity-50"
          >
            清除
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-400">
        <p>规则：在 9×9 的格子中填入 1-9，使每行、每列、每个 3×3 宫格内数字不重复</p>
        <p className="mt-1 text-xs text-slate-400">
          快捷键：数字键输入，方向键移动，Backspace 清除
        </p>
      </div>
    </div>
  );
}
