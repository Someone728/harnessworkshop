import { TodoStore } from '../../state/todoStore';
import type { Filter } from '../../types';

// Thin wrapper around TodoStore. It's not clear from the name alone
// whether new code should call TodoStore directly or go through here —
// both patterns exist elsewhere in the app.
export class TodoFeature {
  constructor(private store: TodoStore) {}

  addTask(text: string) {
    this.store.add(text);
  }

  completeTask(id: number) {
    this.store.toggle(id);
  }

  deleteTask(id: number) {
    this.store.remove(id);
  }

  clearCompleted() {
    this.store.clearCompleted();
  }

  activeCount() {
    return this.store.countActive();
  }

  visible(filter?: Filter) {
    return this.store.getVisibleTasks(filter);
  }
}
