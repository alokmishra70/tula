import { DishMatcher, normalizeFoodName } from './dish-matcher';

const dishes = [
  { id: '1', name: 'Dal tadka', aliases: ['dal', 'toor dal', 'yellow dal'] },
  { id: '2', name: 'Roti', aliases: ['chapati', 'phulka'] },
  { id: '3', name: 'Aloo sabzi', aliases: ['aloo ki sabzi', 'potato curry'] },
  { id: '4', name: 'Curd', aliases: ['dahi', 'yogurt'] },
  { id: '5', name: 'Paneer butter masala', aliases: ['paneer makhani'] },
];

describe('DishMatcher', () => {
  const matcher = new DishMatcher(dishes);

  it('normalises names', () => {
    expect(normalizeFoodName('  Aloo-Sabzi (dry)! ')).toBe('aloo sabzi dry');
  });

  it('matches exact names and aliases with full confidence', () => {
    expect(matcher.match('Chapati')).toEqual({ dish: dishes[1], score: 1 });
    expect(matcher.match('dahi')?.dish.id).toBe('4');
  });

  it('fuzzy matches spelling variants', () => {
    expect(matcher.match('chapatti')?.dish.id).toBe('2');
    expect(matcher.match('aloo sabji')?.dish.id).toBe('3');
    expect(matcher.match('paneer butter masaala')?.dish.id).toBe('5');
  });

  it('returns null for unrelated food', () => {
    expect(matcher.match('sushi platter')).toBeNull();
    expect(matcher.match('   ')).toBeNull();
  });
});
