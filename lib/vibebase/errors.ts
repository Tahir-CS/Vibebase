export class VibebaseError extends Error {
  constructor(
    public code:
      | "TOKEN_INVALID"
      | "TOKEN_REVOKED"
      | "SCOPE_MISSING"
      | "VALIDATION_ERROR"
      | "CONFIRMATION_REQUIRED"
      | "RESOURCE_NOT_FOUND"
      | "RATE_LIMITED"
      | "UPSTREAM_FAILURE",
    message: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "VibebaseError";
  }
}
