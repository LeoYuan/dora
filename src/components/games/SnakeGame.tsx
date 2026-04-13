import { useState, useCallback, useEffect, useRef } from "react";

interface Position {
  x: number;
  y: number;
}

interface GameState {
  snake: Position[];
  food: Position;
  direction: "UP" | "DOWN" | "LEFT" | "RIGHT";
  score: number;
  gameStatus: "playing" | "gameOver" | "paused";
  speed: number;
}

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

function generateFood(snake: Position[]): Position {
  let food: Position;
  do {
    food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some((segment) => segment.x === food.x && segment.y === food.y));
  return food;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

interface SnakeGameProps {
  onComplete?: (time: number, difficulty?: string) => void;
}

export function SnakeGame({ onComplete }: SnakeGameProps) {
  const [game, setGame] = useState<GameState>(() => {
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    return {
      snake: initialSnake,
      food: generateFood(initialSnake),
      direction: "RIGHT",
      score: 0,
      gameStatus: "paused",
      speed: INITIAL_SPEED,
    };
  });

  const [elapsedTime, setElapsedTime] = useState(0);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const directionRef = useRef(game.direction);

  // Keep direction ref in sync
  useEffect(() => {
    directionRef.current = game.direction;
  }, [game.direction]);

  const resetGame = useCallback(() => {
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    setGame({
      snake: initialSnake,
      food: generateFood(initialSnake),
      direction: "RIGHT",
      score: 0,
      gameStatus: "playing",
      speed: INITIAL_SPEED,
    });
    setElapsedTime(0);
    startTimeRef.current = Date.now();
  }, [onComplete]);

  const startGame = useCallback(() => {
    setGame((prev) => ({ ...prev, gameStatus: "playing" }));
    startTimeRef.current = Date.now();
  }, []);

  const moveSnake = useCallback(() => {
    setGame((prev) => {
      if (prev.gameStatus !== "playing") return prev;

      const newSnake = [...prev.snake];
      const head = { ...newSnake[0] };

      // Move head based on direction
      switch (directionRef.current) {
        case "UP":
          head.y -= 1;
          break;
        case "DOWN":
          head.y += 1;
          break;
        case "LEFT":
          head.x -= 1;
          break;
        case "RIGHT":
          head.x += 1;
          break;
      }

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        return { ...prev, gameStatus: "gameOver" };
      }

      // Check self collision
      if (newSnake.some((segment) => segment.x === head.x && segment.y === head.y)) {
        return { ...prev, gameStatus: "gameOver" };
      }

      newSnake.unshift(head);

      // Check food collision
      let newFood = prev.food;
      let newScore = prev.score;
      let newSpeed = prev.speed;

      if (head.x === prev.food.x && head.y === prev.food.y) {
        newScore += 10;
        newSpeed = Math.max(50, INITIAL_SPEED - Math.floor(newScore / 50) * 10);
        newFood = generateFood(newSnake);
      } else {
        newSnake.pop();
      }

      return {
        ...prev,
        snake: newSnake,
        food: newFood,
        score: newScore,
        speed: newSpeed,
      };
    });
  }, []);

  // Game loop
  useEffect(() => {
    if (game.gameStatus === "playing") {
      gameLoopRef.current = setInterval(moveSnake, game.speed);
    }
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [game.gameStatus, game.speed, moveSnake]);

  // Timer
  useEffect(() => {
    if (game.gameStatus !== "playing") return;

    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [game.gameStatus]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (game.gameStatus !== "playing") {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          if (game.gameStatus === "paused") {
            startGame();
          } else if (game.gameStatus === "gameOver") {
            resetGame();
          }
        }
        return;
      }

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          e.preventDefault();
          if (directionRef.current !== "DOWN") {
            setGame((prev) => ({ ...prev, direction: "UP" }));
          }
          break;
        case "ArrowDown":
        case "s":
        case "S":
          e.preventDefault();
          if (directionRef.current !== "UP") {
            setGame((prev) => ({ ...prev, direction: "DOWN" }));
          }
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          e.preventDefault();
          if (directionRef.current !== "RIGHT") {
            setGame((prev) => ({ ...prev, direction: "LEFT" }));
          }
          break;
        case "ArrowRight":
        case "d":
        case "D":
          e.preventDefault();
          if (directionRef.current !== "LEFT") {
            setGame((prev) => ({ ...prev, direction: "RIGHT" }));
          }
          break;
        case " ":
          e.preventDefault();
          setGame((prev) => ({ ...prev, gameStatus: "paused" }));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [game.gameStatus, startGame, resetGame]);

  return (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700 px-6 py-4">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-lg font-semibold">贪吃蛇</h2>
            <p className="text-sm text-slate-400">
              得分: {game.score} | 时间: {formatTime(elapsedTime)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={resetGame}
            className="cursor-pointer rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-slate-900 transition hover:bg-amber-400"
          >
            重玩
          </button>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6 overflow-y-auto">
        {/* Game Board */}
        <div className="relative">
          {/* Start/Pause Overlay */}
          {(game.gameStatus === "paused" || game.gameStatus === "gameOver") && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/95">
              <div className="text-center">
                {game.gameStatus === "gameOver" ? (
                  <>
                    <div className="mb-2 text-4xl">💀</div>
                    <div className="mb-2 text-xl font-bold text-red-400">游戏结束</div>
                    <div className="mb-4 text-sm text-slate-400">
                      最终得分: {game.score}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-2 text-4xl">🐍</div>
                    <div className="mb-4 text-xl font-bold text-amber-400">贪吃蛇</div>
                  </>
                )}
                <button
                  type="button"
                  onClick={game.gameStatus === "gameOver" ? resetGame : startGame}
                  className="cursor-pointer rounded-xl bg-amber-500 px-8 py-4 text-lg font-medium text-slate-900 shadow-lg transition hover:bg-amber-400"
                >
                  {game.gameStatus === "gameOver" ? "再玩一次" : "开始游戏"}
                </button>
              </div>
            </div>
          )}

          {/* Grid */}
          <div
            className="grid gap-px rounded-lg border-2 border-slate-700 bg-slate-700 p-1"
            style={{
              gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
              width: `${GRID_SIZE * CELL_SIZE + 8}px`,
              height: `${GRID_SIZE * CELL_SIZE + 8}px`,
            }}
          >
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, index) => {
              const x = index % GRID_SIZE;
              const y = Math.floor(index / GRID_SIZE);
              const isSnake = game.snake.some((segment) => segment.x === x && segment.y === y);
              const isFood = game.food.x === x && game.food.y === y;
              const isHead = game.snake[0]?.x === x && game.snake[0]?.y === y;

              return (
                <div
                  key={index}
                  className={`${
                    isHead
                      ? "bg-green-400 rounded-sm"
                      : isSnake
                      ? "bg-green-500 rounded-sm"
                      : isFood
                      ? "bg-red-500 rounded-full"
                      : "bg-slate-800"
                  }`}
                  style={{ width: CELL_SIZE, height: CELL_SIZE }}
                />
              );
            })}
          </div>
        </div>

        {/* Controls Hint */}
        <div className="text-center text-xs text-slate-400">
          <p>使用方向键或 WASD 控制蛇的移动</p>
          <p className="mt-1">按空格键暂停游戏</p>
        </div>
      </div>

      {/* Rules */}
      <div className="border-t border-slate-700 bg-slate-800/50 px-6 py-4 text-center text-xs text-slate-400">
        <p>吃掉红色食物得分，撞墙或撞到自己游戏结束</p>
      </div>
    </div>
  );
}
