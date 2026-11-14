/**
 * Standard Pagination Utility
 * Default page size of 24 is mathematically optimal for responsive grids:
 * - Mobile: 2 cols = 12 complete rows
 * - Tablet: 3 cols = 8 complete rows
 * - Tablet Land / Small PC: 4 cols = 6 complete rows
 * - Desktop PC: 6 cols = 4 complete rows
 * Avoids dangling/incomplete bottom rows on all viewports.
 */

export const DEFAULT_PAGE_SIZE = 24;

export const paginateList = (list, query = {}) => {
  const total = Array.isArray(list) ? list.length : 0;

  // If client explicitly requests all items
  if (query.limit === 'all' || query.pagination === 'false') {
    return {
      data: list,
      pagination: {
        page: 1,
        limit: total,
        total,
        totalPages: 1,
        hasMore: false
      }
    };
  }

  // Parse page & limit
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = query.limit !== undefined && query.limit !== null
    ? Math.max(1, parseInt(query.limit, 10) || DEFAULT_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;

  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedData = list.slice(startIndex, startIndex + limit);

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages
    }
  };
};