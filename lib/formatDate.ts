export function formatDateTime(date: string | number | Date, options?: Intl.DateTimeFormatOptions) {
  return new Date(date).toLocaleString('en-GB', { timeZone: 'UTC', ...options });
}
