const DEFAULT_ALLOWED_ORIGINS = "http://localhost:3000,http://localhost:5173";

function normalizeOrigin(value: string, variableName: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`${variableName} contains an empty origin.`);
  }

  const parsed = new URL(trimmed);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`${variableName} origins must use HTTP or HTTPS.`);
  }
  if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error(`${variableName} must contain origins only, without paths, queries, or fragments.`);
  }

  return parsed.origin;
}

export function getAllowedOrigins(): string[] {
  const configuredOrigins = process.env.CORS_ORIGINS || DEFAULT_ALLOWED_ORIGINS;
  return Array.from(new Set(
    configuredOrigins
      .split(",")
      .map((origin) => normalizeOrigin(origin, "CORS_ORIGINS"))
  ));
}

export function resolveFrontendUrl(requestOrigin?: string): string {
  const configuredFrontendUrl = process.env.FRONTEND_URL;
  if (!configuredFrontendUrl?.trim()) {
    throw new Error("FRONTEND_URL is not configured.");
  }

  const fallbackUrl = normalizeOrigin(configuredFrontendUrl, "FRONTEND_URL");
  if (!requestOrigin) return fallbackUrl;

  try {
    const normalizedRequestOrigin = normalizeOrigin(requestOrigin, "Request Origin");
    return getAllowedOrigins().includes(normalizedRequestOrigin)
      ? normalizedRequestOrigin
      : fallbackUrl;
  } catch {
    return fallbackUrl;
  }
}
