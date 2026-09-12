import type { Task, Filter, Handler } from '../types';
import { loadTasks, saveTasks, loadFilter, saveFilter } from '../utils/storage';
import { nextId } from '../utils/helpers';

export class TodoStore {
  private tasks: Task[];
  private filter: Filter;
  private listeners: Handler[] = [];

  constructor() {
    this.tasks = loadTasks();
    this.filter = loadFilter();
  }

  on(listener: Handler) {
    this.listeners.push(listener);
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  add(label: string) {
    const trimmed = label.trim();
    if (!trimmed) return;
    this.tasks.push({ id: nextId(), label: trimmed, done: false, createdAt: Date.now() });
    this.persist();
  }

  toggle(id: number) {
    const t = this.tasks.find((x) => x.id === id);
    if (t) t.done = !t.done;
    this.persist();
  }

  remove(id: number) {
    this.tasks = this.tasks.filter((x) => x.id !== id);
    this.persist();
  }

  clearCompleted() {
    this.tasks = this.tasks.filter((x) => !x.done);
    this.persist();
  }

  countActive(): number {
    return this.tasks.filter((x) => !x.done).length;
  }

  setFilter(filter: Filter) {
    this.filter = filter;
    saveFilter(filter);
    this.emit();
  }

  getFilter() {
    return this.filter;
  }

  // Returns tasks matching the current filter. Callers sometimes also
  // pass an explicit filter override (see todoFeature.ts), which is why
  // this isn't just a getter.
  getVisibleTasks(filterOverride?: Filter): Task[] {
    const f = filterOverride ?? this.filter;
    if (f === 'active') return this.tasks.filter((t) => !t.done);
    if (f === 'done') return this.tasks.filter((t) => t.done);
    return this.tasks;
  }

  private persist() {
    saveTasks(this.tasks);
    this.emit();
  }
}
