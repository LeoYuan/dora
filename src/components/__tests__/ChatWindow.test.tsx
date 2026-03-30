import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { invoke } from "../../lib/tauri";
import { ChatWindow } from "../ChatWindow";

vi.mock("../../lib/tauri", () => ({
  invoke: vi.fn(),
}));

const mockedInvoke = vi.mocked(invoke);

describe("ChatWindow", () => {
  beforeEach(() => {
    mockedInvoke.mockReset();
  });

  it("loads existing chat history on mount", async () => {
    mockedInvoke.mockResolvedValueOnce([
      {
        id: "history-1",
        role: "assistant",
        content: "之前的聊天记录",
        timestamp: new Date().toISOString(),
      },
    ]);

    render(<ChatWindow onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("之前的聊天记录")).toBeInTheDocument();
    });
  });

  it("shows welcome message", async () => {
    mockedInvoke.mockResolvedValueOnce([]);

    render(<ChatWindow onClose={() => {}} />);
    expect(
      await screen.findByText("你好呀！我是 Dora，你的桌面小伙伴～有什么我可以帮你的吗？"),
    ).toBeInTheDocument();
  });

  it("restores welcome state after clear history", async () => {
    mockedInvoke.mockResolvedValueOnce([
      {
        id: "history-1",
        role: "assistant",
        content: "之前的聊天记录",
        timestamp: new Date().toISOString(),
      },
    ]);
    mockedInvoke.mockResolvedValueOnce(null);

    render(<ChatWindow onClose={() => {}} />);

    await screen.findByText("之前的聊天记录");
    fireEvent.click(screen.getByRole("button", { name: "Clear Dora chat history" }));

    await waitFor(() => {
      expect(
        screen.getByText("你好呀！我是 Dora，你的桌面小伙伴～有什么我可以帮你的吗？"),
      ).toBeInTheDocument();
    });
  });

  it("shows loading and appends assistant reply after sending", async () => {
    mockedInvoke.mockResolvedValueOnce([]);
    let resolveReply: ((value: string) => void) | undefined;
    mockedInvoke.mockImplementationOnce(
      (_command: string) =>
        new Promise<string>((resolve) => {
          resolveReply = resolve;
        }),
    );

    render(<ChatWindow onClose={() => {}} />);
    await screen.findByText("你好呀！我是 Dora，你的桌面小伙伴～有什么我可以帮你的吗？");
    fireEvent.change(screen.getByLabelText("Dora chat input"), {
      target: { value: "你好 Dora" },
    });
    fireEvent.click(screen.getByLabelText("Send Dora message"));

    expect(screen.getByText("你好 Dora")).toBeInTheDocument();
    expect(screen.getByText("正在思考...")).toBeInTheDocument();
    expect(screen.getByLabelText("Send Dora message")).toBeDisabled();

    resolveReply?.("mock reply");

    await waitFor(() => {
      expect(screen.getByText("mock reply")).toBeInTheDocument();
      expect(screen.getByText("Claude 回复")).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.queryByText("正在思考...")).not.toBeInTheDocument();
    });
  });

  it("shows fallback reply when invoke fails", async () => {
    mockedInvoke.mockResolvedValueOnce([]);
    mockedInvoke.mockRejectedValueOnce(new Error("boom"));

    render(<ChatWindow onClose={() => {}} />);
    await screen.findByText("你好呀！我是 Dora，你的桌面小伙伴～有什么我可以帮你的吗？");
    fireEvent.change(screen.getByLabelText("Dora chat input"), {
      target: { value: "test" },
    });
    fireEvent.click(screen.getByLabelText("Send Dora message"));

    await waitFor(() => {
      expect(
        screen.getByText("哎呀，我有点小迷糊，能再说一遍吗？"),
      ).toBeInTheDocument();
      expect(screen.getAllByText("Fallback 回复").length).toBeGreaterThan(0);
      expect(screen.getByText("boom")).toBeInTheDocument();
    });
  });

  it("keeps the input focused after pressing enter to send", async () => {
    mockedInvoke.mockResolvedValueOnce([]);
    mockedInvoke.mockResolvedValueOnce("focus reply");

    render(<ChatWindow onClose={() => {}} />);
    const input = (await screen.findByLabelText("Dora chat input")) as HTMLTextAreaElement;
    input.focus();

    fireEvent.change(input, {
      target: { value: "focus test" },
    });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("focus reply")).toBeInTheDocument();
    });
    expect(document.activeElement).toBe(input);
  });
});
