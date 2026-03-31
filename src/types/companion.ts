export interface CompanionMemoryItem {
  id: string;
  content: string;
  source: "user" | "memo" | "profile";
  createdAt: string;
  isPinned: boolean;
}
