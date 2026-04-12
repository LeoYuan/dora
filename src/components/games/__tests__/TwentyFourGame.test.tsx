import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TwentyFourGame, replaceCards } from "../TwentyFourGame";

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

describe("replaceCards", () => {
  it("should replace two cards with result and keep other cards", () => {
    const cards = [
      { id: "card-0", value: 13, display: "13" },
      { id: "card-1", value: 12, display: "12" },
      { id: "card-2", value: 4, display: "4" },
      { id: "card-3", value: 11, display: "11" },
    ];

    // Simulate 13 - 11 = 2
    const result = replaceCards(cards, "card-0", "card-3", 2);

    // Should have 3 cards: 12, 4, and the result (2)
    expect(result).toHaveLength(3);
    expect(result.map((c) => c.value)).toContain(12);
    expect(result.map((c) => c.value)).toContain(4);
    expect(result.map((c) => c.value)).toContain(2);
    expect(result.map((c) => c.value)).not.toContain(13);
    expect(result.map((c) => c.value)).not.toContain(11);
  });

  it("should handle adjacent cards correctly", () => {
    const cards = [
      { id: "card-0", value: 3, display: "3" },
      { id: "card-1", value: 4, display: "4" },
      { id: "card-2", value: 5, display: "5" },
      { id: "card-3", value: 6, display: "6" },
    ];

    // Simulate 3 + 4 = 7
    const result = replaceCards(cards, "card-0", "card-1", 7);

    expect(result).toHaveLength(3);
    expect(result.map((c) => c.value)).toContain(5);
    expect(result.map((c) => c.value)).toContain(6);
    expect(result.map((c) => c.value)).toContain(7);
  });

  it("should handle last two cards correctly", () => {
    const cards = [
      { id: "card-0", value: 12, display: "12" },
      { id: "card-1", value: 2, display: "2" },
    ];

    // Simulate 12 * 2 = 24
    const result = replaceCards(cards, "card-0", "card-1", 24);

    expect(result).toHaveLength(1);
    expect(result[0].value).toBe(24);
  });
});
