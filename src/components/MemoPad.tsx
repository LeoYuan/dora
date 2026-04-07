import { useEffect, useRef, useState } from "react";
import { invoke } from "../lib/tauri";
import type { Memo } from "../types/memo";

interface MemoPadProps {
  onClose: () => void;
}

const COLORS = [
  { name: "yellow", bg: "bg-yellow-200", border: "border-yellow-300" },
  { name: "blue", bg: "bg-blue-200", border: "border-blue-300" },
  { name: "green", bg: "bg-green-200", border: "border-green-300" },
  { name: "pink", bg: "bg-pink-200", border: "border-pink-300" },
  { name: "purple", bg: "bg-purple-200", border: "border-purple-300" },
];

export function MemoPad({ onClose }: MemoPadProps) {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const dragStateRef = useRef<{
    memoId: string;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [newMemoContent, setNewMemoContent] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [isLoading, setIsLoading] = useState(true);

  const filteredMemos = memos.filter((memo) =>
    memo.content.toLowerCase().includes(searchQuery.trim().toLowerCase()),
  );

  useEffect(() => {
    void loadMemos();
  }, []);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) return;

      const nextX = event.clientX - dragState.startX + dragState.originX;
      const nextY = event.clientY - dragState.startY + dragState.originY;

      setMemos((prev) =>
        prev.map((memo) =>
          memo.id === dragState.memoId
            ? {
                ...memo,
                position: { x: nextX, y: nextY },
              }
            : memo,
        ),
      );
    };

    const handleMouseUp = () => {
      const dragState = dragStateRef.current;
      if (!dragState) return;

      const draggedMemo = memos.find((memo) => memo.id === dragState.memoId);
      dragStateRef.current = null;

      if (!draggedMemo) return;

      void invoke("update_memo", { memo: draggedMemo });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [memos]);

  const loadMemos = async () => {
    try {
      const loadedMemos = await invoke<Memo[]>("get_memos");
      setMemos(loadedMemos);
    } catch {
      setMemos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createMemo = async () => {
    const content = newMemoContent.trim();
    if (!content) return;

    const newMemo: Memo = {
      id: Date.now().toString(),
      content,
      color: selectedColor.name,
      position: { x: 0, y: 0 },
      isPinned: false,
      createdAt: new Date().toISOString(),
    };

    try {
      await invoke("save_memo", { memo: newMemo });
    } catch {
      // UI fallback is intentionally the same for MVP.
    }

    setMemos((prev) => [newMemo, ...prev]);
    setNewMemoContent("");
  };

  const deleteMemo = async (id: string) => {
    try {
      await invoke("delete_memo", { id });
    } catch {
      // Keep UI behavior deterministic even if backend fails.
    }

    setMemos((prev) => prev.filter((memo) => memo.id !== id));
  };

  const startEditingMemo = (memo: Memo) => {
    setEditingMemoId(memo.id);
    setEditingContent(memo.content);
  };

  const saveEditedMemo = async (memo: Memo) => {
    const content = editingContent.trim();
    if (!content) return;

    const updatedMemo = { ...memo, content };

    try {
      await invoke("update_memo", { memo: updatedMemo });
    } catch {
      // Keep UI behavior deterministic even if backend fails.
    }

    setMemos((prev) =>
      prev.map((current) => (current.id === memo.id ? updatedMemo : current)),
    );
    setEditingMemoId(null);
    setEditingContent("");
  };

  const addMemoToCompanionMemory = async (memo: Memo) => {
    const item = {
      id: `${memo.id}-memory-${Date.now()}`,
      content: memo.content,
      source: "memo" as const,
      createdAt: new Date().toISOString(),
      isPinned: memo.isPinned,
    };

    try {
      await invoke("save_companion_memory_item", { item });
    } catch {
      // Keep UI behavior deterministic even if backend fails.
    }
  };

  const getDeleteButtonLabel = (memo: Memo) => `Delete memo ${memo.content}`;
  const getEditButtonLabel = (memo: Memo) => `Edit memo ${memo.content}`;
  const getAddToMemoryLabel = (memo: Memo) => `Add memo ${memo.content} to companion memory`;
  const getSaveButtonLabel = (memo: Memo) => `Save memo ${memo.id}`;
  const getCancelButtonLabel = (memo: Memo) => `Cancel editing memo ${memo.id}`;
  const getEditInputLabel = (memo: Memo) => `Edit memo input ${memo.id}`;
  const getMemoCardLabel = (memo: Memo) => `Memo card ${memo.id}`;
  const formatMemoDate = (memo: Memo) => new Date(memo.createdAt).toLocaleDateString();
  const canShowActions = (memo: Memo) => editingMemoId !== memo.id;
  const getMemoColorClasses = (memo: Memo) => getColorClasses(memo.color);
  const getMemoTransform = (memo: Memo) => `translate(${memo.position.x}px, ${memo.position.y}px)`;
  const renderMemoContent = (memo: Memo) => memo.content;
  const renderEmptyMemoryMessage = () => "还没有便签，创建一个吧！";
  const getLoadingMessage = () => "加载中...";
  const getFooterMessage = () => "便签会自动保存，随时可以从 Dora 的口袋中找到它们";
  const getAddButtonText = () => "添加";
  const getCancelButtonText = () => "取消";
  const getSaveButtonText = () => "保存";
  const getDeleteButtonText = () => "✕";
  const getEditButtonText = () => "✎";
  const getAddToMemoryButtonText = () => "记住";
  const getMemoPlaceholder = () => "写下你的想法...";
  const getSearchPlaceholder = () => "搜索便签...";
  const getPanelTitle = () => "便签";
  const getPanelSubtitle = () => "快速记录你的想法";
  const getCloseLabel = () => "Close Dora memos";
  const getSearchLabel = () => "Search Dora memos";
  const getNewMemoLabel = () => "New Dora memo";
  const getAddMemoLabel = () => "Add Dora memo";
  const getColorLabel = (colorName: string) => `Select ${colorName} memo color`;

  const getColorClasses = (colorName: string) =>
    COLORS.find((color) => color.name === colorName) ?? COLORS[0];

  const startDraggingMemo = (
    memo: Memo,
    event: React.MouseEvent<HTMLDivElement>,
  ) => {
    if (editingMemoId === memo.id) return;

    dragStateRef.current = {
      memoId: memo.id,
      startX: event.clientX,
      startY: event.clientY,
      originX: memo.position.x,
      originY: memo.position.y,
    };
  };

  return (
    <div className="absolute inset-0 z-40 flex items-stretch justify-center bg-slate-900/10">
      <div className="flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl">
        <div className="flex min-h-[72px] items-center justify-between bg-gradient-to-r from-yellow-400 to-yellow-500 px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <h2 className="font-normal text-gray-500">{getPanelTitle()}</h2>
              <p className="text-xs text-gray-400">{getPanelSubtitle()}</p>
            </div>
          </div>
          <button
            type="button"
            aria-label={getCloseLabel()}
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/50 bg-white/35 text-sm text-gray-800 backdrop-blur-sm transition-all hover:bg-white/65"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-gray-100 bg-gray-50 p-4">
          <div className="mb-3 flex gap-2">
            {COLORS.map((color) => (
              <button
                key={color.name}
                type="button"
                aria-label={getColorLabel(color.name)}
                onClick={() => setSelectedColor(color)}
                className={`h-6 w-6 rounded-full border-2 ${color.bg} ${
                  selectedColor.name === color.name
                    ? `${color.border} ring-2 ring-gray-400 ring-offset-1`
                    : "border-transparent"
                }`}
              />
            ))}
          </div>
          <div className="mb-3">
            <input
              aria-label={getSearchLabel()}
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={getSearchPlaceholder()}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-yellow-400"
            />
          </div>
          <div className="flex gap-2">
            <input
              aria-label={getNewMemoLabel()}
              type="text"
              value={newMemoContent}
              onChange={(event) => setNewMemoContent(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void createMemo();
                }
              }}
              placeholder={getMemoPlaceholder()}
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm outline-none focus:border-yellow-400"
            />
            <button
              type="button"
              aria-label={getAddMemoLabel()}
              onClick={() => void createMemo()}
              disabled={!newMemoContent.trim()}
              className="rounded-xl bg-yellow-400 px-4 py-2 font-normal text-gray-500 transition-colors hover:bg-yellow-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {getAddButtonText()}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              {getLoadingMessage()}
            </div>
          ) : memos.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-gray-400">
              <span className="mb-2 text-4xl">📝</span>
              <p>{renderEmptyMemoryMessage()}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredMemos.map((memo) => {
                const colors = getMemoColorClasses(memo);
                return (
                  <div
                    key={memo.id}
                    aria-label={getMemoCardLabel(memo)}
                    onMouseDown={(event) => startDraggingMemo(memo, event)}
                    style={{
                      transform: getMemoTransform(memo),
                    }}
                    className={`group relative cursor-grab rounded-xl border p-4 transition-transform ${colors.bg} ${colors.border}`}
                  >
                    {editingMemoId === memo.id ? (
                      <div className="space-y-2">
                        <input
                          aria-label={getEditInputLabel(memo)}
                          type="text"
                          value={editingContent}
                          onChange={(event) => setEditingContent(event.target.value)}
                          className="w-full rounded-lg border border-white/70 bg-white/80 px-3 py-2 text-sm outline-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            aria-label={getSaveButtonLabel(memo)}
                            onClick={() => void saveEditedMemo(memo)}
                            className="rounded-lg bg-white/80 px-3 py-1 text-xs font-normal text-gray-500"
                          >
                            {getSaveButtonText()}
                          </button>
                          <button
                            type="button"
                            aria-label={getCancelButtonLabel(memo)}
                            onClick={() => {
                              setEditingMemoId(null);
                              setEditingContent("");
                            }}
                            className="rounded-lg bg-white/60 px-3 py-1 text-xs font-normal text-gray-500"
                          >
                            {getCancelButtonText()}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="break-words whitespace-pre-wrap text-sm text-gray-500">
                        {renderMemoContent(memo)}
                      </p>
                    )}
                    <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {canShowActions(memo) && (
                        <>
                          <button
                            type="button"
                            aria-label={getAddToMemoryLabel(memo)}
                            onClick={() => void addMemoToCompanionMemory(memo)}
                            className="rounded-full bg-white/70 px-2 py-1 text-[11px] font-normal text-gray-400 hover:bg-white"
                          >
                            {getAddToMemoryButtonText()}
                          </button>
                          <button
                            type="button"
                            aria-label={getEditButtonLabel(memo)}
                            onClick={() => startEditingMemo(memo)}
                            className="flex h-6 w-6 items-center justify-center rounded-full bg-white/50 text-gray-400 hover:bg-white/80"
                          >
                            {getEditButtonText()}
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        aria-label={getDeleteButtonLabel(memo)}
                        onClick={() => void deleteMemo(memo.id)}
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-white/50 text-gray-400 hover:bg-white/80"
                      >
                        {getDeleteButtonText()}
                      </button>
                    </div>
                    <span className="absolute bottom-2 right-2 text-xs text-gray-500">
                      {formatMemoDate(memo)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-center">
          <p className="text-xs text-gray-400">
            {getFooterMessage()}
          </p>
        </div>
      </div>
    </div>
  );
}
