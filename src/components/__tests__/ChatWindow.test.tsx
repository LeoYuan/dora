import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Settings } from "../../types/settings";
import { invoke } from "../../lib/tauri";
import { ChatWindow } from "../ChatWindow";
import type { CompanionMemoryItem } from "../../types/companion";

const defaultMemory: CompanionMemoryItem[] = [];

const settings: Settings = {
  userName: "",
  theme: "auto",
  provider: "claude" as const,
  apiKey: "",
  baseUrl: "https://api.anthropic.com",
  companionMode: "default" as const,
};

const mockInitialLoads = (options?: {
  history?: unknown;
  memory?: CompanionMemoryItem[];
  companionMode?: "default" | "supportive" | "focused";
}) => {
  mockedInvoke.mockResolvedValueOnce(options?.history ?? []);
  mockedInvoke.mockResolvedValueOnce(options?.memory ?? defaultMemory);
  mockedInvoke.mockResolvedValueOnce({
    ...settings,
    companionMode: options?.companionMode ?? settings.companionMode,
  });
};


vi.mock("../../lib/tauri", () => ({
  invoke: vi.fn(),
}));

const mockedInvoke = vi.mocked(invoke);

describe("ChatWindow", () => {
  beforeEach(() => {
    mockedInvoke.mockReset();
  });

  it("loads existing chat history on mount", async () => {
    mockInitialLoads({
      history: [
        {
          id: "history-1",
          role: "assistant",
          content: "之前的聊天记录",
          timestamp: new Date().toISOString(),
        },
      ],
    });

    render(<ChatWindow onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("之前的聊天记录")).toBeInTheDocument();
    });
  });

  it("shows welcome message", async () => {
    mockInitialLoads();

    render(<ChatWindow onClose={() => {}} />);
    expect(
      await screen.findByText("你好呀！我是 Dora，你的桌面小伙伴～有什么我可以帮你的吗？"),
    ).toBeInTheDocument();
  });

  it("restores welcome state after clear history", async () => {
    mockInitialLoads({
      history: [
        {
          id: "history-1",
          role: "assistant",
          content: "之前的聊天记录",
          timestamp: new Date().toISOString(),
        },
      ],
    });
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
    mockInitialLoads();

    render(<ChatWindow onClose={() => {}} />);
    await screen.findByText("你好呀！我是 Dora，你的桌面小伙伴～有什么我可以帮你的吗？");
    fireEvent.change(screen.getByLabelText("Dora chat input"), {
      target: { value: "你好 Dora" },
    });
    fireEvent.click(screen.getByLabelText("Send Dora message"));

    expect(screen.getByText("你好 Dora")).toBeInTheDocument();
    expect(screen.getByText("正在思考...")).toBeInTheDocument();
    expect(screen.getByLabelText("Send Dora message")).toBeDisabled();
  });

  it("shows fallback reply when invoke fails", async () => {
    mockInitialLoads();

    render(<ChatWindow onClose={() => {}} />);
    await screen.findByText("你好呀！我是 Dora，你的桌面小伙伴～有什么我可以帮你的吗？");
    fireEvent.change(screen.getByLabelText("Dora chat input"), {
      target: { value: "test" },
    });
    fireEvent.click(screen.getByLabelText("Send Dora message"));

    expect(screen.queryByText("哎呀，我有点小迷糊，能再说一遍吗？")).not.toBeInTheDocument();
    expect(screen.queryByText("boom")).not.toBeInTheDocument();
  });

  it("keeps the input focused after pressing enter to send", async () => {
    mockInitialLoads();

    render(<ChatWindow onClose={() => {}} />);
    const input = (await screen.findByLabelText("Dora chat input")) as HTMLTextAreaElement;
    input.focus();

    fireEvent.change(input, {
      target: { value: "focus test" },
    });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    expect(screen.queryByText("focus reply")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(input);
  });

  it("does not show companion memory UI inside chat", async () => {
    mockInitialLoads({
      memory: [
        {
          id: "memory-1",
          content: "喜欢喝拿铁",
          source: "user",
          createdAt: new Date().toISOString(),
          isPinned: false,
        },
      ],
      companionMode: "supportive",
    });

    render(<ChatWindow onClose={() => {}} />);

    expect(screen.queryByText("陪伴记忆")).not.toBeInTheDocument();
    expect(screen.queryByText("喜欢喝拿铁")).not.toBeInTheDocument();
    expect(screen.queryByText("当前模式：温柔支持")).not.toBeInTheDocument();
  });

  it("does not allow adding companion memory from chat", async () => {
    mockInitialLoads();

    render(<ChatWindow onClose={() => {}} />);

    expect(screen.queryByLabelText("New companion memory input")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Add companion memory")).not.toBeInTheDocument();
  });

  it("does not allow deleting companion memory from chat", async () => {
    mockInitialLoads({
      memory: [
        {
          id: "memory-1",
          content: "喜欢喝拿铁",
          source: "user",
          createdAt: new Date().toISOString(),
          isPinned: false,
        },
      ],
    });

    render(<ChatWindow onClose={() => {}} />);

    expect(screen.queryByLabelText("Delete companion memory 喜欢喝拿铁")).not.toBeInTheDocument();
  });
});
