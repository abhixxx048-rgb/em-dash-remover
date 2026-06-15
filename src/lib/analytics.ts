// Privacy-safe analytics helper.
//
// Brand promise: your text never leaves your device. This module sends
// COUNTS and metadata ONLY. NEVER pass raw user text, paste contents, input
// values, HTML or document bodies into track() — props are filtered, but the
// caller must never hand user content to this function in the first place.
//
// Everything here is defensive: it never throws, and it is a no-op unless
// Umami is loaded on the page (window.umami present).

// Allowlist of permitted event names. Anything not listed is rejected.
const ALLOWED = new Set([
  'tool_view',
  'input_received',
  'clean_run',
  'first_clean_run',
  'output_copied',
  'output_downloaded',
  'sample_loaded',
  'tool_switched',
  'related_tool_clicked',
  'next_step_clicked',
  'extension_cta_click',
  'obsidian_cta_click',
  'pwa_install',
  'scroll_depth',
  'ad_in_view',
  'share_click',
]);

// Prop keys that might carry user text — always stripped.
const BANNED_KEY = /text|content|input|value|paste|body|html/i;

type Props = Record<string, string | number | boolean>;

/**
 * Send a single analytics event. Safe no-op when Umami is absent or the event
 * name is not allowlisted. Never throws.
 */
export function track(name: string, props?: Props): void {
  try {
    if (!ALLOWED.has(name)) return;

    let safe: Props | undefined;
    if (props) {
      safe = {};
      for (const key in props) {
        if (BANNED_KEY.test(key)) continue; // skip anything that could be user text
        const v = props[key];
        // coerce string props to a max of 64 chars
        safe[key] = typeof v === 'string' ? v.slice(0, 64) : v;
      }
    }

    const w = window as unknown as { umami?: { track: (n: string, p?: Props) => void } };
    w.umami?.track(name, safe);
  } catch {
    // never throw from analytics
  }
}

/** Bucket a length into a coarse range so we never report exact text sizes. */
export function lenBucket(n: number): string {
  if (n <= 0) return '0';
  if (n <= 50) return '1-50';
  if (n <= 200) return '51-200';
  if (n <= 1000) return '201-1k';
  if (n <= 5000) return '1k-5k';
  return '5k+';
}
