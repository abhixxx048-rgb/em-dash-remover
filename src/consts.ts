// Central site configuration.

export const SITE_NAME = 'Em Dash Remover';
export const SITE_URL = 'https://emdashremover.app';
export const CONTACT_EMAIL = 'hello@emdashremover.app';
export const AUTHOR = 'The Em Dash Remover Team';

// Google AdSense.
// Leave EMPTY until your AdSense account is approved and you have your publisher
// ID. When set (e.g. 'ca-pub-1234567890123456'), the site will:
//   - inject the AdSense head script for verification + serving
//   - emit a correct /ads.txt
//   - render <AdSlot> ad units (otherwise they render nothing)
// Replace the empty string with your real ID, then rebuild.
export const ADSENSE_PUB_ID = '';

// Umami analytics (privacy-safe, cookieless - sends COUNTS/metadata only,
// never user text).
// Leave EMPTY until you create the Umami Cloud (or self-hosted) website and
// have its website id. While empty, analytics are DISABLED: the <Analytics>
// scripts are not injected and track() becomes a safe no-op.
export const UMAMI_WEBSITE_ID = '';
// Script src - override only if you self-host Umami; the default points at
// Umami Cloud.
export const UMAMI_SRC = 'https://cloud.umami.is/script.js';

// Cloudflare Web Analytics token.
// Leave EMPTY until you create the Web Analytics site and have its token.
// While empty the beacon script is not injected (analytics disabled).
export const CF_WA_TOKEN = '';
