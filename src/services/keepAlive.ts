/**
 * keepAlive — Pings the backend health endpoint every INTERVAL ms
 * to prevent Render free-tier services from sleeping.
 *
 * Start once at app boot via startKeepAlive().
 * Safe to call multiple times — only one interval runs at a time.
 */

import { BASE_URL } from "./api";

const INTERVAL_MS = 2 * 60 * 1000; // 2 minutes
let _timerId: ReturnType<typeof setInterval> | null = null;

async function ping() {
  try {
    await fetch(`${BASE_URL}/health/`, { method: "GET", cache: "no-store" });
  } catch {
    // Silently swallow — backend may be waking up; next ping will succeed
  }
}

export function startKeepAlive() {
  if (_timerId !== null) return; // already running
  ping(); // immediate first ping on load
  _timerId = setInterval(ping, INTERVAL_MS);
}

export function stopKeepAlive() {
  if (_timerId !== null) {
    clearInterval(_timerId);
    _timerId = null;
  }
}
