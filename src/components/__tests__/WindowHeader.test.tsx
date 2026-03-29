import { render, screen } from "@testing-library/react";
import { WindowHeader } from "../WindowHeader";

describe("WindowHeader", () => {
  it("renders the app title in a native-titlebar spacer", () => {
    render(<WindowHeader />);

    expect(screen.getByText("Dora")).toBeInTheDocument();
    expect(screen.getByText("桌面陪伴助手")).toBeInTheDocument();
    expect(screen.queryByLabelText("Minimize window")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Toggle maximize window")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Close window")).not.toBeInTheDocument();
  });
});
