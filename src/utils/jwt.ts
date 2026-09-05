import jwt from "jsonwebtoken";
import crypto from "crypto";
import { requireEnvironmentVariable } from "../config/env";

export interface TokenResponse {
  token: string;
  refreshToken: string;
  tokenExpiry: Date;
}

export interface AccessTokenClaims extends jwt.JwtPayload {
  nameid?: string;
  email?: string;
  unique_name?: string;
  role?: string;
  SchoolId?: string;
  isVerified?: boolean;
}

function getJwtSettings() {
  return {
    secret: requireEnvironmentVariable("JWT_KEY"),
    issuer: requireEnvironmentVariable("JWT_ISSUER"),
    audience: requireEnvironmentVariable("JWT_AUDIENCE"),
  };
}

export function generateJwtToken(user: { id: string; email: string; name: string; role: string; schoolId?: string | null; isVerified?: boolean }): string {
  const { secret, issuer, audience } = getJwtSettings();
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
    algorithm: "HS256",
    issuer,
    audience,
    expiresIn: `${expiryMinutes}m`,
  });
}

export function verifyJwtToken(token: string): AccessTokenClaims {
  const { secret, issuer, audience } = getJwtSettings();
  return jwt.verify(token, secret, {
    algorithms: ["HS256"],
    issuer,
    audience,
  }) as AccessTokenClaims;
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("base64");
}

export function getTokenExpiryDate(): Date {
  const expiryMinutes = parseInt(process.env.JWT_EXPIRY_MINUTES || "60", 10);
  return new Date(Date.now() + expiryMinutes * 60 * 1000);
}
