export function renderAddTodoForm(onAdd: (text: string) => void): HTMLElement {
  const form = document.createElement('form');
  form.className = 'mb-6 flex flex-wrap gap-3 sm:flex-nowrap';

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'What needs doing?';
  input.className = 'isks-input';

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.textContent = 'Add';
  btn.className = 'isks-btn';

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!input.value.trim()) return;
    onAdd(input.value);
    input.value = '';
  });

  form.append(input, btn);
  return form;
}
