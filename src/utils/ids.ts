let idCounter = 0;

export function uid(prefix: string): string {
  return `${prefix}-${++idCounter}-${Math.random().toString(36).substr(2, 4)}`;
}
