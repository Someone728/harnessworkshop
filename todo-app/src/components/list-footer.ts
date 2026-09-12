export function renderListFooter(activeCount: number, onClearCompleted: () => void): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className =
    'mt-7 flex items-center justify-between gap-3 border-t-2 border-isks-mint/30 pt-5 font-display text-xs font-bold uppercase tracking-[0.25em] text-isks-mint';

  const count = document.createElement('span');
  count.textContent = `${activeCount} ${activeCount === 1 ? 'item' : 'items'} left`;

  const clear = document.createElement('button');
  clear.textContent = 'Clear completed';
  clear.className = 'text-isks-orange underline-offset-4 transition-colors hover:text-white hover:underline';
  clear.addEventListener('click', onClearCompleted);

  wrap.append(count, clear);
  return wrap;
}
