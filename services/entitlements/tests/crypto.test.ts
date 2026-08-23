import { describe, expect, it } from "vitest";
import { safeEqual } from "../src/crypto";
import { accessState } from "../src/gumroad";

describe("entitlement helpers", () => {
  it("compares equal-length values without a direct equality short-cut", () => {
    expect(safeEqual("matching", "matching")).toBe(true);
    expect(safeEqual("matching", "mismatch")).toBe(false);
  });

  it("ends access when Gumroad reports a membership end", () => {
    expect(accessState({ product_id: "p", license_key: "k", subscription_ended_at: "2026-08-23T00:00:00Z" })).toBe("ended");
    expect(accessState({ product_id: "p", license_key: "k" })).toBe("active");
  });
});
