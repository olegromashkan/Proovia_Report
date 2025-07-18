export function parseTimeToMinutes(value?: string): number | null {
  if (!value) return null;
  const match = value.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;
  const [, h, m, s = '0'] = match;
  const n = Number(h) * 60 + Number(m) + Number(s) / 60;
  return isFinite(n) ? n : null;
}
