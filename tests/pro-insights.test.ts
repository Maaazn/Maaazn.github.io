import { describe, expect, it } from "vitest";
import { buildWorkspaceInsight } from "../src/pro/insights";
import type { SavedReport } from "../src/pro/workspace";

const saved = (id: string, findingIds: string[], index: number): SavedReport => ({
  id,
  label: `مراجعة ${id}`,
  savedAt: "2026-08-24T12:00:00.000Z",
  report: {
    generatedAt: "2026-08-24T12:00:00.000Z", sourceLabel: "مثال", initialIndex: index, analysisDurationMs: 4, rulePackVersion: "0.5.0", limitations: [],
    findings: findingIds.map((finding) => ({ id: finding, category: "seo", severity: "warning", title: finding, rationale: "سبب", evidence: "دليل", recommendation: "إصلاح", reference: "مرجع" })),
  },
});

describe("Pro workspace insight", () => {
  it("summarizes a saved baseline and an evidence-led delta", () => {
    const insight = buildWorkspaceInsight([saved("new", ["seo.title", "a11y.alt"], 72), saved("old", ["seo.title", "rtl.lang"], 64)]);
    expect(insight).toMatchObject({ savedCount: 2, latestLabel: "مراجعة new", latestIndex: 72, delta: { resolved: 1, introduced: 1, persistent: 1 } });
  });
});
