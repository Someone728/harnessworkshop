// Render-layer shape. Not the same as Task in types.ts — components
// convert back and forth between the two. There isn't a strong reason
// these are separate types; it's mostly historical.
export type TodoItem = {
  id: string;
  text: string;
  isComplete: boolean;
};

export function taskToTodoItem(task: { id: number; label: string; done: boolean }): TodoItem {
  return { id: String(task.id), text: task.label, isComplete: task.done };
}
