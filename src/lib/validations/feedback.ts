import type { ZodError } from "zod";

export type FieldErrors = Record<string, string>;

type IssueLike = {
  path: ReadonlyArray<PropertyKey>;
  message: string;
};

const CODE_COPY: Record<string, string> = {
  UNAUTHORIZED: "Your session has expired. Sign in again to continue.",
  FORBIDDEN: "You don't have permission to do that.",
  NOT_FOUND: "We couldn't find that record. It may have been removed.",
  INTERNAL_ERROR: "Something went wrong. Please try again in a moment.",
  VALIDATION_FAILED: "Please check the highlighted fields and try again.",
  BAD_REQUEST: "That request wasn't valid. Check the fields and try again.",
  SLUG_CONFLICT: "That URL slug is already in use. Choose a different one.",
};

export function fieldErrorsFromZod(error: { issues: ReadonlyArray<IssueLike> }): FieldErrors {
  const fields: FieldErrors = {};

  for (const issue of error.issues) {
    const path = issue.path ?? [];
    const key = path.length > 0 ? path.map(String).join(".") : "_form";
    if (!fields[key]) fields[key] = issue.message;

    if (path.length > 1) {
      const top = String(path[0]);
      if (!fields[top]) fields[top] = issue.message;
    }
  }

  return fields;
}

export function summarizeFieldErrors(
  fields: FieldErrors,
  fallback = "Please check the highlighted fields and try again."
) {
  const messages = [
    ...new Set(
      Object.entries(fields)
        .filter(([key]) => key !== "_form" && !key.includes("."))
        .map(([, message]) => message)
        .concat(fields._form ? [fields._form] : [])
    ),
  ].filter(Boolean);

  if (messages.length === 0) return fallback;
  if (messages.length === 1) return messages[0];
  return `${messages[0]} ${messages.length - 1} more ${messages.length === 2 ? "field needs" : "fields need"} attention.`;
}

export function dropField(fields: FieldErrors, key: string): FieldErrors {
  if (!fields[key]) return fields;
  const next = { ...fields };
  delete next[key];
  return next;
}

export function validationErrorPayload(error: ZodError | { issues: ReadonlyArray<IssueLike> }) {
  const fields = fieldErrorsFromZod(error);
  return {
    code: "VALIDATION_FAILED" as const,
    message: summarizeFieldErrors(fields),
    fields,
  };
}

function isHumanMessage(message: string) {
  return message.includes(" ") && !message.includes("\n") && !/prisma|sql|stack|invocation/i.test(message);
}

export function readApiError(payload: unknown, fallback: string): { message: string; fields: FieldErrors } {
  const error =
    payload && typeof payload === "object" && "error" in payload
      ? (payload as { error?: { code?: unknown; message?: unknown; fields?: unknown } }).error
      : undefined;

  const rawFields = error?.fields;
  const fields: FieldErrors = {};
  if (rawFields && typeof rawFields === "object") {
    for (const [key, value] of Object.entries(rawFields)) {
      if (typeof value === "string" && value.trim()) fields[key] = value;
    }
  }

  if (Object.keys(fields).length > 0) {
    return { message: summarizeFieldErrors(fields, fallback), fields };
  }

  const rawMessage = typeof error?.message === "string" ? error.message.trim() : "";
  const code = typeof error?.code === "string" ? error.code : rawMessage;

  if (rawMessage && isHumanMessage(rawMessage) && rawMessage !== code) {
    return { message: rawMessage, fields };
  }

  if (code && CODE_COPY[code]) {
    return { message: CODE_COPY[code], fields };
  }

  if (rawMessage && isHumanMessage(rawMessage)) {
    return { message: rawMessage, fields };
  }

  return { message: fallback, fields };
}
