import type { Finding, FindingCategory, FindingSeverity } from "../audit/types";

export interface RuleContext {
  document: Document;
  cssText: string;
  containsArabic: boolean;
}

export interface AuditRule {
  id: string;
  category: FindingCategory;
  evaluate(context: RuleContext): Finding | null;
}

export function makeFinding(
  id: string,
  category: FindingCategory,
  severity: FindingSeverity,
  title: string,
  rationale: string,
  evidence: string,
  recommendation: string,
  reference: string,
): Finding {
  return { id, category, severity, title, rationale, evidence, recommendation, reference };
}

export function normalizedText(element: Element | null): string {
  return element?.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

export function hasArabicText(document: Document): boolean {
  return /[\u0600-\u06FF]/.test(document.body?.textContent ?? "");
}
