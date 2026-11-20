/** Shared course pricing helpers for the client. */

const time = (value) => {
  if (!value) return null;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
};

export const isDiscountActive = (course, now = Date.now()) => {
  if (!course || course.discountPrice === null || course.discountPrice === undefined) {
    return false;
  }
  const discount = Number(course.discountPrice);
  if (!Number.isFinite(discount) || discount < 0) return false;
  const start = time(course.discountStart);
  const end = time(course.discountEnd);
  if (start !== null && now < start) return false;
  if (end !== null && now > end) return false;
  return true;
};

export const effectivePrice = (course, now = Date.now()) =>
  isDiscountActive(course, now)
    ? Number(course.discountPrice)
    : Number(course?.price || 0);

export const discountLabel = (course) => {
  if (!course?.discountStart && !course?.discountEnd) return '';
  const start = course.discountStart
    ? new Date(course.discountStart).toLocaleDateString()
    : '';
  const end = course.discountEnd ? new Date(course.discountEnd).toLocaleDateString() : '';
  if (start && end) return `${start} – ${end}`;
  if (end) return `Until ${end}`;
  return `From ${start}`;
};
