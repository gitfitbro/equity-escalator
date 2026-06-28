import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import type { AuditEntry, AuditEventType } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIT_PATH = join(__dirname, '../../data/audit.jsonl');

const memoryLog: AuditEntry[] = [];

function ensureAuditFile(): void {
  const dir = dirname(AUDIT_PATH);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  if (!existsSync(AUDIT_PATH)) appendFileSync(AUDIT_PATH, '');
}

export function appendAudit(
  eventType: AuditEventType,
  itemId: string,
  provenanceRef: string,
  payload: Record<string, unknown>,
): AuditEntry {
  const entry: AuditEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    eventType,
    itemId,
    provenanceRef,
    payload,
  };

  memoryLog.push(entry);
  ensureAuditFile();
  appendFileSync(AUDIT_PATH, `${JSON.stringify(entry)}\n`);

  return entry;
}

export function getAuditLog(limit = 100): AuditEntry[] {
  if (existsSync(AUDIT_PATH)) {
    const lines = readFileSync(AUDIT_PATH, 'utf-8')
      .trim()
      .split('\n')
      .filter(Boolean);
    const fromFile = lines.map((line) => JSON.parse(line) as AuditEntry);
    return fromFile.slice(-limit);
  }
  return memoryLog.slice(-limit);
}