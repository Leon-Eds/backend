"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function authMiddleware(allowedRoles) {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication token is missing.",
            });
        }
        const token = authHeader.split(" ")[1];
        const secret = process.env.JWT_KEY || "SuperSecretDefaultKeyForLeonEdBackendNodeJSNodeJSNodeJSNodeJSNodeJSNodeJS";
        try {
            const decoded = jsonwebtoken_1.default.verify(token, secret);
            // Map token claims to req.user
            // C# claims: NameIdentifier -> id, Email -> email, Name -> name, Role -> role, SchoolId -> schoolId
            const userPayload = {
                id: decoded.nameid || decoded.sub || decoded.id,
                email: decoded.email,
                name: decoded.unique_name || decoded.name,
                role: decoded.role,
                schoolId: decoded.SchoolId || decoded.schoolId,
            };
            req.user = userPayload;
            // Extract school context if present
            if (userPayload.schoolId) {
                req.schoolId = userPayload.schoolId;
            }
            // Check roles if specified
            if (allowedRoles && allowedRoles.length > 0) {
                if (!allowedRoles.includes(userPayload.role)) {
                    return res.status(403).json({
                        success: false,
                        message: "You do not have permission to access this resource.",
                    });
                }
            }
            next();
        }
        catch (err) {
            return res.status(401).json({
                success: false,
                message: "Invalid or expired authentication token.",
            });
        }
    };
}
