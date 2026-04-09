export interface Score {
  playerName: string;
  time: number; // in seconds
  date: string;
  difficulty?: string;
}

export interface LeaderboardData {
  "24": Score[];
  sudoku: Score[];
  minesweeper: Score[];
}

const STORAGE_KEY = "dora-game-leaderboard";
const MAX_ENTRIES = 20;

export function getLeaderboard(): LeaderboardData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch {
    // ignore
  }
  return { "24": [], sudoku: [], minesweeper: [] };
}

export function saveScore(
  gameType: keyof LeaderboardData,
  score: Omit<Score, "date">
): void {
  const leaderboard = getLeaderboard();
  const newScore: Score = {
    ...score,
    date: new Date().toISOString(),
  };

  // Add new score and sort by time (ascending)
  leaderboard[gameType].push(newScore);
  leaderboard[gameType].sort((a, b) => a.time - b.time);

  // Keep only top MAX_ENTRIES
  leaderboard[gameType] = leaderboard[gameType].slice(0, MAX_ENTRIES);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(leaderboard));
  } catch {
    // ignore
  }
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
