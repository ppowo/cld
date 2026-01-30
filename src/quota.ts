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
    return `[quota: error - ${result.error}]`;
  }

  const { used, reset, remaining: remainingCount, total } = result.data!;
  const remainingRatio = 1 - used;

  // Bar shows remaining (full = good, empty = low)
  const filledCount = Math.floor(remainingRatio * 10);
  const emptyCount = 10 - filledCount;
  const bar = '[' + '='.repeat(filledCount) + '-'.repeat(emptyCount) + ']';

  // Show absolute numbers if available, otherwise percentage
  const quotaStr = remainingCount !== undefined && total !== undefined
    ? `${remainingCount}/${total} left`
    : `${Math.floor(remainingRatio * 100)}% left`;

  let resetStr = '';
  if (reset) {
    const resetTime = new Date(reset);
    const now = new Date();
    const diffMs = resetTime.getTime() - now.getTime();

    if (diffMs > 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (diffHours > 0) {
        resetStr = `, resets in ${diffHours}h ${diffMinutes}m`;
      } else if (diffMinutes > 0) {
        resetStr = `, resets in ${diffMinutes}m`;
      } else {
        resetStr = `, resets soon`;
      }
    }
  } else {
    // No active quota window - window starts on first use
    resetStr = `, 5h window starts on use`;
  }

  return `[quota: ${bar} ${quotaStr}${resetStr}]`;
}
