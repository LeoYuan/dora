import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import type { Settings, SettingsStatus } from "../types/settings";

interface SettingsPanelProps {
  onClose: () => void;
}

const DEFAULT_SETTINGS: Settings = {
  userName: "",
  theme: "auto",
  provider: "claude",
  apiKey: "",
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
    await invoke("save_settings", { settings });
    const loadedStatus = await invoke<SettingsStatus>("get_settings_status");
    setStatus(loadedStatus);
  };

  const handleClearChatHistory = async () => {
    await invoke("clear_chat_history");
  };

  return (
    <div className="absolute inset-4 z-40 flex items-center justify-center rounded-3xl bg-slate-900/10 p-2">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4 text-white">
          <div>
            <h2 className="font-semibold">设置</h2>
            <p className="text-xs text-white/70">管理 Dora 的基础配置</p>
          </div>
          <button
            type="button"
            aria-label="Close Dora settings"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto bg-slate-50 p-6">
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="settings-user-name">
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
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="settings-theme">
                主题
              </label>
              <select
                id="settings-theme"
                aria-label="Settings theme"
                value={settings.theme}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    theme: event.target.value as Settings["theme"],
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="settings-provider">
                API Provider
              </label>
              <select
                id="settings-provider"
                aria-label="Settings provider"
                value={settings.provider}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    provider: event.target.value as Settings["provider"],
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
              >
                <option value="claude">Claude</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="settings-api-key">
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
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-700">当前配置来源</p>
            <p className="mt-2 text-sm text-slate-500">{SOURCE_LABELS[status.source]}</p>
            <p className="mt-1 text-xs text-slate-400">
              {status.hasApiKey ? "已检测到可用 API Key" : "当前没有可用 API Key"}
            </p>
          </section>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={() => void handleClearChatHistory()}
            className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-medium text-rose-500"
          >
            清空聊天记录
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
}
