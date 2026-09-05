const REQUIRED_BASE_ENV = ["JWT_KEY", "JWT_ISSUER", "JWT_AUDIENCE"] as const;
const REQUIRED_PRODUCTION_ENV = ["PAYSTACK_SECRET_KEY", "CRON_SECRET", "SUPER_ADMIN_SECRET"] as const;

function missingVariables(names: readonly string[]): string[] {
  return names.filter((name) => !process.env[name]?.trim());
}

export function validateRuntimeConfiguration(): void {
  const required = process.env.NODE_ENV === "production"
    ? [...REQUIRED_BASE_ENV, ...REQUIRED_PRODUCTION_ENV]
    : [...REQUIRED_BASE_ENV];
  const missing = missingVariables(required);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (process.env.JWT_KEY!.length < 32) {
    throw new Error("JWT_KEY must contain at least 32 characters.");
  }
}

export function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}
