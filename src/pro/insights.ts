import { compareReports, type SavedReport } from "./workspace";

export interface WorkspaceInsight {
  savedCount: number;
  latestLabel: string | null;
  latestIndex: number | null;
  delta: { resolved: number; introduced: number; persistent: number } | null;
}

export function buildWorkspaceInsight(reports: SavedReport[]): WorkspaceInsight {
  const [latest, previous] = reports;
  if (!latest) return { savedCount: 0, latestLabel: null, latestIndex: null, delta: null };
  if (!previous) return { savedCount: reports.length, latestLabel: latest.label, latestIndex: latest.report.initialIndex, delta: null };
  const delta = compareReports(previous.report, latest.report);
  return {
    savedCount: reports.length,
    latestLabel: latest.label,
    latestIndex: latest.report.initialIndex,
    delta: { resolved: delta.resolvedFindings.length, introduced: delta.newFindings.length, persistent: delta.persistentFindings.length },
  };
}
