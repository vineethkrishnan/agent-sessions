export const COLUMNS = {
  date: 16,
  provider: 8,
  project: 24,
  branch: 16,
  msgs: 5,
  preview: 60,
} as const;

export function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + "…";
}

export function padRight(str: string, len: number): string {
  if (str.length >= len) return str.slice(0, len);
  return str + " ".repeat(len - str.length);
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${h}:${min}`;
}

export function separatorWidth(): number {
  return (
    COLUMNS.date +
    COLUMNS.provider +
    COLUMNS.project +
    COLUMNS.branch +
    COLUMNS.msgs +
    COLUMNS.preview +
    15
  );
}
