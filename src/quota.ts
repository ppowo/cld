import type { QuotaConfig, QuotaResponse } from './providers/types';
import type { Config } from './config';

export interface QuotaResult {
  success: boolean;
  data?: QuotaResponse;
  error?: string;
}

// Named parsers for different quota API formats
const quotaParsers: Record<string, (data: unknown) => QuotaResponse> = {
  // Synthetic: { subscription: { limit, requests, renewsAt } }
  synthetic: (data) => {
    const d = data as { subscription: { limit: number; requests: number; renewsAt: string } };
    const remaining = d.subscription.limit - d.subscription.requests;
    return {
      used: d.subscription.requests / d.subscription.limit,
      // No active window if no requests made yet
      reset: d.subscription.requests > 0 ? d.subscription.renewsAt : null,
      remaining,
      total: d.subscription.limit,
    };
  },
  // Firmware: { used, reset } - reset is null when no active 5h window
  firmware: (data) => {
    const d = data as { used: number; reset: string | null };
    // Pass through null reset to indicate no active window
    return { used: d.used, reset: d.reset ?? null };
  },
};

export async function fetchQuota(
  quota: QuotaConfig,
  config: Config
): Promise<QuotaResult> {
  const apiKey = config.keys[quota.authKeyName];
  if (!apiKey) {
    return { success: false, error: 'no key' };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(quota.url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` };
    }

    const rawData = await response.json();
    const parser = quota.parser ? quotaParsers[quota.parser] : null;
    const data = parser ? parser(rawData) : (rawData as QuotaResponse);
    return { success: true, data };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, error: 'timeout' };
    }
    return { success: false, error: 'network error' };
  }
}

export function formatQuota(result: QuotaResult): string {
  if (!result.success) {
    return ' err';
  }

  const { used, reset, remaining: remainingCount, total } = result.data!;
  const remainingRatio = 1 - used;

  // Quota amount (no "left" suffix)
  const amt = remainingCount !== undefined && total !== undefined
    ? `${remainingCount}/${total}`
    : `${Math.floor(remainingRatio * 100)}%`;

  // Compact reset time (keep minutes)
  let resetStr = '';
  if (reset) {
    const diffMs = new Date(reset).getTime() - Date.now();
    if (diffMs > 0) {
      const h = Math.floor(diffMs / 3600000);
      const m = Math.floor((diffMs % 3600000) / 60000);
      resetStr = h > 0 ? ` ~${h}h${m > 0 ? m + 'm' : ''}` : ` ~${m}m`;
    }
  } else {
    // No active quota window - window starts on first use
    resetStr = ' ~5h on use';
  }

  return ` ${amt}${resetStr}`;
}
