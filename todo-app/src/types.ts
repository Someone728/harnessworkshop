// Core task shape used by the store and most of the app.
export interface Task {
  id: number;
  label: string;
  done: boolean;
  createdAt: number;
  meta?: Record<string, unknown>;
}

export type Filter = 'all' | 'active' | 'done';

// Loosely typed callback used in a couple of places — intentionally vague.
export type Handler = (...args: any[]) => void;
