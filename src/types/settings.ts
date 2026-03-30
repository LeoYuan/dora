export interface Settings {
  userName: string;
  theme: "light" | "dark" | "auto";
  provider: "claude";
  apiKey: string;
  baseUrl: string;
}

export interface SettingsStatus {
  source: "env" | "local" | "missing";
  hasApiKey: boolean;
}
