import { useEffect, useState } from "react";

interface AvatarProps {
  onClick: () => void;
  onMemoClick: () => void;
}

export function Avatar({ onClick, onMemoClick }: AvatarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [blink, setBlink] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 4200);

    return () => clearInterval(blinkInterval);
  }, []);

  useEffect(() => {
    const hintInterval = setInterval(() => {
      if (!isHovered) {
        setShowHint(true);
        setTimeout(() => setShowHint(false), 3000);
      }
    }, 15000);

    return () => clearInterval(hintInterval);
  }, [isHovered]);

  return (
    <div
      className="z-40 flex flex-col items-center gap-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {showHint && (
        <div className="relative mb-2 rounded-2xl bg-white/90 px-3 py-2 text-sm text-gray-700 shadow-lg backdrop-blur-sm">
          和我聊聊吧~
          <div className="absolute -bottom-1 right-8 h-3 w-3 rotate-45 bg-white/90" />
        </div>
      )}

      {isHovered && (
        <div className="mb-2 flex gap-2">
          <button
            type="button"
            aria-label="Open Dora memos"
            onClick={(event) => {
              event.stopPropagation();
              onMemoClick();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 shadow-lg transition-all hover:scale-110 hover:bg-yellow-500"
            title="便签"
          >
            <span className="text-lg">📝</span>
          </button>
        </div>
      )}

      <button
        type="button"
        aria-label="Open Dora chat"
        onClick={onClick}
        className="group relative h-20 w-20 cursor-pointer rounded-full bg-gradient-to-br from-[#00A0E9] to-[#0080C0] shadow-2xl transition-transform duration-300 hover:scale-110"
      >
        <div className="absolute inset-2 rounded-full bg-white">
          <div className="absolute left-3 top-4 flex gap-3">
            <div
              className={`relative h-4 w-3 rounded-full bg-black transition-all duration-100 ${
                blink ? "scale-y-10" : ""
              }`}
            >
              <div className="absolute right-0.5 top-1 h-1 w-1 rounded-full bg-white" />
            </div>
            <div
              className={`relative h-4 w-3 rounded-full bg-black transition-all duration-100 ${
                blink ? "scale-y-10" : ""
              }`}
            >
              <div className="absolute right-0.5 top-1 h-1 w-1 rounded-full bg-white" />
            </div>
          </div>

          <div className="absolute left-1/2 top-7 h-3 w-3 -translate-x-1/2 rounded-full bg-red-500 shadow-sm">
            <div className="absolute left-0.5 top-0.5 h-1 w-1 rounded-full bg-white/50" />
          </div>
          <div className="absolute left-1/2 top-10 h-3 w-6 -translate-x-1/2 rounded-full border-b-2 border-black" />

          <div className="absolute left-1 top-8 h-px w-4 rotate-12 bg-black" />
          <div className="absolute left-1 top-9 h-px w-4 bg-black" />
          <div className="absolute left-1 top-10 h-px w-4 -rotate-12 bg-black" />
          <div className="absolute right-1 top-8 h-px w-4 -rotate-12 bg-black" />
          <div className="absolute right-1 top-9 h-px w-4 bg-black" />
          <div className="absolute right-1 top-10 h-px w-4 rotate-12 bg-black" />
        </div>

        <div className="absolute -bottom-1 left-1/2 h-6 w-6 -translate-x-1/2 rounded-full border-2 border-yellow-600 bg-yellow-400 shadow-md">
          <div className="absolute left-1/2 top-1 h-1 w-4 -translate-x-1/2 rounded-full bg-yellow-600" />
          <div className="absolute left-1/2 top-3 h-2 w-1 -translate-x-1/2 rounded-full bg-black" />
        </div>

        <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 transition-opacity group-hover:opacity-100" />
      </button>
    </div>
  );
}
