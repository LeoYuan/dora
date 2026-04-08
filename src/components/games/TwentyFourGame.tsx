import { useState, useCallback } from "react";

interface Card {
  id: string;
  value: number;
  display: string;
}

interface GameState {
  cards: Card[];
  selectedCardId: string | null;
  selectedOperator: string | null;
  message: string;
  messageType: "info" | "success" | "error";
  score: number;
  level: number;
}

const OPERATORS = [
  { symbol: "+", display: "＋" },
  { symbol: "-", display: "－" },
  { symbol: "*", display: "×" },
  { symbol: "/", display: "÷" },
];

// Check if 4 numbers can make 24 using +, -, *, /
function canMake24(nums: number[]): boolean {
  const EPSILON = 0.0001;

  function solve(values: number[]): boolean {
    if (values.length === 1) {
      return Math.abs(values[0] - 24) < EPSILON;
    }

    for (let i = 0; i < values.length; i++) {
      for (let j = 0; j < values.length; j++) {
        if (i === j) continue;

        const a = values[i];
        const b = values[j];
        const remaining = values.filter((_, idx) => idx !== i && idx !== j);

        // Try all operations
        if (solve([...remaining, a + b])) return true;
        if (solve([...remaining, a - b])) return true;
        if (solve([...remaining, a * b])) return true;
        if (b !== 0 && solve([...remaining, a / b])) return true;
      }
    }
    return false;
  }

  return solve(nums);
}

function generateCards(): Card[] {
  // Generate 4 random numbers 1-13 that can make 24
  let attempts = 0;
  let values: number[] = [];

  do {
    values = [];
    for (let i = 0; i < 4; i++) {
      values.push(Math.floor(Math.random() * 13) + 1);
    }
    attempts++;
  } while (!canMake24(values) && attempts < 100);

  // Fallback to known solvable combinations if random fails
  if (attempts >= 100) {
    const solvableSets = [
      [1, 2, 3, 4],    // (1+3)*(2+4) = 24
      [2, 3, 4, 6],    // (2*4)*(6-3) = 24
      [3, 3, 8, 8],    // 8/(3-8/3) = 24
      [4, 4, 6, 6],    // (4+4)*(6-6/6) = 24
      [1, 5, 5, 5],    // (5-1/5)*5 = 24
      [2, 4, 6, 8],    // (2*6)+(4*8) = 24
      [3, 4, 5, 6],    // (3+5-4)*6 = 24
      [1, 1, 8, 8],    // (1+1)*8+8 = 24
      [2, 2, 4, 6],    // (2+2)*4+6 = 24
      [1, 3, 4, 6],    // 6/(1-3/4) = 24
    ];
    values = solvableSets[Math.floor(Math.random() * solvableSets.length)];
  }

  return values.map((value, i) => ({
    id: `card-${i}`,
    value,
    display: value.toString(),
  }));
}

function calculate(a: number, b: number, operator: string): number | null {
  switch (operator) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "/":
      return b !== 0 ? a / b : null;
    default:
      return null;
  }
}

export function TwentyFourGame() {
  const [game, setGame] = useState<GameState>(() => ({
    cards: generateCards(),
    selectedCardId: null,
    selectedOperator: null,
    message: "选择两个数字和一个运算符",
    messageType: "info",
    score: 0,
    level: 1,
  }));

  const [history, setHistory] = useState<Card[][]>([]);

  const newGame = useCallback(() => {
    const newCards = generateCards();
    setGame({
      cards: newCards,
      selectedCardId: null,
      selectedOperator: null,
      message: "选择两个数字和一个运算符",
      messageType: "info",
      score: game.score,
      level: game.level + 1,
    });
    setHistory([]);
  }, [game.score, game.level]);

  const resetGame = useCallback(() => {
    const newCards = generateCards();
    setGame({
      cards: newCards,
      selectedCardId: null,
      selectedOperator: null,
      message: "选择两个数字和一个运算符",
      messageType: "info",
      score: 0,
      level: 1,
    });
    setHistory([]);
  }, []);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const previousCards = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setGame((prev) => ({
      ...prev,
      cards: previousCards,
      selectedCardId: null,
      selectedOperator: null,
      message: "已撤销",
      messageType: "info",
    }));
  }, [history]);

  const selectCard = useCallback(
    (cardId: string) => {
      const card = game.cards.find((c) => c.id === cardId);
      if (!card) return;

      // If no operator selected, just select the card
      if (!game.selectedOperator) {
        setGame((prev) => ({
          ...prev,
          selectedCardId: cardId,
          message: "选择一个运算符",
          messageType: "info",
        }));
        return;
      }

      // If operator selected but no first card
      if (!game.selectedCardId) {
        setGame((prev) => ({
          ...prev,
          selectedCardId: cardId,
          message: "选择第二个数字",
          messageType: "info",
        }));
        return;
      }

      // If both operator and first card selected, calculate
      const firstCard = game.cards.find((c) => c.id === game.selectedCardId);
      if (!firstCard || firstCard.id === cardId) return;

      const result = calculate(firstCard.value, card.value, game.selectedOperator);
      if (result === null) {
        setGame((prev) => ({
          ...prev,
          message: "计算错误",
          messageType: "error",
          selectedCardId: null,
          selectedOperator: null,
        }));
        return;
      }

      // Save history
      setHistory((prev) => [...prev, game.cards]);

      // Create new card with result
      const newCard: Card = {
        id: `result-${Date.now()}`,
        value: result,
        display: Number.isInteger(result) ? result.toString() : result.toFixed(2),
      };

      // Remove used cards and add result
      const newCards = game.cards
        .filter((c) => c.id !== firstCard.id && c.id !== card.id)
        .concat(newCard);

      // Check win condition
      if (newCards.length === 1) {
        if (Math.abs(newCards[0].value - 24) < 0.0001) {
          setGame((prev) => ({
            ...prev,
            cards: newCards,
            selectedCardId: null,
            selectedOperator: null,
            message: "🎉 恭喜！你算出了 24！",
            messageType: "success",
            score: prev.score + 1,
          }));
          setTimeout(() => {
            newGame();
          }, 2000);
          return;
        } else {
          setGame((prev) => ({
            ...prev,
            cards: newCards,
            selectedCardId: null,
            selectedOperator: null,
            message: `结果是 ${newCards[0].display}，不是 24。点击重玩再试一次`,
            messageType: "error",
          }));
          return;
        }
      }

      setGame((prev) => ({
        ...prev,
        cards: newCards,
        selectedCardId: null,
        selectedOperator: null,
        message: `计算结果: ${newCard.display}，继续！`,
        messageType: "info",
      }));
    },
    [game.cards, game.selectedCardId, game.selectedOperator, newGame]
  );

  const selectOperator = useCallback(
    (operator: string) => {
      if (game.cards.length < 2) return;

      setGame((prev) => ({
        ...prev,
        selectedOperator: operator,
        message: prev.selectedCardId ? "选择第二个数字" : "选择第一个数字",
        messageType: "info",
      }));
    },
    [game.cards.length]
  );

  const showHint = useCallback(() => {
    setGame((prev) => ({
      ...prev,
      message: "提示：尝试 (a + b) × (c - d) 或 a × b + c - d 这样的组合",
      messageType: "info",
    }));
  }, []);

  const isCardSelected = (cardId: string) => game.selectedCardId === cardId;

  return (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold">第 {game.level} 关</h2>
            <p className="text-sm text-slate-400">得分: {game.score}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {history.length > 0 && (
            <button
              type="button"
              onClick={undo}
              className="rounded-xl bg-slate-700 px-4 py-2 text-sm font-medium transition hover:bg-slate-600"
            >
              撤销
            </button>
          )}
          <button
            type="button"
            onClick={resetGame}
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-amber-400"
          >
            重玩
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 overflow-y-auto">
        {/* Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          {game.cards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => selectCard(card.id)}
              disabled={game.cards.length === 1}
              className={`flex h-24 w-24 items-center justify-center rounded-2xl text-4xl font-bold transition-all ${
                isCardSelected(card.id)
                  ? "bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/30 scale-105"
                  : "bg-amber-500 text-white shadow-lg shadow-amber-500/20 hover:bg-amber-400 hover:scale-105"
              } ${game.cards.length === 1 ? "cursor-default" : ""}`}
            >
              {card.display}
            </button>
          ))}
        </div>

        {/* Operators */}
        <div className="flex gap-4">
          {OPERATORS.map((op) => (
            <button
              key={op.symbol}
              type="button"
              onClick={() => selectOperator(op.symbol)}
              disabled={game.cards.length < 2}
              className={`flex h-14 w-14 items-center justify-center rounded-xl text-3xl font-bold transition-all ${
                game.selectedOperator === op.symbol
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/30 scale-110"
                  : "bg-slate-800 text-purple-400 shadow-lg hover:bg-slate-700 hover:scale-105"
              }`}
            >
              {op.display}
            </button>
          ))}
        </div>

        {/* Message */}
        <div
          className={`rounded-xl px-6 py-3 text-center text-sm font-medium ${
            game.messageType === "success"
              ? "bg-green-500/20 text-green-400"
              : game.messageType === "error"
                ? "bg-red-500/20 text-red-400"
                : "bg-slate-800 text-slate-300"
          }`}
        >
          {game.message}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={newGame}
            className="flex flex-col items-center gap-2 rounded-xl bg-slate-800 px-6 py-3 transition hover:bg-slate-700"
          >
            <span className="text-2xl">🎮</span>
            <span className="text-xs text-slate-400">新游戏</span>
          </button>
          <button
            type="button"
            onClick={showHint}
            className="flex flex-col items-center gap-2 rounded-xl bg-slate-800 px-6 py-3 transition hover:bg-slate-700"
          >
            <span className="text-2xl">💡</span>
            <span className="text-xs text-slate-400">提示</span>
          </button>
        </div>
      </div>

      {/* Rules */}
      <div className="border-t border-slate-700 bg-slate-800/50 px-6 py-4 text-center text-xs text-slate-400">
        <p>选择两个数字和一个运算符，逐步计算出 24</p>
      </div>
    </div>
  );
}
