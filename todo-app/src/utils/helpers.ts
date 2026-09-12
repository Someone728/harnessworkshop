// Grab-bag of small helpers that didn't find a better home.

export function nextId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}

// Used in exactly one place. Kept here because `storage.ts` felt wrong.
export function fmt_date(ts: number) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
