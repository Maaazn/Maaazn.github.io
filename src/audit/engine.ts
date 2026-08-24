import type { AuditReport } from "./types";
import { hasArabicText, type AuditRule } from "../rules/types";
import { arabicRules } from "../rules/arabic";
import { seoRules } from "../rules/seo";
import { structureRules } from "../rules/structure";
import { qualityRules } from "../rules/quality";
import { extendedRules } from "../rules/extended";
import { buildReviewScore } from "./score";

export const rulePack: AuditRule[] = [...arabicRules, ...seoRules, ...structureRules, ...qualityRules, ...extendedRules];
export const RULE_PACK_VERSION = "0.5.0";

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
  const reviewScore = buildReviewScore(findings, rulePack);

  return {
    generatedAt: new Date().toISOString(),
    sourceLabel,
    initialIndex: reviewScore.value,
    analysisDurationMs: Math.max(0, Math.round(finishedAt - startedAt)),
    rulePackVersion: RULE_PACK_VERSION,
    findings,
    reviewScore,
    limitations: [
      "هذا تقرير قواعد مبدئي، وليس شهادة WCAG أو SEO أو أمان.",
      "لا يحلل JavaScript الذي يغيّر الصفحة بعد التحميل ولا موارد CSS الخارجية غير المقدمة.",
      "فحص URL يعتمد على سماح الموقع المستهدف بقراءة CORS من المتصفح.",
      "مؤشر المراجعة محلي وتفسيري: يوزع أثر الإشارات حسب شدتها وفئتها، ولا يمثل ترتيباً خارجياً أو موافقة إعلانية.",
    ],
  };
}
