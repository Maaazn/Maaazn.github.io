import { describe, expect, it } from "vitest";
import { base64UrlDecodeText, base64UrlText } from "../src/crypto";

describe("signed-session encoding", () => {
  it("round-trips a session payload without placing a license key in the payload", () => {
    const payload = { sub: "license-hash-only", plan: "pro", exp: 1700000000 };
    const decoded = JSON.parse(base64UrlDecodeText(base64UrlText(JSON.stringify(payload))));
    expect(decoded).toEqual(payload);
    expect(JSON.stringify(decoded)).not.toContain("GUM-");
  });
});
