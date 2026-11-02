/** Trimmed marks cut from the files in public/Erp_logo. */
export const PRODUCT_LOGOS = {
  tally: "/Erp_logo/marks/tally.png",
  zoho: "/Erp_logo/marks/zoho.png",
  busy: "/Erp_logo/marks/busy.png",
  vyapar: "/Erp_logo/marks/vyapar.png",
  marg: "/Erp_logo/marks/marg.png",
  odoo: "/Erp_logo/marks/odoo.png",
  easync: "/Erp_logo/marks/easync.png",
} as const;

export type ProductLogoKey = keyof typeof PRODUCT_LOGOS;
