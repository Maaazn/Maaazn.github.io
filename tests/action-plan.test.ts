import { describe, expect, it } from "vitest";
import { buildActionPlan } from "../src/audit/action-plan";
import type { AuditReport } from "../src/audit/types";

describe("local action plan", () => {
  it("orders repair steps by severity without exposing inspected source", () => {
    const report: AuditReport = {
      generatedAt: "2026-08-25T00:00:00.000Z",
      sourceLabel: "مصدر محلي",
      initialIndex: 76,
      analysisDurationMs: 1,
      rulePackVersion: "0.4.0",
      limitations: ["لا ينفذ JavaScript."],
      findings: [
        { id: "info.rule", category: "seo", severity: "info", title: "معلومة", rationale: "", evidence: "دليل معلومة", recommendation: "تحسين", reference: "مرجع" },
        { id: "error.rule", category: "accessibility", severity: "error", title: "خطأ", rationale: "", evidence: "دليل خطأ", recommendation: "إصلاح", reference: "مرجع" },
      ],
    };
    const plan = buildActionPlan(report);
    expect(plan.indexOf("خطأ")).toBeLessThan(plan.indexOf("معلومة"));
    expect(plan).toContain("`error.rule`");
    expect(plan).not.toContain("<html");
  });
});
