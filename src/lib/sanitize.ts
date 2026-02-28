/**
 * Payload sanitization helpers for API routes.
 * Converts empty strings to undefined, trims strings, and removes null values
 * so the API receives clean data.
 */

export function sanitizeOptionalFields<T extends Record<string, unknown>>(
  payload: T
): Partial<T> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value === null || value === undefined) {
      continue;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed === "") {
        continue;
      }
      result[key] = trimmed;
    } else {
      result[key] = value;
    }
  }
  return result as Partial<T>;
}
