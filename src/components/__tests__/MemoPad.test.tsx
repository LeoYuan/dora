import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { invoke } from "@tauri-apps/api/core";
import { MemoPad } from "../MemoPad";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockedInvoke = vi.mocked(invoke);

describe("MemoPad", () => {
  beforeEach(() => {
    mockedInvoke.mockReset();
  });

  it("loads existing memos", async () => {
    mockedInvoke.mockResolvedValueOnce([
      {
        id: "1",
        content: "existing memo",
        color: "yellow",
        position: { x: 0, y: 0 },
        isPinned: false,
        createdAt: new Date().toISOString(),
      },
    ]);

    render(<MemoPad onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("existing memo")).toBeInTheDocument();
    });
  });

  it("shows the empty state when there are no memos", async () => {
    mockedInvoke.mockResolvedValueOnce([]);

    render(<MemoPad onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("还没有便签，创建一个吧！")).toBeInTheDocument();
    });
  });

  it("adds and deletes a memo", async () => {
    mockedInvoke.mockResolvedValueOnce([]);
    mockedInvoke.mockResolvedValueOnce(null);
    mockedInvoke.mockResolvedValueOnce(null);

    render(<MemoPad onClose={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText("还没有便签，创建一个吧！")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("New Dora memo"), {
      target: { value: "buy milk" },
    });
    fireEvent.click(screen.getByLabelText("Add Dora memo"));

    await waitFor(() => {
      expect(screen.getByText("buy milk")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Delete memo buy milk"));

    await waitFor(() => {
      expect(screen.queryByText("buy milk")).not.toBeInTheDocument();
    });
  });

  it("edits an existing memo", async () => {
    mockedInvoke.mockResolvedValueOnce([
      {
        id: "1",
        content: "draft memo",
        color: "yellow",
        position: { x: 0, y: 0 },
        isPinned: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    mockedInvoke.mockResolvedValueOnce(null);

    render(<MemoPad onClose={() => {}} />);

    await screen.findByText("draft memo");
    fireEvent.click(screen.getByLabelText("Edit memo draft memo"));
    fireEvent.change(screen.getByLabelText("Edit memo input 1"), {
      target: { value: "updated memo" },
    });
    fireEvent.click(screen.getByLabelText("Save memo 1"));

    await waitFor(() => {
      expect(screen.getByText("updated memo")).toBeInTheDocument();
    });
  });

  it("filters memos by keyword", async () => {
    mockedInvoke.mockResolvedValueOnce([
      {
        id: "1",
        content: "buy milk",
        color: "yellow",
        position: { x: 0, y: 0 },
        isPinned: false,
        createdAt: new Date().toISOString(),
      },
      {
        id: "2",
        content: "write code",
        color: "blue",
        position: { x: 0, y: 0 },
        isPinned: false,
        createdAt: new Date().toISOString(),
      },
    ]);

    render(<MemoPad onClose={() => {}} />);

    await screen.findByText("buy milk");
    fireEvent.change(screen.getByLabelText("Search Dora memos"), {
      target: { value: "milk" },
    });

    await waitFor(() => {
      expect(screen.getByText("buy milk")).toBeInTheDocument();
      expect(screen.queryByText("write code")).not.toBeInTheDocument();
    });
  });

  it("updates memo position after drag interaction", async () => {
    mockedInvoke.mockResolvedValueOnce([
      {
        id: "1",
        content: "drag me",
        color: "yellow",
        position: { x: 0, y: 0 },
        isPinned: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    mockedInvoke.mockResolvedValueOnce(null);

    render(<MemoPad onClose={() => {}} />);

    const memoCard = await screen.findByLabelText("Memo card 1");
    fireEvent.mouseDown(memoCard, { clientX: 10, clientY: 10 });
    fireEvent.mouseMove(window, { clientX: 90, clientY: 110 });
    fireEvent.mouseUp(window);

    await waitFor(() => {
      expect(mockedInvoke).toHaveBeenCalledWith(
        "update_memo",
        expect.objectContaining({
          memo: expect.objectContaining({
            id: "1",
            position: { x: 80, y: 100 },
          }),
        }),
      );
    });
  });
});
