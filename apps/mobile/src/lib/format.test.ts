import {
  formatDayHeader,
  formatKcal,
  formatNumber,
  formatShortDate,
  greeting,
  joinWithAnd,
} from './format';

describe('format', () => {
  it('groups digits the Indian way', () => {
    expect(formatNumber(1850)).toBe('1,850');
    expect(formatNumber(120000)).toBe('1,20,000');
    expect(formatNumber(-210.4)).toBe('-210');
    expect(formatNumber(13.25, 1)).toBe('13.3');
    expect(formatKcal(620)).toBe('620 kcal');
    expect(formatNumber(152, 1)).toBe('152');
    expect(formatNumber(5.9, 1)).toBe('5.9');
  });

  it('formats dates for headers', () => {
    expect(formatDayHeader('2026-10-08')).toBe('Thursday, 8 Oct');
    expect(formatShortDate('2026-09-02')).toBe('2 Sep');
  });

  it('joins lists in plain English', () => {
    expect(joinWithAnd(['LDL'])).toBe('LDL');
    expect(joinWithAnd(['HbA1c', 'LDL', 'HDL'])).toBe('HbA1c, LDL and HDL');
  });

  it('greets by time of day without exclamation marks', () => {
    expect(greeting(8, 'Alok')).toBe('Morning, Alok.');
    expect(greeting(14, 'Alok')).toBe('Afternoon, Alok.');
    expect(greeting(20, 'Alok')).toBe('Evening, Alok.');
  });
});
