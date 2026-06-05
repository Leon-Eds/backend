"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.successResponse = successResponse;
exports.failResponse = failResponse;
exports.createPagedResult = createPagedResult;
function successResponse(data, message = "Request successful") {
    return {
        success: true,
        message,
        data,
    };
}
function failResponse(message, errors = null) {
    return {
        success: false,
        message,
        data: null,
        errors,
    };
}
function createPagedResult(items, totalCount, pageNumber, pageSize) {
    const totalPages = Math.ceil(totalCount / pageSize);
    return {
        items,
        totalCount,
        pageNumber,
        pageSize,
        totalPages,
        hasPreviousPage: pageNumber > 1,
        hasNextPage: pageNumber < totalPages,
    };
}
