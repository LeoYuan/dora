import { useState, useCallback } from "react";

interface Card {
  value: number;
  display: string;
  suit: string;
}

interface GameState {
  cards: Card[];
  userInput: string;
  message: string;
  messageType: "info" | "success" | "error";
  score: number;
  attempts: number;
}

const SUITS = ["♠", "♥", "♣", "♦"];
const VALUES = [
  { value: 1, display: "A" },
  { value: 2, display: "2" },
  { value: 3, display: "3" },
  { value: 4, display: "4" },
  { value: 5, display: "5" },
  { value: 6, display: "6" },
  { value: 7, display: "7" },
  { value: 8, display: "8" },
  { value: 9, display: "9" },
  { value: 10, display: "10" },
  { value: 11, display: "J" },
  { value: 12, display: "Q" },
  { value: 13, display: "K" },
];

function generateCards(): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < 4; i++) {
    const valueInfo = VALUES[Math.floor(Math.random() * VALUES.length)];
    const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
    cards.push({
      value: valueInfo.value,
      display: valueInfo.display,
      suit,
    });
  }
  return cards;
}

function evaluateExpression(expr: string): number | null {
  try {
    // Only allow numbers, operators, and parentheses
    if (!/^[\d+\-*/().\s]+$/.test(expr)) {
      return null;
    }
    // eslint-disable-next-line no-eval
    const result = eval(expr);
    if (typeof result !== "number" || !isFinite(result)) {
      return null;
    }
    return result;
  } catch {
    return null;
  }
}

function extractNumbers(expr: string): number[] {
  const matches = expr.match(/\d+/g);
  if (!matches) return [];
  return matches.map((n) => parseInt(n, 10));
}

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort((x, y) => x - y);
  const sortedB = [...b].sort((x, y) => x - y);
  return sortedA.every((val, i) => val === sortedB[i]);
}

export function TwentyFourGame() {
  const [game, setGame] = useState<GameState>(() => ({
    cards: generateCards(),
    userInput: "",
    message: "用 + - * / 和括号，让结果等于 24",
    messageType: "info",
    score: 0,
    attempts: 0,
  }));

  const newGame = useCallback(() => {
    setGame((prev) => ({
      ...prev,
      cards: generateCards(),
      userInput: "",
      message: "用 + - * / 和括号，让结果等于 24",
      messageType: "info",
    }));
  }, []);

  const checkAnswer = useCallback(() => {
    const input = game.userInput.trim();
    if (!input) {
      setGame((prev) => ({
        ...prev,
        message: "请输入算式",
        messageType: "error",
      }));
      return;
    }

    const usedNumbers = extractNumbers(input);
    const cardValues = game.cards.map((c) => c.value);

    if (!arraysEqual(usedNumbers, cardValues)) {
      setGame((prev) => ({
        ...prev,
        message: `必须使用这四个数字: ${game.cards.map((c) => c.display).join(", ")}`,
        messageType: "error",
        attempts: prev.attempts + 1,
      }));
      return;
    }

    const result = evaluateExpression(input);
    if (result === null) {
      setGame((prev) => ({
        ...prev,
        message: "算式格式错误，请检查",
        messageType: "error",
        attempts: prev.attempts + 1,
      }));
      return;
    }

    if (Math.abs(result - 24) < 0.0001) {
      setGame((prev) => ({
        ...prev,
        message: `🎉 正确！${input} = 24`,
        messageType: "success",
        score: prev.score + 1,
        attempts: prev.attempts + 1,
      }));
      // Auto start new game after 2 seconds
      setTimeout(() => {
        newGame();
      }, 2000);
    } else {
      setGame((prev) => ({
        ...prev,
        message: `结果是 ${result.toFixed(2)}，不是 24，再试试`,
        messageType: "error",
        attempts: prev.attempts + 1,
      }));
    }
  }, [game.userInput, game.cards, newGame]);

  const showHint = useCallback(() => {
    setGame((prev) => ({
      ...prev,
      message: "提示：尝试不同的组合，比如 (a + b) * (c - d) 或 a * b + c * d",
      messageType: "info",
    }));
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      checkAnswer();
    }
  };

  const getSuitColor = (suit: string) => {
    return suit === "♥" || suit === "♦" ? "text-red-500" : "text-slate-700";
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">算 24 点</h2>
          <p className="text-sm text-slate-500">
            得分: {game.score} | 尝试: {game.attempts}
          </p>
        </div>
        <button
          type="button"
          onClick={newGame}
          className="rounded-xl bg-sky-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600"
        >
          换一组
        </button>
      </div>

      {/* Game Area */}
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {/* Cards */}
        <div className="flex justify-center gap-3">
          {game.cards.map((card, index) => (
            <div
              key={index}
              className="flex h-20 w-14 flex-col items-center justify-center rounded-xl border-2 border-slate-200 bg-white shadow-sm"
            >
              <span className={`text-lg font-bold ${getSuitColor(card.suit)}`}>
                {card.display}
              </span>
              <span className={`text-xl ${getSuitColor(card.suit)}`}>
                {card.suit}
              </span>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={game.userInput}
              onChange={(e) =>
                setGame((prev) => ({ ...prev, userInput: e.target.value }))
              }
              onKeyDown={handleKeyDown}
              placeholder="输入算式，如: (3 + 5) * (2 + 1)"
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-lg outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={checkAnswer}
              className="flex-1 rounded-xl bg-sky-500 py-3 text-base font-medium text-white transition hover:bg-sky-600"
            >
              提交
            </button>
            <button
              type="button"
              onClick={showHint}
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-base font-medium text-slate-600 transition hover:bg-slate-50"
            >
              提示
            </button>
          </div>
        </div>

        {/* Message */}
        <div
          className={`rounded-xl px-4 py-3 text-center text-sm ${
            game.messageType === "success"
              ? "bg-green-100 text-green-700"
              : game.messageType === "error"
                ? "bg-red-100 text-red-700"
                : "bg-sky-100 text-sky-700"
          }`}
        >
          {game.message}
        </div>

        {/* Rules */}
        <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="mb-2 font-medium">游戏规则:</p>
          <ul className="list-inside list-disc space-y-1">
            <li>使用给出的 4 个数字</li>
            <li>通过 + - * / 和括号运算</li>
            <li>使最终结果等于 24</li>
            <li>每个数字必须且只能用一次</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
