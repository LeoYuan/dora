import { fireEvent, render, screen } from "@testing-library/react";
import App from "../../App";
import { invoke } from "../../lib/tauri";
import { useAppStore } from "../../stores/appStore";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(async (command: string) => {
    if (command === "chat") return "mock reply";
    if (command === "get_memos") return [];
    return null;
  }),
}));

vi.mock("../../lib/tauri", () => ({
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({
    minimize: vi.fn(),
    maximize: vi.fn(),
    unmaximize: vi.fn(),
    close: vi.fn(),
    startDragging: vi.fn(),
    isMaximized: vi.fn().mockResolvedValue(false),
  }),
}));

const mockedInvoke = vi.mocked(invoke);

describe("App", () => {
  beforeEach(() => {
    mockedInvoke.mockReset();
    useAppStore.getState().resetPanels();
  });

  it("renders the welcome home screen without the custom window header", () => {
    const { container } = render(<App />);

    expect(screen.queryByText("桌面陪伴助手")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "开始聊天" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "便签" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "设置" })).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("min-h-screen");
  });

  it("returns to home after closing chat", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "开始聊天" }));
    fireEvent.click(screen.getByLabelText("Close Dora chat"));

    expect(screen.getByRole("button", { name: "开始聊天" })).toBeInTheDocument();
  });

  it("returns to home after closing memos", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "便签" }));
    fireEvent.click(screen.getByLabelText("Close Dora memos"));

    expect(screen.getByRole("button", { name: "开始聊天" })).toBeInTheDocument();
  });

  it("opens settings from the home action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "设置" }));

    expect(screen.getByText("设置")).toBeInTheDocument();
    expect(screen.getByLabelText("Close Dora settings")).toBeInTheDocument();
  });

  it("returns to home after closing settings", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "设置" }));
    fireEvent.click(screen.getByLabelText("Close Dora settings"));

    expect(screen.getByRole("button", { name: "开始聊天" })).toBeInTheDocument();
  });

  it("opens chat from the primary home action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "开始聊天" }));
    expect(screen.getByLabelText("Close Dora chat")).toBeInTheDocument();
  });

  it("opens memos from the secondary home action", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "便签" }));
    expect(screen.getByText("快速记录你的想法")).toBeInTheDocument();
  });

  it("does not show hover memo icon on the avatar", () => {
    render(<App />);

    expect(screen.queryByLabelText("Open Dora memos")).not.toBeInTheDocument();
  });

  it("opens the main window when the floating avatar is clicked", () => {
    render(<App />);

    expect(screen.queryByLabelText("Close Dora chat")).not.toBeInTheDocument();
  });
});
