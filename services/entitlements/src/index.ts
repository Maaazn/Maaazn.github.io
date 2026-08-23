import { base64UrlDecodeText, base64UrlText, safeEqual, sha256, sign } from "./crypto";
import { accessState, verifyLicense } from "./gumroad";
import type { Env } from "./env";

interface SessionPayload {
  sub: string;
  plan: "pro";
  exp: number;
}

interface SyncedReport {
  id: string;
  label: string;
  generatedAt: string;
  savedAt: string;
  initialIndex: number;
  rulePackVersion: string;
  counts: { error: number; warning: number; info: number };
  findingIds: string[];
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

async function sessionSubject(request: Request, env: Env): Promise<string | null> {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const [encoded, signature] = token.split(".");
  if (!encoded || !signature || !safeEqual(signature, await sign(encoded, env.SESSION_SIGNING_SECRET))) return null;
  try {
    const payload = JSON.parse(base64UrlDecodeText(encoded)) as SessionPayload;
    return payload.plan === "pro" && typeof payload.sub === "string" && payload.exp > Math.floor(Date.now() / 1000) ? payload.sub : null;
  } catch {
    return null;
  }
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
  ).bind(licenseHash, subscriptionId, status, new Date().toISOString(), eventFingerprint).run();
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
  if (!body || typeof body.licenseKey !== "string" || body.licenseKey.trim().length < 8) return response({ error: "أدخل مفتاح Gumroad الصحيح." }, 400, origin);
  try {
    const entitlement = await activateFromLicense(body.licenseKey, env);
    if (entitlement.status !== "active") return response({ error: "الاشتراك غير نشط حالياً." }, 403, origin);
    return response({ token: await issueSession(entitlement.licenseHash, env), expiresIn: 3600 }, 200, origin);
  } catch (error) {
    return response({ error: error instanceof Error ? error.message : "تعذر التحقق من الاشتراك." }, 401, origin);
  }
}

function parseSyncedReports(body: unknown): SyncedReport[] | null {
  if (!body || typeof body !== "object" || !Array.isArray((body as { reports?: unknown }).reports)) return null;
  const reports = (body as { reports: unknown[] }).reports;
  if (reports.length > 30) return null;
  const parsed: SyncedReport[] = [];
  for (const item of reports) {
    const report = item as Partial<SyncedReport>;
    const counts = report.counts as SyncedReport["counts"] | undefined;
    const validCounts = counts && [counts.error, counts.warning, counts.info].every((value) => Number.isInteger(value) && value >= 0);
    if (typeof report.id !== "string" || typeof report.label !== "string" || typeof report.generatedAt !== "string" || typeof report.savedAt !== "string" || typeof report.initialIndex !== "number" || typeof report.rulePackVersion !== "string" || !validCounts || !Array.isArray(report.findingIds) || report.id.length > 80 || report.label.length > 160 || report.findingIds.length > 300) return null;
    parsed.push({
      id: report.id, label: report.label, generatedAt: report.generatedAt, savedAt: report.savedAt, initialIndex: report.initialIndex,
      rulePackVersion: report.rulePackVersion, counts, findingIds: report.findingIds.filter((value): value is string => typeof value === "string" && value.length <= 120),
    });
  }
  return parsed;
}

async function handleReports(request: Request, env: Env, origin?: string): Promise<Response> {
  const owner = await sessionSubject(request, env);
  if (!owner) return response({ error: "جلسة Pro غير صالحة أو منتهية." }, 401, origin);

  if (request.method === "GET") {
    const { results } = await env.DB.prepare(
      "SELECT id, label, generated_at, saved_at, initial_index, rule_pack_version, error_count, warning_count, info_count, finding_ids_json FROM synced_reports WHERE owner_hash = ? ORDER BY saved_at DESC LIMIT 30",
    ).bind(owner).all();
    const reports = results.map((row) => ({
      id: String(row.id), label: String(row.label), generatedAt: String(row.generated_at), savedAt: String(row.saved_at), initialIndex: Number(row.initial_index), rulePackVersion: String(row.rule_pack_version),
      counts: { error: Number(row.error_count), warning: Number(row.warning_count), info: Number(row.info_count) }, findingIds: JSON.parse(String(row.finding_ids_json)),
    }));
    return response({ reports }, 200, origin);
  }

  if (request.method === "POST") {
    const reports = parseSyncedReports(await request.json().catch(() => null));
    if (!reports) return response({ error: "حمولة مزامنة غير صالحة." }, 400, origin);
    const now = new Date().toISOString();
    await env.DB.batch(reports.map((report) => env.DB.prepare(
      `INSERT INTO synced_reports (id, owner_hash, label, generated_at, saved_at, initial_index, rule_pack_version, error_count, warning_count, info_count, finding_ids_json, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(owner_hash, id) DO UPDATE SET label = excluded.label, saved_at = excluded.saved_at, initial_index = excluded.initial_index, rule_pack_version = excluded.rule_pack_version, error_count = excluded.error_count, warning_count = excluded.warning_count, info_count = excluded.info_count, finding_ids_json = excluded.finding_ids_json, updated_at = excluded.updated_at`,
    ).bind(report.id, owner, report.label, report.generatedAt, report.savedAt, report.initialIndex, report.rulePackVersion, report.counts.error, report.counts.warning, report.counts.info, JSON.stringify(report.findingIds), now)));
    return response({ stored: reports.length }, 200, origin);
  }

  return response({ error: "Not found" }, 404, origin);
}

async function handleWebhook(request: Request, env: Env): Promise<Response> {
  const form = await request.formData();
  const licenseKey = form.get("license_key");
  const productId = form.get("product_id");
  const eventType = String(form.get("resource_name") || "sale");
  if (typeof licenseKey !== "string" || productId !== env.PRO_PRODUCT_ID) return response({ received: true }, 202);
  const fingerprint = await sha256(`${eventType}:${licenseKey}:${String(form.get("sale_id") || form.get("subscription_id") || "")}`);
  const seen = await env.DB.prepare("SELECT fingerprint FROM webhook_events WHERE fingerprint = ?").bind(fingerprint).first();
  if (seen) return response({ received: true, duplicate: true });
  try {
    await activateFromLicense(licenseKey, env, fingerprint);
    await env.DB.prepare("INSERT INTO webhook_events (fingerprint, received_at, event_type) VALUES (?, ?, ?)").bind(fingerprint, new Date().toISOString(), eventType).run();
    return response({ received: true });
  } catch {
    return response({ received: true }, 202);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = allowedOrigin(request, env);
    if (request.method === "OPTIONS" && origin) {
      return new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", Vary: "Origin" } });
    }
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/health") return response({ ok: true });
    if (request.method === "POST" && url.pathname === "/v1/session" && origin) return handleSession(request, env, origin);
    if (["GET", "POST"].includes(request.method) && url.pathname === "/v1/reports" && origin) return handleReports(request, env, origin);
    if (request.method === "POST" && url.pathname === "/v1/gumroad/webhook") return handleWebhook(request, env);
    return response({ error: "Not found" }, 404, origin);
  },
} satisfies ExportedHandler<Env>;

export { safeEqual };
