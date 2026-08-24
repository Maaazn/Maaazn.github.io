import type { AuditReport, Finding } from "./types";

const rank: Record<Finding["severity"], number> = { error: 0, warning: 1, info: 2 };

export function buildActionPlan(report: AuditReport): string {
  const date = new Intl.DateTimeFormat("ar-SA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(report.generatedAt));
  const ordered = [...report.findings].sort((left, right) => rank[left.severity] - rank[right.severity] || left.id.localeCompare(right.id));
  const steps = ordered.map((finding, index) => [
    `## ${index + 1}. ${finding.title}`,
    `- **المعرف:** \`${finding.id}\` · **الأولوية:** ${finding.severity}`,
    `- **الدليل المرصود:** ${finding.evidence}`,
    `- **الإجراء المقترح:** ${finding.recommendation}`,
    `- **المرجع:** ${finding.reference}`,
  ].join("\n"));
  return [
    "# خطة إصلاح محلية من KashifWeb",
    `- **المصدر:** ${report.sourceLabel}`,
    `- **تاريخ التقرير:** ${date}`,
    `- **حزمة القواعد:** ${report.rulePackVersion}`,
    `- **مؤشر محلي:** ${report.initialIndex}/100 — ليس تصنيفاً خارجياً أو وعداً بالقبول.`,
    "",
    ordered.length ? steps.join("\n\n") : "لا توجد إشارات من القواعد المطبقة. راجع حدود التقرير واختبر الصفحة في المتصفحات المستهدفة.",
    "",
    "## حدود الخطة",
    ...report.limitations.map((item) => `- ${item}`),
  ].join("\n");
}
