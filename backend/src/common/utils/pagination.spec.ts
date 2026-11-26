import { getPaginatedResponse, getPaginationParams } from './pagination';

describe('pagination', () => {
  it('defaults to page 1 with 10 items', () => {
    expect(getPaginationParams({})).toMatchObject({ page: 1, limit: 10, skip: 0 });
  });

  it('clamps invalid and out-of-range values', () => {
    // 0 is treated as "not supplied" and falls back to the default page size.
    expect(getPaginationParams({ page: 0, limit: 0 })).toMatchObject({
      page: 1,
      limit: 10,
    });
    expect(getPaginationParams({ page: -3, limit: -5 })).toMatchObject({
      page: 1,
      limit: 1,
    });
    expect(getPaginationParams({ page: 3, limit: 5000 })).toMatchObject({
      page: 3,
      limit: 100,
    });
  });

  it('computes the skip offset', () => {
    expect(getPaginationParams({ page: 4, limit: 12 }).skip).toBe(36);
  });

  it('reports next and previous pages correctly', () => {
    const first = getPaginatedResponse([1, 2], 25, 1, 10);
    expect(first.meta).toMatchObject({
      totalPages: 3,
      hasNext: true,
      hasPrev: false,
    });

    const last = getPaginatedResponse([25], 25, 3, 10);
    expect(last.meta).toMatchObject({ hasNext: false, hasPrev: true });
  });

  it('handles an empty result set', () => {
    expect(getPaginatedResponse([], 0, 1, 10).meta).toMatchObject({
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    });
  });
});
