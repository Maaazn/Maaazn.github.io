import { describe, expect, it } from "vitest";
import { auditHtml } from "../src/audit/engine";

const ids = (html: string, css = "") => auditHtml(html, css).findings.map((finding) => finding.id);

describe("KashifWeb quality rule pack", () => {
  it("finds actionable metadata, accessibility, and structure gaps", () => {
    const findings = ids(`<!doctype html><html><head><title>قصير</title><link rel="canonical" href="/home"><script type="application/ld+json">{broken}</script></head><body><a href="/next"></a><button></button><h2></h2><main><img src="hero.png"></main></body></html>`, ":focus { outline: none; }");
    expect(findings).toEqual(expect.arrayContaining([
      "seo.canonical-absolute",
      "seo.jsonld-invalid",
      "structure.empty-heading",
      "accessibility.empty-link",
      "accessibility.empty-button",
      "accessibility.focus-outline-none",
      "performance.image-dimensions",
    ]));
  });

  it("keeps the targeted quality rules quiet for a prepared document", () => {
    const html = `<!doctype html><html lang="ar"><head><title>دليل كاشف</title><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#123456"><link rel="canonical" href="https://example.test/guide"><link rel="icon" href="/icon.png"><meta property="og:description" content="دليل عملي"><meta property="og:image" content="https://example.test/cover.png"><script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script></head><body><a href="#main">تجاوز</a><nav aria-label="الرئيسية"><a href="/guide">دليل</a></nav><main id="main"><h1>دليل عملي</h1><button aria-label="فتح القائمة"></button><img src="hero.png" alt="غلاف الدليل" width="1200" height="630"></main></body></html>`;
    const findings = ids(html, ":focus-visible { outline: 3px solid #005fcc; }");
    expect(findings).not.toEqual(expect.arrayContaining([
      "seo.canonical-absolute",
      "seo.jsonld-invalid",
      "accessibility.empty-link",
      "accessibility.empty-button",
      "accessibility.focus-outline-none",
      "performance.image-dimensions",
    ]));
  });
});
