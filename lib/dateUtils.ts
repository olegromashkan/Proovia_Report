export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function parseDate(value?: string): string | null {
  if (!value) return null;
  // try Date constructor first
  const d = new Date(value);
  if (!isNaN(d.getTime())) {
    return d.toISOString().slice(0, 10);
  }
  const parts = value.trim().split(/[- ]+/);
  if (parts.length < 3) return null;
  const [day, mon, year] = parts;
  const mIdx = MONTHS.findIndex((m) => m.toLowerCase() === mon.slice(0, 3).toLowerCase());
  if (mIdx === -1) return null;
  return `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
