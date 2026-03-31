export type CompanionMode = "default" | "supportive" | "focused";

export interface Settings {
  userName: string;
  theme: "light" | "dark" | "auto";
  provider: "claude";
  apiKey: string;
  baseUrl: string;
  companionMode: CompanionMode;
}

export interface SettingsStatus {
  source: "env" | "local" | "missing";
  hasApiKey: boolean;
}
