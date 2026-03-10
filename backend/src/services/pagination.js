export function parsePagination(query, options = {}) {
  const defaultPage = options.defaultPage ?? 1;
  const defaultLimit = options.defaultLimit ?? 20;
  const maxLimit = options.maxLimit ?? 200;
  const enabled =
    query?.paginated === "true" ||
    query?.pagination === "true" ||
    query?.page !== undefined ||
    query?.limit !== undefined;

  const pageRaw = Number(query?.page ?? defaultPage);
  const limitRaw = Number(query?.limit ?? defaultLimit);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : defaultPage;
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), maxLimit) : defaultLimit;
  const offset = (page - 1) * limit;
  return { enabled, page, limit, offset };
}

export function asPaginated(rows, total, page, limit) {
  const safeTotal = Number(total || 0);
  const totalPages = Math.max(1, Math.ceil(safeTotal / limit));
  return {
    data: rows,
    pagination: {
      page,
      limit,
      total: safeTotal,
      totalPages,
      hasPrev: page > 1,
      hasNext: page < totalPages,
    },
  };
}

