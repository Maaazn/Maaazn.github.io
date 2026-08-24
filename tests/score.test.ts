import { describe, expect, it } from "vitest";
import { buildReviewScore } from "../src/audit/score";
import { rulePack } from "../src/audit/engine";
import type { Finding } from "../src/audit/types";

const finding = (severity: Finding["severity"], category: Finding["category"], id: string): Finding => ({ id, severity, category, title: id, rationale: "", evidence: "", recommendation: "", reference: "" });

describe("KashifWeb review score", () => {
  it("prioritizes a critical source signal above a large set of optional hints", () => {
    const critical = buildReviewScore([finding("error", "accessibility", "accessibility.empty-button")], rulePack);
    const optional = buildReviewScore(Array.from({ length: 30 }, (_, index) => finding("info", "seo", `seo.optional-${index}`)), rulePack);
    expect(critical.value).toBeLessThan(optional.value);
  });

  it("returns all rule areas and makes the contributing deductions inspectable", () => {
    const score = buildReviewScore([finding("warning", "rtl", "rtl.direction"), finding("info", "performance", "performance.css-import")], rulePack);
    expect(score.categories).toHaveLength(5);
    expect(score.categories.find((category) => category.category === "rtl")).toMatchObject({ findingCount: 1, deduction: 10, score: 90 });
    expect(score.method).toContain("لا يقيس زحفاً");
  });
});
