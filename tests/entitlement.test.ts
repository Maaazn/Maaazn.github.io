import { afterEach, describe, expect, it, vi } from "vitest";
import { clearProSession, currentProSession, requestProSession } from "../src/pro/entitlement";

describe("Pro entitlement client", () => {
  afterEach(() => {
    clearProSession();
    vi.unstubAllGlobals();
  });

  it("does not persist a license key after requesting a session", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ token: "short-lived", expiresIn: 60 }), { status: 200 })));
    await expect(requestProSession("license-not-stored")).rejects.toThrow("لم يُفعّل مسار التحقق الخاص بعد");
    expect(sessionStorage.getItem("kashifweb.pro.session")).toBeNull();
  });

  it("removes expired sessions", () => {
    sessionStorage.setItem("kashifweb.pro.session", JSON.stringify({ token: "old", expiresAt: Date.now() - 1 }));
    expect(currentProSession()).toBeNull();
  });
});
