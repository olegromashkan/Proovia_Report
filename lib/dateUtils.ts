export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function parseDate(value?: string): string | null {
  if (!value) return null;
  const v = value.trim();

  // handle ISO like YYYY-MM-DD or YYYY/MM/DD
  let m = v.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    const [, y, mo, d] = m;
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  // handle DD/MM/YYYY or DD-MM-YYYY
  m = v.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  // try Date constructor
  const dObj = new Date(v);
  if (!isNaN(dObj.getTime())) {
    const y = dObj.getFullYear();
    const mo = dObj.getMonth() + 1;
    const d = dObj.getDate();
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  // handle formats like '3 Jun 2025'
  const parts = v.split(/[- ]+/);
  if (parts.length >= 3) {
    const [day, mon, year] = parts;
    const mIdx = MONTHS.findIndex((m) => m.toLowerCase() === mon.slice(0, 3).toLowerCase());
    if (mIdx !== -1) {
      return `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  return null;
}
