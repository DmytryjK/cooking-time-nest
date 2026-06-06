import { appendFileSync } from 'fs';
import { join } from 'path';

const DEBUG_LOG_PATH = join(process.cwd(), 'debug-b609e0.log');
const DEBUG_INGEST_URL =
  'http://host.docker.internal:7408/ingest/44d679b7-a782-44f1-be05-7f40531dfa2b';

export function agentDebugLog(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown> = {},
  runId = 'pre-fix',
): void {
  const payload = {
    sessionId: 'b609e0',
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
    runId,
  };

  // #region agent log
  try {
    appendFileSync(DEBUG_LOG_PATH, `${JSON.stringify(payload)}\n`);
  } catch {
    /* ignore */
  }

  fetch(DEBUG_INGEST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Debug-Session-Id': 'b609e0',
    },
    body: JSON.stringify(payload),
  }).catch(() => {});
  // #endregion
}
