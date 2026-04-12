import { useState, useCallback, useEffect } from "react";

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
  isStarted: boolean;
  isComplete: boolean;
  startTime: number;
  elapsedTime: number;
}

const OPERATORS = [
  { symbol: "+", display: "＋" },
  { symbol: "-", display: "－" },
  { symbol: "*", display: "×" },
  { symbol: "/", display: "÷" },
];

// Check if 4 numbers can make 24 using +, -, *, /
// Division only allowed when result is an integer (no fractions)
function canMake24(nums: number[]): boolean {
  return getSolution(nums) !== null;
}

// Get a solution expression for the given numbers
function getSolution(nums: number[]): string | null {
  function solve(values: number[], exprs: string[]): string | null {
    if (values.length === 1) {
      return Math.abs(values[0] - 24) < 0.0001 ? exprs[0] : null;
    }

    for (let i = 0; i < values.length; i++) {
      for (let j = 0; j < values.length; j++) {
        if (i === j) continue;

        const a = values[i];
        const b = values[j];
        const exprA = exprs[i];
        const exprB = exprs[j];
        const remainingValues = values.filter((_, idx) => idx !== i && idx !== j);
        const remainingExprs = exprs.filter((_, idx) => idx !== i && idx !== j);

        // Addition
        const addResult = solve([...remainingValues, a + b], [...remainingExprs, `(${exprA}+${exprB})`]);
        if (addResult) return addResult;

        // Subtraction (both orders)
        const subResult = solve([...remainingValues, a - b], [...remainingExprs, `(${exprA}-${exprB})`]);
        if (subResult) return subResult;

        // Multiplication
        const mulResult = solve([...remainingValues, a * b], [...remainingExprs, `(${exprA}×${exprB})`]);
        if (mulResult) return mulResult;

        // Division: only allowed when b divides a evenly
        if (b !== 0 && a % b === 0) {
          const divResult = solve([...remainingValues, a / b], [...remainingExprs, `(${exprA}÷${exprB})`]);
          if (divResult) return divResult;
        }
      }
    }
    return null;
  }

  const exprs = nums.map((_, i) => `n${i}`);
  const result = solve(nums, exprs);
  if (!result) return null;

  // Replace n0, n1, n2, n3 with actual numbers
  let solution = result;
  for (let i = 0; i < nums.length; i++) {
    solution = solution.split(`n${i}`).join(nums[i].toString());
  }
  // Remove outermost parentheses if present
  if (solution.startsWith('(') && solution.endsWith(')')) {
    solution = solution.slice(1, -1);
  }
  return solution;
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
  // All solutions use only integer division (a / b where a % b === 0)
  if (attempts >= 100) {
    const solvableSets = [
      [1, 2, 3, 4],    // (1+3)*(2+4) = 24
      [2, 3, 4, 6],    // (2*4)*(6-3) = 24
      [4, 4, 6, 6],    // (4+4)*(6-6/6) = 24, 6/6=1 ✓
      [2, 4, 6, 8],    // (2*6)+(4*8) = 24
      [3, 4, 5, 6],    // (3+5-4)*6 = 24
      [1, 1, 8, 8],    // (1+1)*8+8 = 24
      [2, 2, 4, 6],    // (2+2)*4+6 = 24
      [2, 2, 8, 8],    // (2+2)*8-8 = 24
      [3, 3, 6, 6],    // (3+3)*6/6 = 24, 6/6=1 ✓
      [4, 4, 4, 4],    // 4*4+4+4 = 24
      [2, 3, 4, 4],    // (2+4)*3+4 = 24
      [1, 4, 5, 6],    // (1+5)*4*6/4 = 24, 4/4=1 ✓ or (5-1)*4+6=24
      [2, 5, 5, 8],    // (2+5-5)*8 = 24
      [3, 3, 3, 8],    // (3+3)*3+8 = 24
      [1, 2, 6, 6],    // (1+2)*6+6 = 24
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
      // Division only allowed when result is an integer (no fractions)
      if (b === 0 || a % b !== 0) return null;
      return a / b;
    default:
      return null;
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
    isStarted: false,
    isComplete: false,
    startTime: Date.now(),
    elapsedTime: 0,
  }));

  const [history, setHistory] = useState<Card[][]>([]);

  // Timer effect
  useEffect(() => {
    if (!game.isStarted || game.isComplete) return;

    const timer = setInterval(() => {
      setGame((prev) => ({
        ...prev,
        elapsedTime: Math.floor((Date.now() - prev.startTime) / 1000),
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [game.isStarted, game.isComplete]);

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
      isStarted: true,
      isComplete: false,
      startTime: Date.now(),
      elapsedTime: 0,
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
      isStarted: false,
      isComplete: false,
      startTime: Date.now(),
      elapsedTime: 0,
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
        const isDivisionError = game.selectedOperator === "/";
        setGame((prev) => ({
          ...prev,
          message: isDivisionError ? "除法必须能整除（结果必须是整数）" : "计算错误",
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

      // Replace the two used cards with the result, keeping other cards in place
      // First find the indices to determine which comes first
      const firstIndex = game.cards.findIndex((c) => c.id === firstCard.id);
      const secondIndex = game.cards.findIndex((c) => c.id === card.id);
      const minIndex = Math.min(firstIndex, secondIndex);
      const maxIndex = Math.max(firstIndex, secondIndex);

      // Build new array: keep cards before minIndex, add result, keep cards after maxIndex
      const newCards = [
        ...game.cards.slice(0, minIndex),
        newCard,
        ...game.cards.slice(maxIndex + 1),
      ];

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
            isComplete: true,
          }));
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
    const values = game.cards.map((c) => c.value);
    const solution = getSolution(values);
    if (solution) {
      setGame((prev) => ({
        ...prev,
        message: `提示：${solution} = 24`,
        messageType: "info",
      }));
    } else {
      setGame((prev) => ({
        ...prev,
        message: "未找到解法，请尝试其他组合",
        messageType: "info",
      }));
    }
  }, [game.cards]);

  const isCardSelected = (cardId: string) => game.selectedCardId === cardId;

  return (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold">第 {game.level} 关</h2>
            <p className="text-sm text-slate-400">
              得分: {game.score} | 时间: {formatTime(game.elapsedTime)}
            </p>
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
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 overflow-y-auto relative">
        {/* Start overlay */}
        {!game.isStarted && !game.isComplete && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/95">
            <button
              type="button"
              onClick={() =>
                setGame((prev) => ({
                  ...prev,
                  isStarted: true,
                  startTime: Date.now(),
                }))
              }
              className="rounded-xl bg-amber-500 px-8 py-4 text-lg font-medium text-slate-900 shadow-lg transition hover:bg-amber-400"
            >
              开始游戏
            </button>
          </div>
        )}

        {/* Cards Grid - Fixed height to maintain 2x2 layout space */}
        <div className="grid grid-cols-2 gap-4 h-[272px] content-start">
          {game.cards.map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => selectCard(card.id)}
              disabled={game.cards.length === 1}
              className={`flex h-32 w-32 items-center justify-center rounded-2xl text-4xl font-bold transition-all ${
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
        <div className="flex gap-3">
          <button
            type="button"
            onClick={newGame}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 transition hover:bg-slate-700"
          >
            <span className="text-base">🎮</span>
            <span className="text-[10px] text-slate-400">新游戏</span>
          </button>
          <button
            type="button"
            onClick={showHint}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 transition hover:bg-slate-700"
          >
            <span className="text-base">💡</span>
            <span className="text-[10px] text-slate-400">提示</span>
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
