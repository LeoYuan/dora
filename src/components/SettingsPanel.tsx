import { useEffect, useState } from "react";
import { Select } from "antd";
import { invoke } from "../lib/tauri";
import type { Settings, SettingsStatus } from "../types/settings";

const SETTINGS_SELECT_OPTIONS = {
  theme: [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "auto", label: "Auto" },
  ],
  provider: [{ value: "claude", label: "Claude" }],
};

const SHARED_SELECT_PROPS = {
  variant: "filled" as const,
  popupMatchSelectWidth: true,
  className: "dora-ant-select w-full",
  classNames: {
    popup: {
      root: "dora-ant-select-dropdown",
    },
  },
};

const BUTTON_BASE_CLASS =
  "rounded-xl px-4 py-2 text-sm font-normal shadow-sm transition disabled:cursor-not-allowed";
const PRIMARY_BUTTON_CLASS =
  `${BUTTON_BASE_CLASS} dora-primary-button bg-slate-600 text-white hover:bg-slate-500 disabled:opacity-55`;
const SECONDARY_BUTTON_CLASS =
  `${BUTTON_BASE_CLASS} border border-slate-300 bg-white text-slate-400 hover:border-slate-400 hover:bg-slate-100 disabled:opacity-50`;
const SUBTLE_BUTTON_CLASS =
  `${BUTTON_BASE_CLASS} dora-subtle-button border border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:bg-slate-50`;

interface ApiKeyTestResult {
  success: boolean;
  source: SettingsStatus["source"];
  message: string;
}

interface SettingsPanelProps {
  onClose: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  userName: "",
  theme: "auto",
  provider: "claude",
  apiKey: "",
  baseUrl: "https://api.anthropic.com",
  companionMode: "default",
};

const DEFAULT_STATUS: SettingsStatus = {
  source: "missing",
  hasApiKey: false,
};

const SOURCE_LABELS: Record<SettingsStatus["source"], string> = {
  env: "环境变量",
  local: "本地设置覆盖",
  missing: "未配置",
};

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [status, setStatus] = useState<SettingsStatus>(DEFAULT_STATUS);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const getErrorMessage = (error: unknown) => {
    if (typeof error === "string" && error.trim()) return error;
    if (error instanceof Error && error.message.trim()) return error.message;
    return "保存失败，请稍后重试。";
  };

  useEffect(() => {
    void loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [loadedSettings, loadedStatus] = await Promise.all([
        invoke<Settings>("get_settings"),
        invoke<SettingsStatus>("get_settings_status"),
      ]);
      setSettings(loadedSettings);
      setStatus(loadedStatus);
    } catch {
      setSettings(DEFAULT_SETTINGS);
      setStatus(DEFAULT_STATUS);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      await invoke("save_settings", { settings });
      const loadedStatus = await invoke<SettingsStatus>("get_settings_status");
      setStatus(loadedStatus);
      setSaveMessage("设置已保存");
    } catch (error) {
      setSaveError(getErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestApiKey = async () => {
    setIsTesting(true);
    setTestMessage(null);
    setTestError(null);

    try {
      const result = await invoke<ApiKeyTestResult>("test_api_key", {
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl,
      });
      if (result.success) {
        setTestMessage(`测试成功（${SOURCE_LABELS[result.source]}）`);
      } else {
        setTestError(`${result.message}（${SOURCE_LABELS[result.source]}）`);
      }
    } catch (error) {
      setTestError(getErrorMessage(error));
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearChatHistory = async () => {
    await invoke("clear_chat_history");
  };

  return (
    <div className="absolute inset-0 z-40 flex items-stretch justify-center bg-slate-900/10">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex min-h-[72px] items-center justify-between bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 text-white">
          <div>
            <h2 className="font-semibold">设置</h2>
            <p className="text-xs text-white/70">管理 Dora 的基础配置</p>
          </div>
          <button
            type="button"
            aria-label="Close Dora settings"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/14 text-sm text-white backdrop-blur-sm transition-all hover:bg-white/24"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto bg-slate-50 p-6">
          <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-normal text-slate-500" htmlFor="settings-user-name">
                用户名
              </label>
              <input
                id="settings-user-name"
                aria-label="Settings user name"
                value={settings.userName}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    userName: event.target.value,
                  }))
                }
                className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-normal text-slate-500" htmlFor="settings-theme">
                主题
              </label>
              <Select
                aria-label="Settings theme"
                value={settings.theme}
                onChange={(value) =>
                  setSettings((current) => ({
                    ...current,
                    theme: value as Settings["theme"],
                  }))
                }
                options={SETTINGS_SELECT_OPTIONS.theme}
                {...SHARED_SELECT_PROPS}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-normal text-slate-500" htmlFor="settings-provider">
                API Provider
              </label>
              <Select
                aria-label="Settings provider"
                value={settings.provider}
                onChange={(value) =>
                  setSettings((current) => ({
                    ...current,
                    provider: value as Settings["provider"],
                  }))
                }
                options={SETTINGS_SELECT_OPTIONS.provider}
                {...SHARED_SELECT_PROPS}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-normal text-slate-500" htmlFor="settings-api-key">
                API Key
              </label>
              <input
                id="settings-api-key"
                aria-label="Settings API key"
                type="password"
                value={settings.apiKey}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    apiKey: event.target.value,
                  }))
                }
                className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-normal text-slate-500" htmlFor="settings-base-url">
                Base URL
              </label>
              <input
                id="settings-base-url"
                aria-label="Settings base URL"
                value={settings.baseUrl}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    baseUrl: event.target.value,
                  }))
                }
                className="h-12 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
              />
            </div>

            <p className="text-xs text-slate-400">
              当前兼容 Anthropic Messages API，可填写例如 https://code2ai.codes
            </p>
          </section>

          <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h3 className="text-sm font-normal text-slate-400">陪伴设置</h3>
              <p className="mt-2 text-xs text-slate-300">调整 Dora 和你互动时的默认风格。</p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-normal text-slate-400" htmlFor="settings-companion-mode">
                陪伴模式
              </label>
              <div className="mb-2">
                <Select
                  aria-label="Settings companion mode"
                  value={settings.companionMode}
                  onChange={(value) =>
                    setSettings((current) => ({
                      ...current,
                      companionMode: value as Settings["companionMode"],
                    }))
                  }
                  options={[
                    { value: "default", label: "默认陪伴" },
                    { value: "supportive", label: "温柔支持" },
                    { value: "focused", label: "专注搭子" },
                  ]}
                  {...SHARED_SELECT_PROPS}
                />
              </div>

              <p className="text-xs text-slate-400">
                {settings.companionMode === "default"
                  ? "自然、平衡，适合日常聊天和大多数场景。"
                  : settings.companionMode === "supportive"
                    ? "更温柔、更安抚，情绪回应和鼓励感会更强。"
                    : "更直接、更聚焦，适合推进任务和减少情绪化表达。"}
              </p>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-normal text-slate-500">当前配置来源</p>
            <p className="mt-2 text-sm text-slate-400">{SOURCE_LABELS[status.source]}</p>
            <p className="mt-1 text-xs text-slate-400">
              {status.hasApiKey ? "已检测到可用 API Key" : "当前没有可用 API Key"}
            </p>
            {isSaving ? (
              <p className="mt-3 text-xs text-slate-500">正在保存设置...</p>
            ) : null}
            {saveMessage ? (
              <p className="mt-3 text-xs font-medium text-emerald-600">{saveMessage}</p>
            ) : null}
            {saveError ? <p className="mt-3 text-xs font-medium text-rose-500">{saveError}</p> : null}
            {isTesting ? <p className="mt-3 text-xs text-slate-500">正在测试 API Key...</p> : null}
            {testMessage ? <p className="mt-3 text-xs font-medium text-emerald-600">{testMessage}</p> : null}
            {testError ? <p className="mt-3 text-xs font-medium text-rose-500">{testError}</p> : null}
          </section>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/80 px-6 py-4 backdrop-blur-sm">
          <button
            type="button"
            onClick={() => void handleClearChatHistory()}
            className={SUBTLE_BUTTON_CLASS}
          >
            清空聊天记录
          </button>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => void handleTestApiKey()}
              disabled={isTesting}
              className={SECONDARY_BUTTON_CLASS}
            >
              {isTesting ? "测试中..." : "测试 API Key"}
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className={PRIMARY_BUTTON_CLASS}
            >
              {isSaving ? "保存中..." : "保存设置"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
