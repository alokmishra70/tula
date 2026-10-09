const pad = (value: number) => String(value).padStart(2, '0');

/** Device-local calendar date, matching how the API buckets meals by the user's time zone. */
export function localIsoDate(date: Date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
}

/** "1:10 pm" */
export function formatTime(date: Date): string {
  const hours = date.getHours();
  const suffix = hours >= 12 ? 'pm' : 'am';
  return `${hours % 12 || 12}:${pad(date.getMinutes())} ${suffix}`;
}
