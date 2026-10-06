import type { BookingInput } from "./types.js";

export class ValidationError extends Error {}

function requiredString(value: unknown, field: string, maxLength?: number): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ValidationError(`${field} must be a non-empty string`);
  }
  const result = value.trim();
  if (maxLength !== undefined && result.length > maxLength) {
    throw new ValidationError(`${field} must be at most ${maxLength} characters`);
  }
  return result;
}

function isoDate(value: unknown, field: string): string {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw new ValidationError(`${field} must be a valid date`);
  }
  return new Date(value).toISOString();
}

export function validateBooking(
  value: unknown,
  existing?: Partial<BookingInput>,
): BookingInput {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new ValidationError("request body must be a JSON object");
  }
  const body = value as Record<string, unknown>;
  const merged = { ...existing, ...body };
  const equipmentId = requiredString(merged.equipmentId, "equipmentId");
  const borrowerName = requiredString(merged.borrowerName, "borrowerName", 100);
  const startAt = isoDate(merged.startAt, "startAt");
  const endAt = isoDate(merged.endAt, "endAt");
  if (startAt >= endAt) {
    throw new ValidationError("startAt must be before endAt");
  }
  let purpose: string | null | undefined;
  if (merged.purpose !== undefined && merged.purpose !== null) {
    purpose = requiredString(merged.purpose, "purpose", 500);
  } else {
    purpose = null;
  }
  return { equipmentId, borrowerName, startAt, endAt, purpose };
}
