/**
 * Operational alerting without an extra SDK.
 *
 * Set ALERT_WEBHOOK_URL to a Slack, Discord or generic JSON endpoint and the
 * API will report database outages and server errors there. Identical alerts
 * are rate-limited so a broken database does not flood the channel.
 *
 * Alerting never throws: a failed webhook must not affect the response.
 */
const recent = new Map<string, number>();
const DEDUPE_WINDOW_MS = 5 * 60_000;
const MAX_KEYS = 200;

export interface AlertPayload {
  title: string;
  message: string;
  path?: string;
  method?: string;
  status?: number;
  detail?: string;
}

export function sendAlert(payload: AlertPayload): void {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url || typeof fetch !== 'function') return;

  const key = `${payload.title}:${payload.method || ''}:${payload.path || ''}`;
  const now = Date.now();
  const last = recent.get(key);
  if (last && now - last < DEDUPE_WINDOW_MS) return;

  if (recent.size > MAX_KEYS) recent.clear();
  recent.set(key, now);

  const lines = [
    `*${payload.title}*`,
    payload.method && payload.path
      ? `${payload.method} ${payload.path}`
      : payload.path || '',
    payload.status ? `status=${payload.status}` : '',
    payload.message,
    payload.detail ? `\n\`\`\`${payload.detail.slice(0, 1200)}\`\`\`` : '',
  ].filter(Boolean);

  const text = lines.join('\n');

  void fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text, content: text, ...payload }),
    signal: AbortSignal.timeout?.(5000),
  }).catch(() => undefined);
}
