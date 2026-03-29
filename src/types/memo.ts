export interface Memo {
  id: string;
  content: string;
  color: string;
  position: { x: number; y: number };
  isPinned: boolean;
  createdAt: string;
}
