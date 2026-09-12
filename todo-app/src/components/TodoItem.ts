import type { Task } from '../types';
import { cx } from '../utils/helpers';

export function renderTodoItem(
  task: Task,
  index: number,
  onToggle: (id: number) => void,
  onRemove: (id: number) => void
): HTMLElement {
  const li = document.createElement('li');
  li.className = cx(
    'group flex items-center justify-between gap-4 border-l-4 bg-white/[0.06] px-4 py-3.5 transition-colors hover:bg-white/[0.12]',
    task.done ? 'border-isks-mint' : 'border-isks-orange'
  );

  const position = document.createElement('span');
  position.textContent = String(index + 1).padStart(2, '0');
  position.className = 'isks-index';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.checked = task.done;
  checkbox.className = 'h-5 w-5 shrink-0 accent-isks-orange';
  checkbox.addEventListener('change', () => onToggle(task.id));

  const label = document.createElement('span');
  label.textContent = task.label;
  label.className = cx('flex-1 text-lg', task.done ? 'text-isks-mint/70 line-through' : 'text-white');

  const left = document.createElement('label');
  left.className = 'flex flex-1 cursor-pointer items-center gap-4';
  left.append(position, checkbox, label);

  const del = document.createElement('button');
  del.textContent = '×';
  del.setAttribute('aria-label', `Remove ${task.label}`);
  del.className =
    'shrink-0 px-2 font-display text-2xl font-bold leading-none text-isks-mint/50 transition-colors hover:text-isks-red-orange group-hover:text-isks-mint';
  del.addEventListener('click', () => onRemove(task.id));

  li.append(left, del);
  return li;
}
