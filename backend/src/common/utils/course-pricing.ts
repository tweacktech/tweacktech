export interface PriceableCourse {
  price?: number | null;
  discountPrice?: number | null;
  discountStart?: Date | string | null;
  discountEnd?: Date | string | null;
}

const asTime = (value?: Date | string | null): number | null => {
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
};

export function isDiscountActive(
  course: PriceableCourse,
  now = Date.now(),
): boolean {
  if (course.discountPrice === null || course.discountPrice === undefined) {
    return false;
  }
  const discount = Number(course.discountPrice);
  if (!Number.isFinite(discount) || discount < 0) return false;

  const start = asTime(course.discountStart);
  const end = asTime(course.discountEnd);
  if (start !== null && now < start) return false;
  if (end !== null && now > end) return false;
  return true;
}

export function effectivePrice(course: PriceableCourse, now = Date.now()): number {
  if (isDiscountActive(course, now)) return Number(course.discountPrice);
  return Number(course.price || 0);
}

/** Adds computed pricing flags to a course object returned by the API. */
export function applyCoursePricing<T extends PriceableCourse>(course: T) {
  return {
    ...course,
    effectivePrice: effectivePrice(course),
    discountActive: isDiscountActive(course),
  };
}
