export type UnknownRecord = Record<string, unknown>;

export function asUnknownRecord(value: unknown): UnknownRecord {
  return typeof value === 'object' && value !== null
    ? (value as UnknownRecord)
    : {};
}

export function getErrorMessage(
  error: unknown,
  fallback = 'Unknown error',
): string {
  if (error instanceof Error) {
    return error.message;
  }

  const record = asUnknownRecord(error);
  const message = record.message ?? record.msg;

  return typeof message === 'string' ? message : fallback;
}

export function getErrorStack(error: unknown): string | undefined {
  if (error instanceof Error) {
    return error.stack;
  }

  const stack = asUnknownRecord(error).stack;
  return typeof stack === 'string' ? stack : undefined;
}
