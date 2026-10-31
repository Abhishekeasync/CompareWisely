export type RequirementStatus = "MET" | "PARTIAL" | "NOT_MET" | "PAID_ADDON" | "UNKNOWN";

export interface RequirementAuditItem {
  featureKey: string;
  featureName: string;
  status: RequirementStatus;
  note: string;
}

export interface RecommendationAlternative {
  softwareId: number;
  softwareSlug: string;
  softwareName: string;
  mono: string;
  score: number;
  startingPrice: string | null;
  differentiatingFactor: string;
}

export interface RecommendationMatch {
  softwareId: number;
  softwareSlug: string;
  softwareName: string;
  mono: string;
  tagline: string | null;
  overallFitScore: number; // 0-100
  matchLevel: "Exceptional Match" | "Strong Match" | "Moderate Match" | "Low Match";
  startingPrice: string | null;
  verifiedDate: string | null;
  websiteUrl: string | null;
  trialUrl: string | null;
  matchReasons: string[];
  tradeOffs: string[];
  requirementsAudit: RequirementAuditItem[];
  runnersUp: RecommendationAlternative[];
}
