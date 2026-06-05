"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tenantMiddleware = tenantMiddleware;
exports.requireSchoolId = requireSchoolId;
function tenantMiddleware(req, res, next) {
    // Try to get schoolId from req.user
    if (req.user && req.user.schoolId) {
        req.schoolId = req.user.schoolId;
    }
    // If schoolId is not present, we check if it is required
    next();
}
function requireSchoolId(req, res, next) {
    if (!req.schoolId) {
        return res.status(400).json({
            success: false,
            message: "School context (SchoolId) is required for this operation.",
        });
    }
    next();
}
