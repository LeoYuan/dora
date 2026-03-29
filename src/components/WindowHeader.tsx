export function WindowHeader() {
  return (
    <header
      data-tauri-drag-region
      className="flex h-14 items-center justify-center border-b border-slate-200 bg-white px-16 shadow-sm"
    >
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-800">Dora</p>
        <p className="text-xs text-slate-500">桌面陪伴助手</p>
      </div>
    </header>
  );
}
