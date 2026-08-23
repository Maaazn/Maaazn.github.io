import type { AuditReport, FindingSeverity } from "../audit/types";

export interface ShareCardPayload {
  version: 1;
  sourceLabel: string;
  generatedAt: string;
  initialIndex: number;
  totalFindings: number;
  counts: Record<FindingSeverity, number>;
  topFindings: Array<{ id: string; title: string; severity: FindingSeverity }>;
}

const MAX_PAYLOAD_BYTES = 6_144;

function toBase64(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function fromBase64(value: string): string {
  const binary = atob(value);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function makeShareCard(report: AuditReport): ShareCardPayload {
  const counts: Record<FindingSeverity, number> = { error: 0, warning: 0, info: 0 };
  report.findings.forEach((finding) => { counts[finding.severity] += 1; });
  return {
    version: 1,
    sourceLabel: report.sourceLabel,
    generatedAt: report.generatedAt,
    initialIndex: report.initialIndex,
    totalFindings: report.findings.length,
    counts,
    topFindings: report.findings.slice(0, 6).map(({ id, title, severity }) => ({ id, title, severity })),
  };
}

export function createShareCardUrl(report: AuditReport, baseUrl = `${location.origin}${location.pathname}`): string {
  const payload = JSON.stringify(makeShareCard(report));
  const payloadBytes = new TextEncoder().encode(payload).byteLength;
  if (payloadBytes > MAX_PAYLOAD_BYTES) throw new Error("ملخص التقرير أكبر من الحد المحلي لبطاقة المشاركة.");
  return `${baseUrl}#card=${encodeURIComponent(toBase64(payload))}`;
}

export function parseShareCard(hash: string): ShareCardPayload | null {
  if (!hash.startsWith("card=")) return null;
  try {
    const parsed = JSON.parse(fromBase64(decodeURIComponent(hash.slice(5)))) as Partial<ShareCardPayload>;
    if (parsed.version !== 1 || typeof parsed.initialIndex !== "number" || !Array.isArray(parsed.topFindings)) return null;
    return parsed as ShareCardPayload;
  } catch {
    return null;
  }
}
