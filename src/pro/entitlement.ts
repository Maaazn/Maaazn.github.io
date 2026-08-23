// KashifWeb design reminder: privacy-first Pro access; license keys never persist in the browser.
export interface ProSession {
  token: string;
  expiresAt: number;
}

const SESSION_KEY = "kashifweb.pro.session";

export function entitlementApi(): string | null {
  const value = import.meta.env.VITE_ENTITLEMENT_API?.trim().replace(/\/$/, "");
  return value || null;
}

export function currentProSession(): ProSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw) as ProSession;
    if (!session.token || session.expiresAt <= Date.now()) throw new Error("expired");
    return session;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function clearProSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export async function requestProSession(licenseKey: string): Promise<ProSession> {
  const api = entitlementApi();
  if (!api) throw new Error("لم يُفعّل مسار التحقق الخاص بعد.");
  const response = await fetch(`${api}/v1/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ licenseKey }),
  });
  const result = (await response.json().catch(() => null)) as { token?: unknown; expiresIn?: unknown; error?: unknown } | null;
  if (!response.ok || !result || typeof result.token !== "string" || typeof result.expiresIn !== "number") {
    throw new Error(typeof result?.error === "string" ? result.error : "تعذر التحقق من وصول Pro.");
  }
  const session: ProSession = { token: result.token, expiresAt: Date.now() + result.expiresIn * 1000 };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}
