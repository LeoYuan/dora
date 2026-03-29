import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { SettingsPanel } from "../SettingsPanel";

vi.mock("@tauri-apps/api/core", () => ({
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
    });
    mockedInvoke.mockResolvedValueOnce({ source: "missing", hasApiKey: false });

    render(<SettingsPanel onClose={() => {}} />);

    expect(await screen.findByLabelText("Settings user name")).toHaveValue("Leo");
    expect(screen.getByLabelText("Settings theme")).toBeInTheDocument();
    expect(screen.getByLabelText("Settings provider")).toBeInTheDocument();
    expect(screen.getByLabelText("Settings API key")).toBeInTheDocument();
  });

  it("shows settings source status text", async () => {
    mockedInvoke.mockResolvedValueOnce({
      userName: "",
      theme: "auto",
      provider: "claude",
      apiKey: "",
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
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByText("本地设置覆盖")).toBeInTheDocument();
    });
  });

  it("invokes clear chat history", async () => {
    mockedInvoke.mockResolvedValueOnce({
      userName: "",
      theme: "auto",
      provider: "claude",
      apiKey: "",
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
    });
    mockedInvoke.mockResolvedValueOnce({ source: "missing", hasApiKey: false });

    const onClose = vi.fn();
    render(<SettingsPanel onClose={onClose} />);

    fireEvent.click(await screen.findByLabelText("Close Dora settings"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
