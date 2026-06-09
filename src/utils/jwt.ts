import jwt from "jsonwebtoken";
import crypto from "crypto";

export interface TokenResponse {
  token: string;
  refreshToken: string;
  tokenExpiry: Date;
}

export function generateJwtToken(user: { id: string; email: string; name: string; role: string; schoolId?: string | null; isVerified?: boolean }): string {
  const secret = process.env.JWT_KEY || "SuperSecretDefaultKeyForLeonEdBackendNodeJSNodeJSNodeJSNodeJSNodeJSNodeJS";
  const expiryMinutes = parseInt(process.env.JWT_EXPIRY_MINUTES || "60", 10);

  const payload = {
    nameid: user.id,
    sub: user.id,
    email: user.email.toLowerCase(),
    unique_name: user.name,
    role: user.role,
    SchoolId: user.schoolId || undefined,
    isVerified: user.isVerified || false,
  };

  return jwt.sign(payload, secret, {
    issuer: process.env.JWT_ISSUER || "LeonEdBackend",
    audience: process.env.JWT_AUDIENCE || "LeonEdFrontend",
    expiresIn: `${expiryMinutes}m`,
  });
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("base64");
}

export function getTokenExpiryDate(): Date {
  const expiryMinutes = parseInt(process.env.JWT_EXPIRY_MINUTES || "60", 10);
  return new Date(Date.now() + expiryMinutes * 60 * 1000);
}
