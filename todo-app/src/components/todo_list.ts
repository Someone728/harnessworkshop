import type { Task } from '../types';
import { renderTodoItem } from './TodoItem';

export function renderTodoList(tasks: Task[], onToggle: (id: number) => void, onRemove: (id: number) => void): HTMLElement {
  const ul = document.createElement('ul');
  ul.className = 'flex min-h-[13rem] flex-col gap-2.5';

  if (tasks.length === 0) {
    const empty = document.createElement('li');
    empty.textContent = 'Nothing here yet.';
    empty.className =
      'flex min-h-[13rem] items-center justify-center border-2 border-dashed border-isks-mint/40 text-center font-display text-sm font-bold uppercase tracking-[0.3em] text-isks-mint/70';
    ul.append(empty);
    return ul;
  }

  tasks.forEach((task, index) => {
    ul.append(renderTodoItem(task, index, onToggle, onRemove));
  });
  return ul;
}
