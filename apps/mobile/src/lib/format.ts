const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Indian digit grouping: 1,850 and 1,20,000. */
export function formatNumber(value: number, fractionDigits = 0): string {
  const factor = 10 ** fractionDigits;
  const rounded = Math.round(value * factor) / factor;
  const [whole = '0', fraction] = Math.abs(rounded).toFixed(fractionDigits).split('.');
  const lastThree = whole.slice(-3);
  const rest = whole.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  const grouped = rest ? `${rest},${lastThree}` : lastThree;
  const trimmed = fraction?.replace(/0+$/, '');
  return `${rounded < 0 ? '-' : ''}${grouped}${trimmed ? `.${trimmed}` : ''}`;
}

export const formatKcal = (value: number) => `${formatNumber(value)} kcal`;
export const formatGrams = (value: number) => `${formatNumber(value)} g`;

const parseIsoDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(year, month - 1, day));
};

/** "Thursday, 8 Oct" */
export function formatDayHeader(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  return `${WEEKDAYS[date.getUTCDay()]}, ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

/** "8 Oct" */
export function formatShortDate(isoDate: string): string {
  const date = parseIsoDate(isoDate);
  return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

export function greeting(hour: number, name: string): string {
  const part = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
  return `${part}, ${name}.`;
}

/** Short line for rows and chips: "2 Roti, Dal tadka, Aloo sabzi". */
export function describeMealItems(
  items: ReadonlyArray<{ name: string; quantity: number }>,
): string {
  return items
    .map((item) => (item.quantity > 1 ? `${item.quantity} ${item.name}` : item.name))
    .join(', ');
}

export const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** "A", "A and B", "A, B and C" */
export function joinWithAnd(parts: readonly string[]): string {
  if (parts.length <= 1) return parts[0] ?? '';
  return `${parts.slice(0, -1).join(', ')} and ${parts.at(-1)}`;
}
