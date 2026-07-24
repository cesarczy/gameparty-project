export type SortDirection = 'asc' | 'desc';

export function toggleSortKey(
  currentKey: string | null,
  currentDir: SortDirection,
  nextKey: string,
): { key: string; dir: SortDirection } {
  if (currentKey !== nextKey) {
    return { key: nextKey, dir: 'asc' };
  }
  return { key: nextKey, dir: currentDir === 'asc' ? 'desc' : 'asc' };
}

export function compareText(a: string, b: string, dir: SortDirection): number {
  const result = a.localeCompare(b, 'pt-BR', { sensitivity: 'base' });
  return dir === 'asc' ? result : -result;
}

export function compareNumber(a: number, b: number, dir: SortDirection): number {
  return dir === 'asc' ? a - b : b - a;
}

export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function matchesSearch(query: string, ...values: Array<string | number | null | undefined>): boolean {
  if (!query) return true;
  const haystack = values
    .filter((v) => v !== null && v !== undefined)
    .map((v) => String(v).toLowerCase())
    .join(' ');
  return haystack.includes(query);
}
