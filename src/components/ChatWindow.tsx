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

  return (
    <div className="absolute inset-0 z-40 flex items-stretch justify-center bg-slate-900/10">
      <div className="flex h-full w-full max-w-xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex min-h-[72px] items-center justify-between bg-gradient-to-r from-[#00A0E9] to-[#0080C0] px-6 py-4">
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
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/14 text-sm text-white backdrop-blur-sm transition-all hover:bg-white/24"
          >
            ✕
          </button>
        </div>

        <div className="dora-chat-scroll flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`dora-chat-bubble max-w-[82%] px-4 py-2.5 ${
                  message.role === "user"
                    ? "dora-chat-bubble-user bg-[#00A0E9] text-white"
                    : "dora-chat-bubble-assistant bg-slate-200 text-slate-800"
                }`}
              >
                <p className="m-0 whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                {message.role === "assistant" && message.debugError ? (
                  <p className="mt-2 text-[11px] leading-5 opacity-60">{message.debugError}</p>
                ) : null}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="dora-chat-bubble dora-chat-bubble-assistant bg-slate-200 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                    style={{ animationDelay: "0.2s" }}
                  />
                  <span className="ml-1 text-xs text-slate-500">正在思考...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="dora-chat-composer-wrap border-t border-slate-200/80 bg-white/98 px-4 pb-2 pt-2 backdrop-blur-sm">
          <div className="dora-chat-composer flex items-end gap-3 rounded-[24px] border border-slate-200 bg-white p-2.5 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
            <textarea
              ref={inputRef}
              aria-label="Dora chat input"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="想和我说点什么..."
              className="dora-chat-input max-h-32 flex-1 resize-none border-0 bg-slate-50/90 px-4 py-2.5 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-[#00A0E9]/20"
              rows={1}
              disabled={isLoading}
            />
            <button
              type="button"
              aria-label="Send Dora message"
              onClick={() => void handleSend()}
              disabled={!input.trim() || isLoading}
              className="dora-chat-send rounded-2xl bg-[#00A0E9] px-6 py-2.5 font-medium text-white shadow-[0_10px_24px_rgba(0,160,233,0.24)] transition-all hover:bg-[#0080C0] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
            >
              发送
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
