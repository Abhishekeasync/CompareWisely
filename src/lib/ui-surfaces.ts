import type { CSSProperties } from "react";

/** Radius tokens — keep in sync with `--r-*` in globals.css */
export const uiRadius = {
  sm: "var(--r-sm)",
  md: "var(--r-md)",
  lg: "var(--r-lg)",
  xl: "var(--r-xl)",
  pill: "var(--r-pill)",
} as const;

export const uiInput: CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  border: "1px solid var(--border)",
  borderRadius: uiRadius.md,
  background: "var(--surface)",
  color: "var(--fg)",
  fontSize: "0.9rem",
  outline: "none",
};

export const uiInputMono: CSSProperties = {
  ...uiInput,
  fontFamily: "monospace",
  fontSize: "0.85rem",
  background: "var(--surface-2)",
};

export const uiSurface = (radius: keyof typeof uiRadius = "lg"): CSSProperties => ({
  border: "1px solid var(--border)",
  borderRadius: uiRadius[radius],
  background: "var(--surface)",
});

export const uiAlert = (tone: "danger" | "border" = "border"): CSSProperties => ({
  border: `1px solid var(--${tone === "danger" ? "danger" : "border"})`,
  borderRadius: uiRadius.md,
  padding: "12px 14px",
});
