/**
 * Shared types for the comparison matrix.
 *
 * These are extracted from comparison.service.ts so that both server-side
 * services and client-side "use client" components can reference them
 * without importing from a server-only module.
 */

export interface DynamicMatrixColumn {
  id: number;
  slug: string;
  name: string;
  mono: string;
  tagline: string | null;
  startingPrice: string;
  websiteUrl: string | null;
  trialUrl: string | null;
  verifiedAt: string | Date | null;
}

export interface DynamicMatrixCell {
  valueKind: string;
  textValue: string | null;
  booleanValue: boolean | null;
  note: string | null;
}

export interface DynamicMatrixFeature {
  id: number;
  code: string;
  name: string;
  description: string | null;
  dataType: string;
  isDifferent: boolean;
  values: Record<string, DynamicMatrixCell>; // keyed by slug
}

export interface DynamicMatrixCategory {
  id: number;
  slug: string;
  name: string;
  displayOrder: number;
  features: DynamicMatrixFeature[];
}

export interface DynamicMatrixData {
  columns: DynamicMatrixColumn[];
  categories: DynamicMatrixCategory[];
  totalFeatures: number;
}
