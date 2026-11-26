import { effectivePrice, isDiscountActive } from './coursePrice';

const at = new Date('2026-06-15T12:00:00Z').getTime();

describe('client course pricing', () => {
  it('keeps the full price before the window opens', () => {
    const course = {
      price: 100,
      discountPrice: 50,
      discountStart: '2026-07-01T00:00:00Z',
    };
    expect(isDiscountActive(course, at)).toBe(false);
    expect(effectivePrice(course, at)).toBe(100);
  });

  it('keeps the full price after the window closes', () => {
    const course = {
      price: 100,
      discountPrice: 50,
      discountEnd: '2026-06-01T00:00:00Z',
    };
    expect(effectivePrice(course, at)).toBe(100);
  });

  it('applies an active discount', () => {
    const course = {
      price: 100,
      discountPrice: 40,
      discountStart: '2026-06-01T00:00:00Z',
      discountEnd: '2026-06-30T00:00:00Z',
    };
    expect(effectivePrice(course, at)).toBe(40);
  });

  it('handles free, missing and malformed courses', () => {
    expect(effectivePrice(null, at)).toBe(0);
    expect(effectivePrice({ price: null }, at)).toBe(0);
    expect(isDiscountActive(null, at)).toBe(false);
    expect(isDiscountActive({ discountPrice: -1, price: 10 }, at)).toBe(false);
  });
});
