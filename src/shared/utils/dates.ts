const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function startOfMonth(dateIso: string): string {
  return `${dateIso.slice(0, 7)}-01`;
}

export function endOfMonth(dateIso: string): string {
  const [year, month] = dateIso.split("-").map(Number);
  const end = new Date(Date.UTC(year, month, 0));
  return end.toISOString().slice(0, 10);
}

export function startOfWeek(dateIso: string): string {
  const date = new Date(`${dateIso}T00:00:00.000Z`);
  const day = date.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  return addDays(dateIso, diffToMonday);
}

export function endOfWeek(dateIso: string): string {
  return addDays(startOfWeek(dateIso), 6);
}

export function addDays(dateIso: string, days: number): string {
  const date = new Date(`${dateIso}T00:00:00.000Z`);
  return new Date(date.getTime() + days * DAY_IN_MS).toISOString().slice(0, 10);
}
