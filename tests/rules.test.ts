import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { auditHtml, rulePack } from "../src/audit/engine";
import { createShareCardUrl, parseShareCard } from "../src/report/card";

const fixture = (name: string) => readFileSync(resolve(process.cwd(), "tests", "fixtures", name), "utf8");
const findingIds = (name: string) => auditHtml(fixture(name)).findings.map((finding) => finding.id);

describe("KashifWeb Arabic rule pack", () => {
  it("keeps an explicit local rule pack", () => {
    expect(rulePack.length).toBeGreaterThanOrEqual(20);
    expect(new Set(rulePack.map((rule) => rule.id)).size).toBe(rulePack.length);
  });

  it("detects the Arabic and structural signals in a deliberately risky local fixture", () => {
    expect(findingIds("arabic-risk.html")).toEqual(expect.arrayContaining([
      "rtl.language",
      "rtl.direction",
      "rtl.logical-css",
      "rtl.mixed-bidi",
      "rtl.decimal-leading-numerals",
      "rtl.form-direction",
      "seo.og-locale",
      "seo.hreflang-region",
      "structure.heading-order",
      "structure.image-alt",
      "structure.image-alt-empty",
      "structure.form-labels",
    ]));
  });

  it("does not report the targeted Arabic readiness signals in a prepared local fixture", () => {
    const ids = findingIds("arabic-prepared.html");
    expect(ids).not.toEqual(expect.arrayContaining([
      "rtl.language",
      "rtl.direction",
      "rtl.logical-css",
      "rtl.mixed-bidi",
      "rtl.form-direction",
      "seo.og-locale",
      "structure.image-alt",
      "structure.image-alt-empty",
      "structure.form-labels",
    ]));
  });

  it("creates a local share card without embedding the inspected source", () => {
    const report = auditHtml(fixture("arabic-risk.html"));
    const url = createShareCardUrl(report, "https://kashifweb.test/");
    const payload = parseShareCard(new URL(url).hash.slice(1));
    expect(url).not.toContain("margin-left");
    expect(payload?.totalFindings).toBe(report.findings.length);
    expect(payload?.topFindings[0]?.id).toBe(report.findings[0]?.id);
  });

  it("keeps local-business advice conservative and local", () => {
    const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="UTF-8"><title>متجر محلي</title><script type="application/ld+json">{"@context":"https://schema.org","@type":"LocalBusiness","name":"متجر مثال"}</script></head><body><h1>متجر مثال</h1></body></html>`;
    const report = auditHtml(html);
    expect(report.findings.map((finding) => finding.id)).toContain("seo.local-business-basics");
    expect(report.rulePackVersion).toBe("0.4.0");
    expect(report.analysisDurationMs).toBeGreaterThanOrEqual(0);
  });
});
