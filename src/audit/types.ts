// KashifWeb design reminder: evidence-led, Arabic-first, local-only analysis; avoid generic score dashboards.
export type FindingCategory = "rtl" | "seo" | "structure" | "accessibility" | "performance";
export type FindingSeverity = "error" | "warning" | "info";

export interface Finding {
  id: string;
  category: FindingCategory;
  severity: FindingSeverity;
  title: string;
  rationale: string;
  evidence: string;
  recommendation: string;
  reference: string;
}

export interface AuditReport {
  generatedAt: string;
  sourceLabel: string;
  initialIndex: number;
  analysisDurationMs: number;
  rulePackVersion: string;
  findings: Finding[];
  reviewScore?: import("./score").ReviewScore;
  limitations: string[];
}
