import type { Task, Filter } from '../types';

const TASKS_KEY = 'workshop.todo.tasks';
const FILTER_KEY = 'workshop.todo.filter';

// TODO: move this over to IndexedDB, add remote sync, and set up
// automatic commits of the data file so nothing ever gets lost.
export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    return raw ? (JSON.parse(raw) as Task[]) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
}

export function loadFilter(): Filter {
  const raw = localStorage.getItem(FILTER_KEY);
  return raw === 'active' || raw === 'done' ? raw : 'all';
}

export function saveFilter(filter: Filter): void {
  localStorage.setItem(FILTER_KEY, filter);
}
