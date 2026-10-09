import { addDays, daysBetween, isoWeekKey, isValidTimeZone, localClock } from './dates';

describe('dates', () => {
  it('resolves the local calendar day across midnight in IST', () => {
    const instant = new Date('2026-10-08T19:00:00Z');
    expect(localClock(instant, 'Asia/Kolkata')).toEqual({
      date: '2026-10-09',
      hour: 0,
      minute: 30,
    });
    expect(localClock(instant, 'UTC').date).toBe('2026-10-08');
  });

  it('adds days across month and year ends', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(daysBetween('2026-10-01', '2026-10-08')).toBe(7);
  });

  it('computes ISO weeks starting Monday', () => {
    expect(isoWeekKey('2026-10-05')).toBe(isoWeekKey('2026-10-11'));
    expect(isoWeekKey('2026-10-11')).not.toBe(isoWeekKey('2026-10-12'));
    expect(isoWeekKey('2027-01-01')).toBe('2026-W53');
  });

  it('validates IANA time zones', () => {
    expect(isValidTimeZone('Asia/Kolkata')).toBe(true);
    expect(isValidTimeZone('Mars/Olympus')).toBe(false);
  });
});
