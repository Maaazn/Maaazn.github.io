import { base64UrlText, safeEqual, sha256, sign } from "./crypto";
import { accessState, verifyLicense } from "./gumroad";
import type { Env } from "./env";

interface SessionPayload {
  sub: string;
  plan: "pro";
  exp: number;
}

function response(body: unknown, status = 200, origin?: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...(origin ? { "Access-Control-Allow-Origin": origin, Vary: "Origin" } : {}),
    },
  });
}

function allowedOrigin(request: Request, env: Env): string | undefined {
  return request.headers.get("Origin") === env.ALLOWED_ORIGIN ? env.ALLOWED_ORIGIN : undefined;
}

async function issueSession(licenseHash: string, env: Env): Promise<string> {
  const payload: SessionPayload = { sub: licenseHash, plan: "pro", exp: Math.floor(Date.now() / 1000) + 60 * 60 };
  const encoded = base64UrlText(JSON.stringify(payload));
  return `${encoded}.${await sign(encoded, env.SESSION_SIGNING_SECRET)}`;
}

async function storeEntitlement(licenseHash: string, status: string, subscriptionId: string | null, eventFingerprint: string | null, env: Env): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO entitlements (license_hash, subscription_id, status, updated_at, last_event_fingerprint)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(license_hash) DO UPDATE SET
       subscription_id = excluded.subscription_id,
       status = excluded.status,
       updated_at = excluded.updated_at,
       last_event_fingerprint = excluded.last_event_fingerprint`,
  )
    .bind(licenseHash, subscriptionId, status, new Date().toISOString(), eventFingerprint)
    .run();
}

async function activateFromLicense(licenseKey: string, env: Env, eventFingerprint: string | null = null) {
  const purchase = await verifyLicense(env.PRO_PRODUCT_ID, licenseKey);
  const status = accessState(purchase);
  const licenseHash = await sha256(licenseKey.trim());
  await storeEntitlement(licenseHash, status, purchase.subscription_id || null, eventFingerprint, env);
  return { status, licenseHash };
}

async function handleSession(request: Request, env: Env, origin?: string): Promise<Response> {
  const body = (await request.json().catch(() => null)) as { licenseKey?: unknown } | null;
  if (!body || typeof body.licenseKey !== "string" || body.licenseKey.trim().length < 8) {
    return response({ error: "أدخل مفتاح Gumroad الصحيح." }, 400, origin);
  }
  try {
    const entitlement = await activateFromLicense(body.licenseKey, env);
    if (entitlement.status !== "active") {
      return response({ error: "الاشتراك غير نشط حالياً." }, 403, origin);
    }
    return response({ token: await issueSession(entitlement.licenseHash, env), expiresIn: 3600 }, 200, origin);
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : "تعذر التحقق من الاشتراك." }, 401, origin);
  }
}

async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const form = await request.formData();
  const licenseKey = form.get("license_key");
  const productId = form.get("product_id");
  const eventType = String(form.get("resource_name") || "sale");
  if (typeof licenseKey !== "string" || productId !== env.PRO_PRODUCT_ID) {
    return response({ received: true }, 202);
  }

  const fingerprint = await sha256(`${eventType}:${licenseKey}:${String(form.get("sale_id") || form.get("subscription_id") || "")}`);
  const seen = await env.DB.prepare("SELECT fingerprint FROM webhook_events WHERE fingerprint = ?").bind(fingerprint).first();
  if (seen) return response({ received: true, duplicate: true });

  try {
    await activateFromLicense(licenseKey, env, fingerprint);
    await env.DB.prepare("INSERT INTO webhook_events (fingerprint, received_at, event_type) VALUES (?, ?, ?)")
      .bind(fingerprint, new Date().toISOString(), eventType)
      .run();
    return response({ received: true });
  } catch {
    return response({ received: true }, 202);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = allowedOrigin(request, env);
    if (request.method === "OPTIONS" && origin) {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          Vary: "Origin",
        },
      });
    }
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") return response({ ok: true });
    if (request.method === "POST" && url.pathname === "/v1/session" && origin) return handleSession(request, env, origin);
    if (request.method === "POST" && url.pathname === "/v1/gumroad/webhook") return handleWebhook(request, env);
    return response({ error: "Not found" }, 404, origin);
  },
} satisfies ExportedHandler<Env>;

export { safeEqual };
