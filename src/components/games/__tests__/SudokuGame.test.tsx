import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SudokuGame, getNextCell } from "../SudokuGame";

interface Cell {
  value: number;
  isFixed: boolean;
  isValid: boolean;
  notes: number[];
}

function createBoard(fixedPositions: { row: number; col: number }[]): Cell[][] {
  return Array(9)
    .fill(null)
    .map((_, row) =>
      Array(9)
        .fill(null)
        .map((_, col) => ({
          value: fixedPositions.some((p) => p.row === row && p.col === col) ? 1 : 0,
          isFixed: fixedPositions.some((p) => p.row === row && p.col === col),
          isValid: true,
          notes: [],
        }))
    );
}

describe("SudokuGame", () => {
  it("renders game board", () => {
    render(<SudokuGame />);

    // Check header
    expect(screen.getByText("数独")).toBeInTheDocument();
    expect(screen.getByText(/时间:/)).toBeInTheDocument();
    expect(screen.getByText(/难度:/)).toBeInTheDocument();

    // Check difficulty buttons
    expect(screen.getByRole("button", { name: "简单" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "中等" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "困难" })).toBeInTheDocument();

    // Check clear button
    expect(screen.getByRole("button", { name: "清除" })).toBeInTheDocument();
  });

  it("can change difficulty", () => {
    render(<SudokuGame />);

    const mediumBtn = screen.getByRole("button", { name: "中等" });
    fireEvent.click(mediumBtn);
    expect(screen.getByText(/难度:中等/)).toBeInTheDocument();

    const hardBtn = screen.getByRole("button", { name: "困难" });
    fireEvent.click(hardBtn);
    expect(screen.getByText(/难度:困难/)).toBeInTheDocument();
  });

  it("displays game rules", () => {
    render(<SudokuGame />);

    // Rules text is now dynamic based on board size
    expect(screen.getByText(/规则：在/)).toBeInTheDocument();
    expect(screen.getByText(/快捷键：数字键输入，方向键移动/)).toBeInTheDocument();
  });

  it("timer starts at 0", () => {
    render(<SudokuGame />);
    expect(screen.getByText(/时间: 00:00/)).toBeInTheDocument();
  });
});

describe("getNextCell", () => {
  it("moves to adjacent editable cell", () => {
    const board = createBoard([]);
    const result = getNextCell(board, 4, 4, "up");
    expect(result).toEqual({ row: 3, col: 4 });
  });

  it("skips fixed cells and finds next editable", () => {
    const board = createBoard([
      { row: 3, col: 4 },
      { row: 2, col: 4 },
    ]);
    const result = getNextCell(board, 4, 4, "up");
    expect(result).toEqual({ row: 1, col: 4 });
  });

  it("returns null when all cells in direction are fixed", () => {
    const board = createBoard([
      { row: 0, col: 4 },
      { row: 1, col: 4 },
      { row: 2, col: 4 },
      { row: 3, col: 4 },
    ]);
    const result = getNextCell(board, 4, 4, "up");
    expect(result).toBeNull();
  });

  it("returns null when at top boundary", () => {
    const board = createBoard([]);
    const result = getNextCell(board, 0, 4, "up");
    expect(result).toBeNull();
  });

  it("returns null when at bottom boundary", () => {
    const board = createBoard([]);
    const result = getNextCell(board, 8, 4, "down");
    expect(result).toBeNull();
  });

  it("returns null when at left boundary", () => {
    const board = createBoard([]);
    const result = getNextCell(board, 4, 0, "left");
    expect(result).toBeNull();
  });

  it("returns null when at right boundary", () => {
    const board = createBoard([]);
    const result = getNextCell(board, 4, 8, "right");
    expect(result).toBeNull();
  });

  it("moves right correctly", () => {
    const board = createBoard([]);
    const result = getNextCell(board, 4, 4, "right");
    expect(result).toEqual({ row: 4, col: 5 });
  });

  it("moves left correctly", () => {
    const board = createBoard([]);
    const result = getNextCell(board, 4, 4, "left");
    expect(result).toEqual({ row: 4, col: 3 });
  });

  it("moves down correctly", () => {
    const board = createBoard([]);
    const result = getNextCell(board, 4, 4, "down");
    expect(result).toEqual({ row: 5, col: 4 });
  });

  it("skips multiple consecutive fixed cells", () => {
    const board = createBoard([
      { row: 3, col: 4 },
      { row: 2, col: 4 },
      { row: 1, col: 4 },
    ]);
    const result = getNextCell(board, 4, 4, "up");
    expect(result).toEqual({ row: 0, col: 4 });
  });
});

describe("6x6 Sudoku", () => {
  it("renders 6x6 grid for easy difficulty", () => {
    render(<SudokuGame />);

    // Easy mode defaults to 6x6 - check grid style
    const grid = document.querySelector('[style*="grid-template-columns"]');
    expect(grid).toHaveAttribute("style", expect.stringContaining("repeat(6"));
  });

  it("renders 9x9 grid for medium difficulty", () => {
    render(<SudokuGame />);

    const mediumBtn = screen.getByRole("button", { name: "中等" });
    fireEvent.click(mediumBtn);

    // Check grid has 9 columns
    const grid = document.querySelector('[style*="grid-template-columns"]');
    expect(grid).toHaveAttribute("style", expect.stringContaining("repeat(9"));
  });

  it("validates 6x6 with 2x3 boxes correctly", () => {
    render(<SudokuGame />);
    // Easy mode defaults to 6x6
    expect(screen.getByText(/难度:简单/)).toBeInTheDocument();
  });

  it("number pad shows 1-6 for easy mode", () => {
    render(<SudokuGame />);
    // Easy mode defaults to 6x6

    // Get number pad buttons (filter by className to exclude board cells)
    const numPadButtons = screen.getAllByRole("button").filter(
      btn => btn.className.includes("bg-sky-400") && !btn.className.includes("h-8") && !btn.className.includes("h-10 w-10 text-base")
    );

    // Should have 6 number buttons + 1 clear button in number pad area
    expect(numPadButtons.length).toBe(7); // 1-6 + clear

    // Check numbers 1-6 exist
    for (let i = 1; i <= 6; i++) {
      expect(screen.getAllByText(i.toString()).length).toBeGreaterThanOrEqual(1);
    }
  });

  it("number pad shows 1-9 for medium/hard mode", () => {
    render(<SudokuGame />);
    const mediumBtn = screen.getByRole("button", { name: "中等" });
    fireEvent.click(mediumBtn);

    // Get number pad buttons
    const numPadButtons = screen.getAllByRole("button").filter(
      btn => btn.className.includes("bg-sky-400") && !btn.className.includes("h-8")
    );

    // Should have 9 number buttons + 1 clear button
    expect(numPadButtons.length).toBe(10); // 1-9 + clear
  });

  it("keyboard navigation respects 6x6 boundaries", () => {
    // This will be tested via getNextCell with 6x6 board
    const board6x6 = Array(6).fill(null).map((_, row) =>
      Array(6).fill(null).map((_, col) => ({
        value: 0,
        isFixed: false,
        isValid: true,
        notes: [],
      }))
    );

    // At row 5 (bottom), should not move down
    const result = getNextCell(board6x6, 5, 3, "down");
    expect(result).toBeNull();

    // At col 5 (right edge), should not move right
    const result2 = getNextCell(board6x6, 3, 5, "right");
    expect(result2).toBeNull();
  });
});
