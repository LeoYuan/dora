import { useEffect, useRef, useState } from "react";
import { invoke } from "../lib/tauri";
import type { ChatMessage } from "../types/chat";

interface ChatWindowProps {
  onClose: () => void;
}

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "你好呀！我是 Dora，你的桌面小伙伴～有什么我可以帮你的吗？",
  timestamp: new Date().toISOString(),
  source: "fallback",
  debugError: null,
};

export function ChatWindow({ onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadHistory = async () => {
    try {
      const history = await invoke<ChatMessage[]>("get_chat_history");
      setMessages(history.length > 0 ? history : [WELCOME_MESSAGE]);
    } catch {
      setMessages([WELCOME_MESSAGE]);
    }
  };

  const clearHistory = async () => {
    try {
      await invoke("clear_chat_history");
    } catch {
      // Keep UI deterministic even if backend fails.
    }

    setMessages([
      {
        ...WELCOME_MESSAGE,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  const appendAssistantMessage = (message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  };

  const appendFallbackMessage = (debugError?: string | null) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-assistant-error`,
        role: "assistant",
        content: "哎呀，我有点小迷糊，能再说一遍吗？",
        timestamp: new Date().toISOString(),
        source: "fallback",
        debugError: debugError ?? null,
      },
    ]);
  };

  const getErrorMessage = (error: unknown) => {
    if (typeof error === "string" && error.trim()) return error;
    if (error instanceof Error && error.message.trim()) return error.message;
    return "Claude 请求失败，已回退到本地回复。";
  };

  const normalizeAssistantReply = (response: string | ChatMessage): ChatMessage => {
    if (typeof response === "string") {
      return {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
        source: "claude",
        debugError: null,
      };
    }

    return {
      id: response.id || `${Date.now()}-assistant`,
      role: "assistant",
      content: response.content,
      timestamp: response.timestamp || new Date().toISOString(),
      source: response.source ?? "claude",
      debugError: response.debugError ?? null,
    };
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || isLoading) return;

    const history = messages.slice(-10);
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await invoke<string | ChatMessage>("chat", {
        message: content,
        history,
      });

      appendAssistantMessage(normalizeAssistantReply(response));
    } catch (error) {
      appendFallbackMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const canClearHistory = messages.some((message) => message.id !== "welcome");

  return (
    <div className="absolute inset-0 z-40 flex items-stretch justify-center bg-slate-900/10">
      <div className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#00A0E9] to-[#0080C0] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white">
              <span className="text-2xl">🐱</span>
            </div>
            <div>
              <h2 className="font-semibold text-white">Dora</h2>
              <p className="text-xs text-white/70">你的桌面小伙伴</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close Dora chat"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  message.role === "user"
                    ? "rounded-br-md bg-[#00A0E9] text-white"
                    : "rounded-bl-md bg-gray-100 text-gray-800"
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                {message.role === "assistant" && message.debugError ? (
                  <p className="mt-1 text-[11px] opacity-60">{message.debugError}</p>
                ) : null}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400" />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <span className="ml-1 text-xs text-gray-500">正在思考...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-100 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs text-gray-400">最近一次会话会自动保存</p>
            <button
              type="button"
              aria-label="Clear Dora chat history"
              onClick={() => void clearHistory()}
              disabled={!canClearHistory}
              className="text-xs font-medium text-slate-500 transition hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              清空聊天
            </button>
          </div>
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              aria-label="Dora chat input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="想和我说点什么..."
              className="max-h-32 flex-1 resize-none rounded-2xl bg-gray-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#00A0E9]/30"
              rows={1}
              disabled={isLoading}
            />
            <button
              type="button"
              aria-label="Send Dora message"
              onClick={() => void handleSend()}
              disabled={!input.trim() || isLoading}
              className="rounded-2xl bg-[#00A0E9] px-6 py-3 font-medium text-white transition-colors hover:bg-[#0080C0] disabled:cursor-not-allowed disabled:opacity-50"
            >
              发送
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-gray-400">
            按 Enter 发送，Shift + Enter 换行
          </p>
        </div>
      </div>
    </div>
  );
}
