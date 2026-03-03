const MAX_PAGE_SIZE = 1000;
const DEFAULT_PAGE_SIZE = 1000;

const resolvePagination = (query, defaultLimit = DEFAULT_PAGE_SIZE) => {
    const rawLimit = Number(query?.limit);
    const rawPage = Number(query?.page);

    const limit = Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(Math.floor(rawLimit), MAX_PAGE_SIZE)
        : defaultLimit;

    const page = Number.isFinite(rawPage) && rawPage > 0
        ? Math.floor(rawPage)
        : 1;

    const offset = (page - 1) * limit;

    return { limit, page, offset };
};

const paginateRows = (rows, pagination) => {
    return rows.slice(pagination.offset, pagination.offset + pagination.limit);
};

module.exports = {
    MAX_PAGE_SIZE,
    DEFAULT_PAGE_SIZE,
    resolvePagination,
    paginateRows,
};
