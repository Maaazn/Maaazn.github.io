// KashifWeb review score: transparent source-signal prioritization, never an external ranking.
import type { Finding, FindingCategory } from "./types";
import type { AuditRule } from "../rules/types";

export interface ReviewScoreCategory {
  category: FindingCategory;
  label: string;
  ruleCount: number;
  findingCount: number;
  deduction: number;
  score: number;
}

export interface ReviewScore {
  value: number;
  label: string;
  method: string;
  categories: ReviewScoreCategory[];
}

const CATEGORY_SETTINGS: Record<FindingCategory, { label: string; weight: number; multiplier: number }> = {
  rtl: { label: "العربية وRTL", weight: 20, multiplier: 1.1 },
  seo: { label: "البيانات والاكتشاف", weight: 20, multiplier: 0.9 },
  structure: { label: "بنية المحتوى", weight: 25, multiplier: 1 },
  accessibility: { label: "الإتاحة", weight: 25, multiplier: 1.1 },
  performance: { label: "أداء المصدر", weight: 10, multiplier: 0.65 },
};

const SEVERITY_DEDUCTION = { error: 30, warning: 9, info: 2.5 } as const;
const INFO_DEDUCTION_CAP = 16;

function reviewLabel(value: number): string {
  if (value >= 90) return "متماسك ضمن نطاق المصدر";
  if (value >= 75) return "يحتاج مراجعة مركزة";
  if (value >= 55) return "يحتاج إصلاحات واضحة";
  return "يتطلب معالجة أساسية";
}

export function buildReviewScore(findings: Finding[], rules: AuditRule[]): ReviewScore {
  const categories = (Object.keys(CATEGORY_SETTINGS) as FindingCategory[]).map((category) => {
    const categoryFindings = findings.filter((finding) => finding.category === category);
    const directDeduction = categoryFindings.filter((finding) => finding.severity !== "info").reduce((sum, finding) => sum + SEVERITY_DEDUCTION[finding.severity], 0);
    const infoDeduction = Math.min(INFO_DEDUCTION_CAP, categoryFindings.filter((finding) => finding.severity === "info").length * SEVERITY_DEDUCTION.info);
    const deduction = Math.min(100, Math.round((directDeduction + infoDeduction) * CATEGORY_SETTINGS[category].multiplier));
    return {
      category,
      label: CATEGORY_SETTINGS[category].label,
      ruleCount: rules.filter((rule) => rule.category === category).length,
      findingCount: categoryFindings.length,
      deduction,
      score: 100 - deduction,
    };
  });
  const value = Math.round(categories.reduce((sum, item) => sum + item.score * CATEGORY_SETTINGS[item.category].weight, 0) / 100);
  return {
    value,
    label: reviewLabel(value),
    method: "خصم معلن حسب شدة الإشارات ضمن كل فئة، مع سقف لتأثير الملاحظات السياقية؛ لا يقيس زحفاً أو JavaScript أو ترتيباً خارجياً.",
    categories,
  };
}
