import { Avatar } from "./Avatar";
import { invoke } from "../lib/tauri";

export function FloatingWidget() {
  const handleOpenMainWindow = async () => {
    await invoke("show_main_window");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent">
      <div className="rounded-3xl bg-white/70 px-4 py-5 shadow-2xl backdrop-blur-md">
        <Avatar onClick={() => void handleOpenMainWindow()} />
      </div>
    </div>
  );
}
