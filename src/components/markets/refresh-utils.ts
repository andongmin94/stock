import { AUTO_REFRESH_INTERVAL_MS } from "./constants";

export function getNextAutoRefreshDelay() {
  const remainder = Date.now() % AUTO_REFRESH_INTERVAL_MS;

  if (remainder === 0) {
    return AUTO_REFRESH_INTERVAL_MS;
  }

  return AUTO_REFRESH_INTERVAL_MS - remainder;
}
