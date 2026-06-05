"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
function errorMiddleware(err, req, res, next) {
    const status = err.status || 500;
    const title = status === 401 ? "Unauthorized" : "An unexpected error occurred.";
    const detail = err.message || "Internal Server Error";
    res.setHeader("Content-Type", "application/problem+json");
    res.status(status).json({
        type: "about:blank",
        title,
        status,
        detail,
    });
}
