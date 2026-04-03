import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { invoke } from "../../lib/tauri";
import { MemoryPanel } from "../MemoryPanel";

vi.mock("../../lib/tauri", () => ({
  invoke: vi.fn(),
}));

const mockedInvoke = vi.mocked(invoke);

describe("MemoryPanel", () => {
  beforeEach(() => {
    mockedInvoke.mockReset();
  });

  it("loads existing memory items", async () => {
    mockedInvoke.mockResolvedValueOnce([
      {
        id: "memory-1",
        content: "喜欢喝拿铁",
        source: "user",
        createdAt: new Date().toISOString(),
        isPinned: false,
      },
    ]);

    render(<MemoryPanel onClose={() => {}} />);

    expect(await screen.findByText("喜欢喝拿铁")).toBeInTheDocument();
  });

  it("adds a memory item from the panel", async () => {
    mockedInvoke.mockResolvedValueOnce([]);
    mockedInvoke.mockResolvedValueOnce(null);

    render(<MemoryPanel onClose={() => {}} />);

    const input = screen.getByPlaceholderText(/例如：我喜欢/);
    fireEvent.change(input, {
      target: { value: "最近在学 Rust" },
    });
    fireEvent.click(screen.getByRole("button", { name: "添加" }));

    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith(
        "save_companion_memory_item",
        expect.objectContaining({
          item: expect.objectContaining({
            content: "最近在学 Rust",
            source: "user",
          }),
        }),
      );
    });
    expect(screen.getByText("最近在学 Rust")).toBeInTheDocument();
  });

  it("saves memory with enter key", async () => {
    mockedInvoke.mockResolvedValueOnce([]);
    mockedInvoke.mockResolvedValueOnce(null);

    render(<MemoryPanel onClose={() => {}} />);

    const input = screen.getByPlaceholderText(/例如：我喜欢/);
    fireEvent.change(input, {
      target: { value: "我是独立开发者" },
    });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith(
        "save_companion_memory_item",
        expect.objectContaining({
          item: expect.objectContaining({
            content: "我是独立开发者",
          }),
        }),
      );
    });
  });

  it("deletes a memory item", async () => {
    mockedInvoke.mockResolvedValueOnce([
      {
        id: "memory-1",
        content: "喜欢喝拿铁",
        source: "user",
        createdAt: new Date().toISOString(),
        isPinned: false,
      },
    ]);
    mockedInvoke.mockResolvedValueOnce(null);

    render(<MemoryPanel onClose={() => {}} />);

    await screen.findByText("喜欢喝拿铁");

    // Find delete button by text
    const deleteButtons = screen.getAllByText("删除");
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith("delete_companion_memory_item", {
        id: "memory-1",
      });
      expect(screen.queryByText("喜欢喝拿铁")).not.toBeInTheDocument();
    });
  });

  it("pins a memory item to the top", async () => {
    mockedInvoke.mockResolvedValueOnce([
      {
        id: "memory-1",
        content: "喜欢喝拿铁",
        source: "user",
        createdAt: new Date().toISOString(),
        isPinned: false,
      },
      {
        id: "memory-2",
        content: "每天晨跑",
        source: "user",
        createdAt: new Date().toISOString(),
        isPinned: false,
      },
    ]);
    mockedInvoke.mockResolvedValueOnce(null);

    render(<MemoryPanel onClose={() => {}} />);

    await screen.findByText("每天晨跑");

    // Find pin buttons in memory items (not the tab)
    const pinButtons = screen.getAllByRole("button", { name: "置顶" });
    // Filter to only those in the memory list (exclude tab button)
    const itemPinButtons = pinButtons.filter(btn =>
      btn.className.includes("text-slate-400") || btn.className.includes("text-violet-600")
    );
    fireEvent.click(itemPinButtons[0]);

    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith("toggle_companion_memory_pin", {
        id: "memory-1",
        isPinned: true,
      });
    });
  });

  it("unpinned memory keeps pinned items first", async () => {
    mockedInvoke.mockResolvedValueOnce([
      {
        id: "memory-1",
        content: "喜欢喝拿铁",
        source: "user",
        createdAt: new Date().toISOString(),
        isPinned: true,
      },
      {
        id: "memory-2",
        content: "每天晨跑",
        source: "user",
        createdAt: new Date().toISOString(),
        isPinned: true,
      },
    ]);
    mockedInvoke.mockResolvedValueOnce(null);

    render(<MemoryPanel onClose={() => {}} />);

    await screen.findByText("喜欢喝拿铁");

    // Find unpin buttons
    const unpinButtons = screen.getAllByText("取消置顶");
    fireEvent.click(unpinButtons[0]);

    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith("toggle_companion_memory_pin", {
        id: "memory-1",
        isPinned: false,
      });
    });
  });

  it("switches between all and pinned tabs", async () => {
    mockedInvoke.mockResolvedValueOnce([
      {
        id: "memory-1",
        content: "置顶记忆",
        source: "user",
        createdAt: new Date().toISOString(),
        isPinned: true,
      },
      {
        id: "memory-2",
        content: "普通记忆",
        source: "user",
        createdAt: new Date().toISOString(),
        isPinned: false,
      },
    ]);

    render(<MemoryPanel onClose={() => {}} />);

    await screen.findByText("置顶记忆");
    await screen.findByText("普通记忆");

    // Click pinned tab - use the tab button with the count badge
    const pinnedTab = screen.getByRole("button", { name: /置顶\s*1/ });
    fireEvent.click(pinnedTab);

    // Should only show pinned
    expect(screen.getByText("置顶记忆")).toBeInTheDocument();
    expect(screen.queryByText("普通记忆")).not.toBeInTheDocument();
  });
});
