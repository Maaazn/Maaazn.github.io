// KashifWeb Pro sync: only report counts and finding IDs leave the device; never HTML/CSS or license keys.
import type { SavedReport } from "./workspace";
import { currentProSession, entitlementApi } from "./entitlement";

export interface SyncedReportSummary {
  id: string;
  label: string;
  generatedAt: string;
  savedAt: string;
  initialIndex: number;
  rulePackVersion: string;
  counts: { error: number; warning: number; info: number };
  findingIds: string[];
}

function summary(report: SavedReport): SyncedReportSummary {
  const findings = report.report.findings;
  return {
    id: report.id,
    label: report.label,
    generatedAt: report.report.generatedAt,
    savedAt: report.savedAt,
    initialIndex: report.report.initialIndex,
    rulePackVersion: report.report.rulePackVersion,
    counts: {
      error: findings.filter((item) => item.severity === "error").length,
      warning: findings.filter((item) => item.severity === "warning").length,
      info: findings.filter((item) => item.severity === "info").length,
    },
    findingIds: findings.map((item) => item.id),
  };
}

export async function syncWorkspace(reports: SavedReport[]): Promise<SyncedReportSummary[]> {
  const api = entitlementApi();
  const session = currentProSession();
  if (!api || !session) throw new Error("يتطلب النسخ المتزامن جلسة Pro نشطة." );
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` };
  const stored = await fetch(`${api}/v1/reports`, { method: "POST", headers, body: JSON.stringify({ reports: reports.map(summary) }) });
  if (!stored.ok) throw new Error("تعذر حفظ ملخصات مساحة العمل بأمان.");
  const loaded = await fetch(`${api}/v1/reports`, { headers: { Authorization: `Bearer ${session.token}` } });
  const body = (await loaded.json().catch(() => null)) as { reports?: SyncedReportSummary[]; error?: string } | null;
  if (!loaded.ok || !body?.reports) throw new Error(body?.error || "تعذر قراءة ملخصات Pro المتزامنة.");
  return body.reports;
}
