// KashifWeb Pro workspace: local-first report history. No source HTML/CSS is stored here.
import type { AuditReport } from "../audit/types";

const STORAGE_KEY = "kashifweb:pro-workspace:v1";

export interface SavedReport {
  id: string;
  label: string;
  savedAt: string;
  report: AuditReport;
}

export interface ReportDelta {
  newFindings: string[];
  resolvedFindings: string[];
  persistentFindings: string[];
}

function getStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function listSavedReports(): SavedReport[] {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const parsed = JSON.parse(storage.getItem(STORAGE_KEY) ?? "[]") as SavedReport[];
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id && item?.report?.findings).slice(0, 18) : [];
  } catch {
    return [];
  }
}

export function saveReport(report: AuditReport, label: string): SavedReport {
  const storage = getStorage();
  if (!storage) throw new Error("تعذر الوصول إلى مساحة التخزين المحلية في المتصفح.");
  const saved: SavedReport = {
    id: crypto.randomUUID(),
    label: label.trim() || report.sourceLabel || "تقرير محلي",
    savedAt: new Date().toISOString(),
    report,
  };
  storage.setItem(STORAGE_KEY, JSON.stringify([saved, ...listSavedReports()].slice(0, 18)));
  return saved;
}

export function removeReport(id: string): void {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(listSavedReports().filter((item) => item.id !== id)));
}

export function compareReports(baseline: AuditReport, current: AuditReport): ReportDelta {
  const before = new Set(baseline.findings.map((finding) => finding.id));
  const after = new Set(current.findings.map((finding) => finding.id));
  return {
    newFindings: [...after].filter((id) => !before.has(id)),
    resolvedFindings: [...before].filter((id) => !after.has(id)),
    persistentFindings: [...after].filter((id) => before.has(id)),
  };
}
