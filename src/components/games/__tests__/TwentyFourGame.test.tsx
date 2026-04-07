import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TwentyFourGame } from "../TwentyFourGame";

describe("TwentyFourGame", () => {
  it("renders game with title and cards", () => {
    render(<TwentyFourGame />);

    // Check header
    expect(screen.getByText(/第 \d+ 关/)).toBeInTheDocument();
    expect(screen.getByText(/得分:/)).toBeInTheDocument();

    // Check action buttons
    expect(screen.getByText("新游戏")).toBeInTheDocument();
    expect(screen.getByText("提示")).toBeInTheDocument();
    expect(screen.getByText("重玩")).toBeInTheDocument();
  });

  it("shows hint when clicked", () => {
    render(<TwentyFourGame />);

    fireEvent.click(screen.getByText("提示"));
    expect(screen.getByText(/提示：/)).toBeInTheDocument();
  });

  it("can start new game", () => {
    render(<TwentyFourGame />);

    fireEvent.click(screen.getByText("新游戏"));
    expect(screen.getByText(/第 \d+ 关/)).toBeInTheDocument();
  });

  it("can reset game", () => {
    render(<TwentyFourGame />);

    fireEvent.click(screen.getByText("重玩"));
    expect(screen.getByText(/第 1 关/)).toBeInTheDocument();
  });

  it("displays game rules", () => {
    render(<TwentyFourGame />);

    // Rules text appears in both message area and footer
    const rulesElements = screen.getAllByText(/选择两个数字和一个运算符/);
    expect(rulesElements.length).toBeGreaterThanOrEqual(1);
  });

  it("allows selecting cards and operators", () => {
    render(<TwentyFourGame />);

    // Click an operator first
    const plusBtn = screen.getByText("＋");
    fireEvent.click(plusBtn);

    // Operator should be selected (scale-110)
    expect(plusBtn.className).toContain("scale-110");
  });
});
