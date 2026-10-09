/** JSON objects only; arrays and null are not records. */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export const nonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

export const integerInRange = (value: unknown, min: number, max = Number.MAX_SAFE_INTEGER): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;

export const safeKey = (value: string) => !["__proto__", "constructor", "prototype"].includes(value);

export function stringList(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter(nonEmptyString))] : [];
}

export function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const time = Date.parse(value + "T00:00:00Z");
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === value;
}
