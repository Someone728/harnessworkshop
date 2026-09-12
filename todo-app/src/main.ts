import './style.css';
import { TodoStore } from './state/todoStore';
import { TodoFeature } from './features/todo/todoFeature';
import { renderAddTodoForm } from './components/add-todo-form';
import { renderTodoList } from './components/todo_list';
import { renderListFooter } from './components/list-footer';
import { cx } from './utils/helpers';
import type { Filter } from './types';

const store = new TodoStore();
const feature = new TodoFeature(store);

const app = document.getElementById('app')!;

function render() {
  app.innerHTML = '';

  const header = renderPanelHeader(feature.activeCount());

  const form = renderAddTodoForm((text) => {
    feature.addTask(text);
    render();
  });

  const filters = renderFilters(store.getFilter(), (f) => {
    store.setFilter(f);
    render();
  });

  const list = renderTodoList(
    feature.visible(),
    (id) => {
      feature.completeTask(id);
      render();
    },
    (id) => {
      feature.deleteTask(id);
      render();
    }
  );

  const footer = renderListFooter(feature.activeCount(), () => {
    feature.clearCompleted();
    render();
  });

  app.append(header, form, filters, list, footer);
}

// Panel header: klein label, grote titel en een omkaderde teller — het
// schaalverschil zet de hiërarchie binnen het paneel.
function renderPanelHeader(activeCount: number): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'mb-7 flex flex-wrap items-end justify-between gap-6 border-b-2 border-isks-mint/30 pb-5';

  const left = document.createElement('div');

  const heading = document.createElement('h1');
  heading.textContent = 'Task queue';
  heading.className = 'isks-panel-title mt-2';

  left.append(heading);

  const counter = document.createElement('div');
  counter.className = 'shrink-0 border-2 border-isks-mint/30 px-4 py-2 text-right';

  const number = document.createElement('span');
  number.textContent = String(activeCount).padStart(2, '0');
  number.className = 'block font-display text-5xl font-extrabold leading-none tabular-nums text-white';

  const caption = document.createElement('span');
  caption.textContent = 'open';
  caption.className = 'isks-eyebrow mt-1 block';

  counter.append(number, caption);

  wrap.append(left, counter);
  return wrap;
}

function renderFilters(current: Filter, onChange: (f: Filter) => void): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'mb-5 flex flex-wrap items-center gap-3';

  const label = document.createElement('span');
  label.textContent = 'filter';
  label.className = 'isks-eyebrow';
  wrap.append(label);

  (['all', 'active', 'done'] as Filter[]).forEach((f) => {
    const btn = document.createElement('button');
    btn.textContent = f;
    btn.className = cx('isks-chip', f === current && 'isks-chip-active');
    btn.addEventListener('click', () => onChange(f));
    wrap.append(btn);
  });

  return wrap;
}

render();
