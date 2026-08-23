import { describe, expect, it } from "vitest";
import type { SavedReport } from "../src/pro/workspace";

describe("Pro summary data boundary", () => {
  it("keeps raw source fields outside the saved report model", () => {
    const report = { id: "report-1", label: "Review", savedAt: "2026-01-01", report: { generatedAt: "2026-01-01", sourceLabel: "Local", initialIndex: 90, analysisDurationMs: 3, rulePackVersion: "1", limitations: [], findings: [] } } satisfies SavedReport;
    expect(JSON.stringify(report)).not.toContain("<html");
    expect(report.report.sourceLabel).toBe("Local");
  });
});
