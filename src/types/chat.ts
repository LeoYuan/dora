export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  source?: "claude" | "fallback";
  debugError?: string | null;
}
