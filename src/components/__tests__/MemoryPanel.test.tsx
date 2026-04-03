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

    fireEvent.change(await screen.findByLabelText("New companion memory input"), {
      target: { value: "最近在学 Rust" },
    });
    fireEvent.click(screen.getByLabelText("Add companion memory"));

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

    const input = (await screen.findByLabelText("New companion memory input")) as HTMLInputElement;
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

    fireEvent.click(await screen.findByLabelText("Delete companion memory 喜欢喝拿铁"));

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

    fireEvent.click(await screen.findByLabelText("Pin companion memory 每天晨跑"));

    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith("toggle_companion_memory_pin", {
        id: "memory-2",
        isPinned: true,
      });
    });

    const items = screen.getAllByText(/喜欢喝拿铁|每天晨跑/);
    expect(items[0]).toHaveTextContent("每天晨跑");
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

    fireEvent.click(await screen.findByLabelText("Unpin companion memory 喜欢喝拿铁"));

    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith("toggle_companion_memory_pin", {
        id: "memory-1",
        isPinned: false,
      });
    });

    const items = screen.getAllByText(/喜欢喝拿铁|每天晨跑/);
    expect(items[0]).toHaveTextContent("每天晨跑");
  });
});
