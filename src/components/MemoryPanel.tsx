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

    setMemoryItems((prev) => sortMemoryItems([item, ...prev]));
    setNewMemoryInput("");
  };

  const sortMemoryItems = (items: CompanionMemoryItem[]) =>
    [...items].sort((left, right) => Number(right.isPinned) - Number(left.isPinned));

  const togglePinned = async (id: string, isPinned: boolean) => {
    try {
      await invoke("toggle_companion_memory_pin", { id, isPinned });
    } catch {
      // Keep UI deterministic even if backend fails.
    }

    setMemoryItems((prev) =>
      sortMemoryItems(
        prev.map((item) => (item.id === id ? { ...item, isPinned } : item)),
      ),
    );
  };

  const deleteMemoryItem = async (id: string) => {
    try {
      await invoke("delete_companion_memory_item", { id });
    } catch {
      // Keep UI deterministic even if backend fails.
    }

    setMemoryItems((prev) => sortMemoryItems(prev.filter((item) => item.id !== id)));
  };

  return (
    <div className="absolute inset-0 z-40 flex items-stretch justify-center bg-slate-900/10">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex min-h-[72px] items-center justify-between border-b border-violet-100 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 px-6 py-4 text-white shadow-sm">
          <div>
            <h2 className="font-semibold">记忆</h2>
            <p className="text-xs text-white/75">管理 Dora 会长期参考的信息</p>
          </div>
          <button
            type="button"
            aria-label="Close Dora memory"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/14 text-sm text-white backdrop-blur-sm transition-all hover:bg-white/24"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto bg-slate-50 p-6">
          <section className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-5 shadow-sm">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">新增记忆</h3>
                <p className="mt-1 text-xs leading-5 text-slate-500">放长期偏好、身份背景或近期重要状态。这里不是聊天记录，也不是便签。</p>
              </div>
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-violet-500 shadow-sm">
                长期参考
              </span>
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
                placeholder="比如：我喜欢直接一点的表达"
                className="flex-1 rounded-2xl border border-white bg-white/95 px-4 py-3 text-sm text-slate-700 shadow-sm outline-none ring-1 ring-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-violet-200"
              />
              <button
                type="button"
                aria-label="Add companion memory"
                onClick={() => void addMemoryItem()}
                disabled={!newMemoryInput.trim()}
                className="rounded-2xl bg-slate-800 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-white/80"
              >
                保存
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">记忆列表</h3>
                <p className="mt-1 text-xs text-slate-400">这些内容会被 Dora 当作长期参考。</p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
                {memoryItems.length} 条
              </span>
            </div>

            {isLoading ? (
              <p className="text-sm text-slate-400">加载中...</p>
            ) : memoryItems.length > 0 ? (
              <div className="space-y-3">
                {memoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/90 px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:bg-white hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {item.isPinned ? (
                            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-600">
                              置顶
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                              普通
                            </span>
                          )}
                          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-300">
                            memory
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm leading-6 text-slate-700">{item.content}</p>
                        <p className="mt-0.5 text-[11px] text-slate-400">
                          来源：{item.source === "memo" ? "便签" : item.source === "profile" ? "资料" : "手动添加"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 self-start">
                        <button
                          type="button"
                          aria-label={`${item.isPinned ? "Unpin" : "Pin"} companion memory ${item.content}`}
                          onClick={() => void togglePinned(item.id, !item.isPinned)}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
                            item.isPinned
                              ? "bg-violet-100 text-violet-600 hover:bg-violet-200"
                              : "bg-white text-slate-400 shadow-sm hover:text-violet-500"
                          }`}
                        >
                          {item.isPinned ? "取消置顶" : "置顶"}
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete companion memory ${item.content}`}
                          onClick={() => void deleteMemoryItem(item.id)}
                          className="rounded-full px-2 py-1 text-[11px] font-medium text-slate-400 transition hover:bg-white hover:text-rose-500"
                        >
                          删除
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                <p className="text-sm text-slate-400">还没有记忆内容，先添加一条吧。</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
