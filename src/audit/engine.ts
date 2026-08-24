import type { AuditReport, Finding } from "./types";
import { hasArabicText, type AuditRule } from "../rules/types";
import { arabicRules } from "../rules/arabic";
import { seoRules } from "../rules/seo";
import { structureRules } from "../rules/structure";
import { qualityRules } from "../rules/quality";

export const rulePack: AuditRule[] = [...arabicRules, ...seoRules, ...structureRules, ...qualityRules];
export const RULE_PACK_VERSION = "0.4.0";

function calculateIndex(findings: Finding[]): number {
  const deduction = findings.reduce((total, finding) => total + ({ error: 14, warning: 6, info: 2 }[finding.severity]), 0);
  return Math.max(0, 100 - deduction);
}

export function auditHtml(html: string, suppliedCss = "", sourceLabel = "مصدر محلي"): AuditReport {
  const startedAt = typeof performance !== "undefined" ? performance.now() : Date.now();
  const document = new DOMParser().parseFromString(html, "text/html");
  const inlineCss = [...document.querySelectorAll("style")].map((style) => style.textContent ?? "").join("\n");
  const context = {
    document,
    cssText: `${inlineCss}\n${suppliedCss}`,
    containsArabic: hasArabicText(document),
  };
  const findings = rulePack.flatMap((rule) => {
    const result = rule.evaluate(context);
    return result ? [result] : [];
  });
  const finishedAt = typeof performance !== "undefined" ? performance.now() : Date.now();

  return {
    generatedAt: new Date().toISOString(),
    sourceLabel,
    initialIndex: calculateIndex(findings),
    analysisDurationMs: Math.max(0, Math.round(finishedAt - startedAt)),
    rulePackVersion: RULE_PACK_VERSION,
    findings,
    limitations: [
      "هذا تقرير قواعد مبدئي، وليس شهادة WCAG أو SEO أو أمان.",
      "لا يحلل JavaScript الذي يغيّر الصفحة بعد التحميل ولا موارد CSS الخارجية غير المقدمة.",
      "فحص URL يعتمد على سماح الموقع المستهدف بقراءة CORS من المتصفح.",
      "المؤشر محلي ويُحسب من قواعد كاشف المرصودة فقط، ولا يمثل ترتيباً خارجياً.",
    ],
  };
}
