import { useEffect, useState } from "react";
import { invoke } from "../lib/tauri";
import type { CompanionMemoryItem } from "../types/companion";

interface MemoryPanelProps {
  onClose: () => void;
}

export function MemoryPanel({ onClose }: MemoryPanelProps) {
  const [memoryItems, setMemoryItems] = useState<CompanionMemoryItem[]>([]);
  const [newMemoryInput, setNewMemoryInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void loadMemory();
  }, []);

  const loadMemory = async () => {
    try {
      const loadedMemory = await invoke<CompanionMemoryItem[]>("get_companion_memory");
      setMemoryItems(loadedMemory);
    } catch {
      setMemoryItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  const addMemoryItem = async () => {
    const content = newMemoryInput.trim();
    if (!content) return;

    const item: CompanionMemoryItem = {
      id: Date.now().toString(),
      content,
      source: "user",
      createdAt: new Date().toISOString(),
      isPinned: false,
    };

    try {
      await invoke("save_companion_memory_item", { item });
    } catch {
      // Keep UI deterministic even if backend fails.
    }

    setMemoryItems((prev) => [item, ...prev]);
    setNewMemoryInput("");
  };

  const deleteMemoryItem = async (id: string) => {
    try {
      await invoke("delete_companion_memory_item", { id });
    } catch {
      // Keep UI deterministic even if backend fails.
    }

    setMemoryItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="absolute inset-0 z-40 flex items-stretch justify-center bg-slate-900/10">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-4 text-white">
          <div>
            <h2 className="font-semibold">记忆</h2>
            <p className="text-xs text-white/70">管理 Dora 会长期参考的信息</p>
          </div>
          <button
            type="button"
            aria-label="Close Dora memory"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto bg-slate-50 p-6">
          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div>
              <h3 className="text-sm font-medium text-slate-700">新增记忆</h3>
              <p className="mt-1 text-xs text-slate-400">适合放长期偏好、身份背景和近期重要状态，不是聊天记录也不是便签。</p>
            </div>
            <div className="flex gap-2">
              <input
                aria-label="New companion memory input"
                type="text"
                value={newMemoryInput}
                onChange={(event) => setNewMemoryInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void addMemoryItem();
                  }
                }}
                placeholder="例如：我最近在学 Rust，偏好直接一点的表达"
                className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
              />
              <button
                type="button"
                aria-label="Add companion memory"
                onClick={() => void addMemoryItem()}
                disabled={!newMemoryInput.trim()}
                className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-slate-700">记忆列表</h3>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-500">
                {memoryItems.length} 条
              </span>
            </div>

            {isLoading ? (
              <p className="text-sm text-slate-400">加载中...</p>
            ) : memoryItems.length > 0 ? (
              <div className="space-y-2">
                {memoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-3"
                  >
                    <div>
                      <p className="text-sm text-slate-700">{item.content}</p>
                      <p className="mt-1 text-[11px] text-slate-400">
                        来源：{item.source === "memo" ? "便签" : item.source === "profile" ? "资料" : "手动添加"}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`Delete companion memory ${item.content}`}
                      onClick={() => void deleteMemoryItem(item.id)}
                      className="text-xs font-medium text-slate-400 transition hover:text-slate-600"
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">还没有记忆内容，先添加一条吧。</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
