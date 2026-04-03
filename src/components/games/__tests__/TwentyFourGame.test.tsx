import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TwentyFourGame } from "../TwentyFourGame";

describe("TwentyFourGame", () => {
  it("renders game with title and controls", () => {
    render(<TwentyFourGame />);

    expect(screen.getByText("算 24 点")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("输入算式，如: (3 + 5) * (2 + 1)")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "提交" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "提示" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "换一组" })).toBeInTheDocument();
  });

  it("shows error for empty input", () => {
    render(<TwentyFourGame />);

    fireEvent.click(screen.getByRole("button", { name: "提交" }));
    expect(screen.getByText("请输入算式")).toBeInTheDocument();
  });

  it("shows hint when clicked", () => {
    render(<TwentyFourGame />);

    fireEvent.click(screen.getByRole("button", { name: "提示" }));
    expect(screen.getByText(/提示：尝试不同的组合/)).toBeInTheDocument();
  });

  it("generates new cards when clicking 换一组", () => {
    render(<TwentyFourGame />);

    fireEvent.click(screen.getByRole("button", { name: "换一组" }));
    expect(screen.getByText("算 24 点")).toBeInTheDocument();
  });

  it("displays game rules", () => {
    render(<TwentyFourGame />);

    expect(screen.getByText(/游戏规则:/)).toBeInTheDocument();
    expect(screen.getByText(/使用给出的 4 个数字/)).toBeInTheDocument();
  });

  it("allows typing in input field", () => {
    render(<TwentyFourGame />);

    const input = screen.getByPlaceholderText(
      "输入算式，如: (3 + 5) * (2 + 1)"
    );
    fireEvent.change(input, { target: { value: "3 * 8" } });
    expect(input).toHaveValue("3 * 8");
  });
});
