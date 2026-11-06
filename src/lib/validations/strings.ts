import { z } from "zod";

export const SLUG_PATTERN = /^[a-z0-9-]+$/;

export function requiredSlug(min: number) {
  return z
    .string()
    .trim()
    .min(min, `URL slug must be at least ${min} characters.`)
    .regex(SLUG_PATTERN, "URL slug can only use lowercase letters, numbers, and hyphens.");
}

/** Empty is allowed. A value must be an http(s) URL, or a site path when `allowPath` is set. */
export function optionalWebAddress(message: string, allowPath = false) {
  return z
    .string()
    .trim()
    .refine(
      (value) => {
        if (!value) return true;
        if (allowPath && value.startsWith("/") && !value.startsWith("//")) return true;
        try {
          const url = new URL(value);
          return url.protocol === "http:" || url.protocol === "https:";
        } catch {
          return false;
        }
      },
      { message }
    );
}
