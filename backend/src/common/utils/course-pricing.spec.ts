import { effectivePrice, isDiscountActive } from './course-pricing';

const at = new Date('2026-06-15T12:00:00Z').getTime();

describe('course pricing', () => {
  it('ignores a discount that has not started', () => {
    const course = {
      price: 100,
      discountPrice: 50,
      discountStart: '2026-07-01T00:00:00Z',
    };
    expect(isDiscountActive(course, at)).toBe(false);
    expect(effectivePrice(course, at)).toBe(100);
  });

  it('ignores an expired discount', () => {
    const course = {
      price: 100,
      discountPrice: 50,
      discountEnd: '2026-06-01T00:00:00Z',
    };
    expect(isDiscountActive(course, at)).toBe(false);
    expect(effectivePrice(course, at)).toBe(100);
  });

  it('applies an active discount inside the window', () => {
    const course = {
      price: 100,
      discountPrice: 40,
      discountStart: '2026-06-01T00:00:00Z',
      discountEnd: '2026-06-30T00:00:00Z',
    };
    expect(isDiscountActive(course, at)).toBe(true);
    expect(effectivePrice(course, at)).toBe(40);
  });

  it('supports discounts without any date bounds', () => {
    const course = { price: 100, discountPrice: 25 };
    expect(isDiscountActive(course, at)).toBe(true);
    expect(effectivePrice(course, at)).toBe(25);
  });

  it('falls back to zero for a free or missing price', () => {
    expect(effectivePrice({ price: null }, at)).toBe(0);
    expect(effectivePrice({}, at)).toBe(0);
  });

  it('rejects negative or non-numeric discount values', () => {
    expect(isDiscountActive({ price: 10, discountPrice: -5 }, at)).toBe(false);
    expect(
      isDiscountActive({ price: 10, discountPrice: 'abc' as any }, at),
    ).toBe(false);
  });
});
