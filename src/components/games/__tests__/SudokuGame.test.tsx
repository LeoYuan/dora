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

    expect(screen.getByText(/规则：在 9×9 的格子中填入 1-9/)).toBeInTheDocument();
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
