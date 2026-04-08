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
  const [activeTab, setActiveTab] = useState<"all" | "pinned">("all");

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    });
  };

  const pinnedItems = memoryItems.filter((item) => item.isPinned);
  const displayItems = activeTab === "pinned" ? pinnedItems : memoryItems;

  return (
    <div className="absolute inset-0 z-40 flex items-stretch justify-center bg-slate-900/10">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        {/* Header */}
        <div className="flex min-h-[72px] items-center justify-between bg-gradient-to-r from-violet-500 to-fuchsia-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <span className="text-xl">🧠</span>
            </div>
            <div>
              <h2 className="font-semibold text-white">记忆</h2>
              <p className="text-xs text-white/70">Dora 会长期记住这些信息</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close Dora memory"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm text-white backdrop-blur-sm transition-all hover:bg-white/20"
          >
            ✕
          </button>
        </div>

        {/* Add Memory Section */}
        <div className="border-b border-slate-100 bg-gradient-to-b from-violet-50/50 to-white px-6 py-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-sm">+</span>
            <span className="text-sm font-normal text-slate-400">添加新记忆</span>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={newMemoryInput}
              onChange={(e) => setNewMemoryInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void addMemoryItem();
                }
              }}
              placeholder="例如：我喜欢简洁直接的表达方式..."
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-400 shadow-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
            />
            <button
              type="button"
              onClick={() => void addMemoryItem()}
              disabled={!newMemoryInput.trim()}
              className="rounded-xl bg-violet-500 px-5 py-3 text-sm font-medium text-white shadow-md shadow-violet-200 transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
            >
              添加
            </button>
          </div>
          <p className="mt-4 text-xs text-slate-300">
            记忆会被 Dora 长期保存，在对话中作为背景知识参考
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-100 px-6 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`relative px-4 py-2 text-[13px] font-normal transition ${
              activeTab === "all"
                ? "text-violet-500"
                : "text-slate-300 hover:text-slate-400"
            }`}
          >
            全部记忆
            <span className="ml-1.5 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-300">
              {memoryItems.length}
            </span>
            {activeTab === "all" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-violet-500" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pinned")}
            className={`relative px-4 py-2 text-[13px] font-normal transition ${
              activeTab === "pinned"
                ? "text-violet-500"
                : "text-slate-300 hover:text-slate-400"
            }`}
          >
            置顶
            <span className="ml-1.5 rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] text-violet-300">
              {pinnedItems.length}
            </span>
            {activeTab === "pinned" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-violet-500" />
            )}
          </button>
        </div>

        {/* Memory List */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-500" />
            </div>
          ) : displayItems.length > 0 ? (
            <div className="space-y-3">
              {displayItems.map((item) => (
                <div
                  key={item.id}
                  className={`group relative rounded-xl border bg-white p-4 shadow-sm transition hover:shadow-md ${
                    item.isPinned
                      ? "border-violet-200 bg-gradient-to-r from-violet-50/50 to-white"
                      : "border-slate-200"
                  }`}
                >
                  {/* Pin Icon */}
                  {item.isPinned && (
                    <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-violet-500 text-xs text-white shadow-md">
                      📌
                    </div>
                  )}

                  {/* Content */}
                  <div className="mb-3">
                    <p className="text-sm leading-relaxed text-slate-500">
                      {item.content}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400">
                        {formatDate(item.createdAt)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                          item.source === "user"
                            ? "bg-blue-50 text-blue-600"
                            : item.source === "memo"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-purple-50 text-purple-600"
                        }`}
                      >
                        {item.source === "user"
                          ? "手动添加"
                          : item.source === "memo"
                          ? "便签"
                          : "资料"}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => void togglePinned(item.id, !item.isPinned)}
                        className={`rounded-lg px-2.5 py-1 text-[10px] font-normal transition ${
                          item.isPinned
                            ? "text-violet-300 hover:bg-violet-50 hover:text-violet-400"
                            : "text-slate-200 hover:bg-slate-100 hover:text-slate-300"
                        }`}
                      >
                        {item.isPinned ? "取消置顶" : "置顶"}
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteMemoryItem(item.id)}
                        className="rounded-lg px-2.5 py-1 text-[10px] font-normal text-slate-200 transition hover:bg-rose-50 hover:text-rose-300"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
              <span className="mb-2 text-3xl opacity-50">📝</span>
              <p className="text-sm text-slate-400">
                {activeTab === "pinned" ? "还没有置顶的记忆" : "还没有记忆内容"}
              </p>
              <p className="mt-1 text-xs text-slate-300">
                {activeTab === "pinned"
                  ? "在全部记忆中置顶一条吧"
                  : "添加一条记忆，让 Dora 更了解你"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
