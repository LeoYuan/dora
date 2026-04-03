import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MinesweeperGame } from "../MinesweeperGame";

describe("MinesweeperGame", () => {
  it("renders game board", () => {
    render(<MinesweeperGame />);

    // Check header
    expect(screen.getByText("扫雷")).toBeInTheDocument();
    expect(screen.getByText(/时间:/)).toBeInTheDocument();
    expect(screen.getByText(/剩余:/)).toBeInTheDocument();

    // Check difficulty buttons
    expect(screen.getByRole("button", { name: "简单" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "中等" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "困难" })).toBeInTheDocument();
  });

  it("can change difficulty", () => {
    render(<MinesweeperGame />);

    const mediumBtn = screen.getByRole("button", { name: "中等" });
    fireEvent.click(mediumBtn);
    expect(screen.getByText("扫雷")).toBeInTheDocument();

    const hardBtn = screen.getByRole("button", { name: "困难" });
    fireEvent.click(hardBtn);
    expect(screen.getByText("扫雷")).toBeInTheDocument();
  });

  it("displays game rules", () => {
    render(<MinesweeperGame />);

    expect(screen.getByText(/规则：点击格子翻开/)).toBeInTheDocument();
    expect(screen.getByText(/左键点击翻开，右键点击插旗/)).toBeInTheDocument();
  });

  it("timer starts at 0", () => {
    render(<MinesweeperGame />);
    expect(screen.getByText(/时间: 00:00/)).toBeInTheDocument();
  });

  it("shows remaining mine count", () => {
    render(<MinesweeperGame />);
    // Should show remaining mines (10 for easy)
    expect(screen.getByText(/剩余: 10/)).toBeInTheDocument();
  });
});
