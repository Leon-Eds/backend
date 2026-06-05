"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateJwtToken = generateJwtToken;
exports.generateRefreshToken = generateRefreshToken;
exports.getTokenExpiryDate = getTokenExpiryDate;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
function generateJwtToken(user) {
    const secret = process.env.JWT_KEY || "SuperSecretDefaultKeyForLeonEdBackendNodeJSNodeJSNodeJSNodeJSNodeJSNodeJS";
    const expiryMinutes = parseInt(process.env.JWT_EXPIRY_MINUTES || "60", 10);
    const payload = {
        nameid: user.id,
        sub: user.id,
        email: user.email.toLowerCase(),
        unique_name: user.name,
        role: user.role,
        SchoolId: user.schoolId || undefined,
    };
    return jsonwebtoken_1.default.sign(payload, secret, {
        issuer: process.env.JWT_ISSUER || "LeonEdBackend",
        audience: process.env.JWT_AUDIENCE || "LeonEdFrontend",
        expiresIn: `${expiryMinutes}m`,
    });
}
function generateRefreshToken() {
    return crypto_1.default.randomBytes(64).toString("base64");
}
function getTokenExpiryDate() {
    const expiryMinutes = parseInt(process.env.JWT_EXPIRY_MINUTES || "60", 10);
    return new Date(Date.now() + expiryMinutes * 60 * 1000);
}
