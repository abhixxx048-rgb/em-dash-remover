import type { APIRoute } from 'astro';
import { ADSENSE_PUB_ID } from '../consts';

// Emits a valid ads.txt. Until ADSENSE_PUB_ID is set it returns a comment-only
// file (harmless), so there's never a broken/invalid ads.txt live.
export const GET: APIRoute = () => {
  const pub = ADSENSE_PUB_ID.replace(/^ca-/, ''); // ads.txt uses pub-… without ca-
  const body = pub
    ? `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n`
    : `# ads.txt - add your AdSense publisher line once approved:\n# google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0\n`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
