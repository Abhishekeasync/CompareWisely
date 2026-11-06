/** Public site identity and canonical origin (no trailing slash). */
export const SITE_NAME = "CompareWisely" as const;

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://wiselycompare.com"
).replace(/\/$/, "");

export const SITE_CONTACT_EMAIL = "contact@wiselycompare.com";
export const SITE_PRIVACY_EMAIL = "privacy@wiselycompare.com";
export const SITE_ADMIN_EMAIL = "admin@wiselycompare.com";

export function siteUrl(path = ""): string {
  if (!path) return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function isAdminPath(pathname: string | null | undefined): boolean {
  return Boolean(pathname?.startsWith("/admin"));
}
