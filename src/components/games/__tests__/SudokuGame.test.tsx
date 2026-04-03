import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SudokuGame } from "../SudokuGame";

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
