import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { invoke } from "../../lib/tauri";
import { SettingsPanel } from "../SettingsPanel";

vi.mock("../../lib/tauri", () => ({
  invoke: vi.fn(),
}));

const mockedInvoke = vi.mocked(invoke);

describe("SettingsPanel", () => {
  beforeEach(() => {
    mockedInvoke.mockReset();
  });

  it("renders user name, theme, provider, and api key inputs", async () => {
    mockedInvoke.mockResolvedValueOnce({
      userName: "Leo",
      theme: "auto",
      provider: "claude",
      apiKey: "",
      baseUrl: "https://api.anthropic.com",
      companionMode: "supportive",
    });
    mockedInvoke.mockResolvedValueOnce({ source: "missing", hasApiKey: false });

    render(<SettingsPanel onClose={() => {}} />);

    expect(await screen.findByLabelText("Settings user name")).toHaveValue("Leo");
    expect(screen.getByLabelText("Settings theme")).toBeInTheDocument();
    expect(screen.getByLabelText("Settings provider")).toBeInTheDocument();
    expect(screen.getByLabelText("Settings API key")).toBeInTheDocument();
    expect(screen.getByLabelText("Settings base URL")).toHaveValue("https://api.anthropic.com");
    expect(screen.getByLabelText("Settings companion mode")).toHaveValue("supportive");
  });

  it("saves the configured base url", async () => {
    mockedInvoke.mockResolvedValueOnce({
      userName: "",
      theme: "auto",
      provider: "claude",
      apiKey: "",
      baseUrl: "https://api.anthropic.com",
      companionMode: "default",
    });
    mockedInvoke.mockResolvedValueOnce({ source: "missing", hasApiKey: false });
    mockedInvoke.mockResolvedValueOnce(null);
    mockedInvoke.mockResolvedValueOnce({ source: "local", hasApiKey: true });

    render(<SettingsPanel onClose={() => {}} />);

    fireEvent.change(await screen.findByLabelText("Settings base URL"), {
      target: { value: "https://code2ai.codes" },
    });
    fireEvent.change(screen.getByLabelText("Settings companion mode"), {
      target: { value: "focused" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存设置" }));

    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith("save_settings", {
        settings: expect.objectContaining({
          baseUrl: "https://code2ai.codes",
          companionMode: "focused",
        }),
      });
    });
  });

  it("shows settings source status text", async () => {
    mockedInvoke.mockResolvedValueOnce({
      userName: "",
      theme: "auto",
      provider: "claude",
      apiKey: "",
      baseUrl: "https://api.anthropic.com",
      companionMode: "default",
    });
    mockedInvoke.mockResolvedValueOnce({ source: "env", hasApiKey: true });

    render(<SettingsPanel onClose={() => {}} />);

    expect(await screen.findByText("环境变量")).toBeInTheDocument();
    expect(screen.getByText("已检测到可用 API Key")).toBeInTheDocument();
  });

  it("saves settings through invoke", async () => {
    mockedInvoke.mockResolvedValueOnce({
      userName: "",
      theme: "auto",
      provider: "claude",
      apiKey: "",
      baseUrl: "https://api.anthropic.com",
      companionMode: "default",
    });
    mockedInvoke.mockResolvedValueOnce({ source: "missing", hasApiKey: false });
    mockedInvoke.mockResolvedValueOnce(null);
    mockedInvoke.mockResolvedValueOnce({ source: "local", hasApiKey: true });

    render(<SettingsPanel onClose={() => {}} />);

    fireEvent.change(await screen.findByLabelText("Settings user name"), {
      target: { value: "Dora User" },
    });
    fireEvent.change(screen.getByLabelText("Settings API key"), {
      target: { value: "secret-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存设置" }));

    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith("save_settings", {
        settings: {
          userName: "Dora User",
          theme: "auto",
          provider: "claude",
          apiKey: "secret-key",
          baseUrl: "https://api.anthropic.com",
          companionMode: "default",
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByText("本地设置覆盖")).toBeInTheDocument();
      expect(screen.getByText("设置已保存")).toBeInTheDocument();
    });
  });

  it("shows save error when saving fails", async () => {
    mockedInvoke.mockResolvedValueOnce({
      userName: "",
      theme: "auto",
      provider: "claude",
      apiKey: "",
      baseUrl: "https://api.anthropic.com",
      companionMode: "default",
    });
    mockedInvoke.mockResolvedValueOnce({ source: "missing", hasApiKey: false });
    mockedInvoke.mockRejectedValueOnce(new Error("permission denied"));

    render(<SettingsPanel onClose={() => {}} />);

    fireEvent.click(await screen.findByRole("button", { name: "保存设置" }));

    await waitFor(() => {
      expect(screen.getByText("permission denied")).toBeInTheDocument();
    });
  });

  it("tests the current unsaved api key and base url", async () => {
    mockedInvoke.mockResolvedValueOnce({
      userName: "",
      theme: "auto",
      provider: "claude",
      apiKey: "saved-key",
      baseUrl: "https://api.anthropic.com",
    });
    mockedInvoke.mockResolvedValueOnce({ source: "env", hasApiKey: true });
    mockedInvoke.mockResolvedValueOnce({
      success: true,
      source: "local",
      message: "API Key 可用",
    });

    render(<SettingsPanel onClose={() => {}} />);

    fireEvent.change(await screen.findByLabelText("Settings API key"), {
      target: { value: "draft-key" },
    });
    fireEvent.change(screen.getByLabelText("Settings base URL"), {
      target: { value: "https://code2ai.codes" },
    });
    fireEvent.click(screen.getByRole("button", { name: "测试 API Key" }));

    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith("test_api_key", {
        apiKey: "draft-key",
        baseUrl: "https://code2ai.codes",
      });
      expect(screen.getByText("测试成功（本地设置覆盖）")).toBeInTheDocument();
    });
  });

  it("shows api key test error", async () => {
    mockedInvoke.mockResolvedValueOnce({
      userName: "",
      theme: "auto",
      provider: "claude",
      apiKey: "",
      baseUrl: "https://api.anthropic.com",
      companionMode: "default",
    });
    mockedInvoke.mockResolvedValueOnce({ source: "local", hasApiKey: true });
    mockedInvoke.mockResolvedValueOnce({
      success: false,
      source: "local",
      message: "anthropic request failed: 401 Unauthorized",
    });

    render(<SettingsPanel onClose={() => {}} />);

    fireEvent.click(await screen.findByRole("button", { name: "测试 API Key" }));

    await waitFor(() => {
      expect(screen.getByText("anthropic request failed: 401 Unauthorized（本地设置覆盖）")).toBeInTheDocument();
    });
  });

  it("shows api key test invoke error", async () => {
    mockedInvoke.mockResolvedValueOnce({
      userName: "",
      theme: "auto",
      provider: "claude",
      apiKey: "",
      baseUrl: "https://api.anthropic.com",
      companionMode: "default",
    });
    mockedInvoke.mockResolvedValueOnce({ source: "missing", hasApiKey: false });
    mockedInvoke.mockRejectedValueOnce(new Error("network down"));

    render(<SettingsPanel onClose={() => {}} />);

    fireEvent.click(await screen.findByRole("button", { name: "测试 API Key" }));

    await waitFor(() => {
      expect(screen.getByText("network down")).toBeInTheDocument();
    });
  });

  it("shows testing state while validating api key", async () => {
    mockedInvoke.mockResolvedValueOnce({
      userName: "",
      theme: "auto",
      provider: "claude",
      apiKey: "",
      baseUrl: "https://api.anthropic.com",
      companionMode: "default",
    });
    mockedInvoke.mockResolvedValueOnce({ source: "env", hasApiKey: true });

    let resolveTest: ((value: { success: boolean; source: string; message: string }) => void) | undefined;
    mockedInvoke.mockImplementationOnce(
      (_command: string) =>
        new Promise((resolve) => {
          resolveTest = resolve as typeof resolveTest;
        }),
    );

    render(<SettingsPanel onClose={() => {}} />);

    fireEvent.click(await screen.findByRole("button", { name: "测试 API Key" }));

    expect(screen.getByText("正在测试 API Key...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "测试中..." })).toBeDisabled();

    resolveTest?.({ success: true, source: "env", message: "API Key 可用" });

    await waitFor(() => {
      expect(screen.getByText("测试成功（环境变量）")).toBeInTheDocument();
    });
  });

  it("separates test message from save message", async () => {
    mockedInvoke.mockResolvedValueOnce({
      userName: "",
      theme: "auto",
      provider: "claude",
      apiKey: "",
      baseUrl: "https://api.anthropic.com",
      companionMode: "default",
    });
    mockedInvoke.mockResolvedValueOnce({ source: "env", hasApiKey: true });
    mockedInvoke.mockResolvedValueOnce(null);
    mockedInvoke.mockResolvedValueOnce({ source: "local", hasApiKey: true });
    mockedInvoke.mockResolvedValueOnce({
      success: true,
      source: "local",
      message: "API Key 可用",
    });

    render(<SettingsPanel onClose={() => {}} />);

    fireEvent.change(await screen.findByLabelText("Settings API key"), {
      target: { value: "secret-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "保存设置" }));

    await waitFor(() => {
      expect(screen.getByText("设置已保存")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "测试 API Key" }));

    await waitFor(() => {
      expect(screen.getByText("测试成功（本地设置覆盖）")).toBeInTheDocument();
    });
  });

  it("invokes clear chat history", async () => {
    mockedInvoke.mockResolvedValueOnce({
      userName: "",
      theme: "auto",
      provider: "claude",
      apiKey: "",
      baseUrl: "https://api.anthropic.com",
      companionMode: "default",
    });
    mockedInvoke.mockResolvedValueOnce({ source: "missing", hasApiKey: false });
    mockedInvoke.mockResolvedValueOnce(null);

    render(<SettingsPanel onClose={() => {}} />);

    fireEvent.click(await screen.findByRole("button", { name: "清空聊天记录" }));

    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith("clear_chat_history");
    });
  });

  it("invokes clear chat history", async () => {
    mockedInvoke.mockResolvedValueOnce({
      userName: "",
      theme: "auto",
      provider: "claude",
      apiKey: "",
      baseUrl: "https://api.anthropic.com",
      companionMode: "default",
    });
    mockedInvoke.mockResolvedValueOnce({ source: "missing", hasApiKey: false });
    mockedInvoke.mockResolvedValueOnce(null);

    render(<SettingsPanel onClose={() => {}} />);

    fireEvent.click(await screen.findByRole("button", { name: "清空聊天记录" }));

    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith("clear_chat_history");
    });
  });

  it("calls onClose when close button is clicked", async () => {
    mockedInvoke.mockResolvedValueOnce({
      userName: "",
      theme: "auto",
      provider: "claude",
      apiKey: "",
      baseUrl: "https://api.anthropic.com",
      companionMode: "default",
    });
    mockedInvoke.mockResolvedValueOnce({ source: "missing", hasApiKey: false });

    const onClose = vi.fn();
    render(<SettingsPanel onClose={onClose} />);

    fireEvent.click(await screen.findByLabelText("Close Dora settings"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
