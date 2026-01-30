/**
 * Pagination Helper Functions
 * Provides consistent pagination across all list endpoints
 */

/**
 * Parse pagination parameters from request query
 * @param {Object} query - Express request query object
 * @returns {Object} Pagination options
 */
const getPaginationParams = (query) => {
    const page = parseInt(query.page) || 1;
    const limit = Math.min(parseInt(query.limit) || 50, 100); // Max 100 per page
    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

/**
 * Create pagination response object
 * @param {number} total - Total number of documents
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const createPaginationResponse = (total, page, limit) => {
    const pages = Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        pages,
        hasNextPage: page < pages,
        hasPrevPage: page > 1
    };
};

/**
 * Apply pagination to Mongoose query
 * @param {Object} query - Mongoose query object
 * @param {Object} options - Pagination options from getPaginationParams
 * @returns {Object} Modified query
 */
const applyPagination = (query, { skip, limit }) => {
    return query.skip(skip).limit(limit);
};

module.exports = {
    getPaginationParams,
    createPaginationResponse,
    applyPagination
};
