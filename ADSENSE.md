# AdSense Approval Readiness

Goal: make the site **qualify** for AdSense approval. No live ads are served - the
ad-serving code is dormant and only activates if you set a publisher ID later.

## ✅ Done in code (approval requirements)

**Content depth** (the #1 rejection reason for tool sites)
- Homepage has ~1,300 words of original supporting content (what/why/how/FAQ)
- Blog with 6 original 700–900-word guides + a blog hub, linked in the nav
- About page with real purpose + principles; Contact with a working method

**Required policy pages**
- Privacy Policy with the exact Google-required disclosures: third-party vendor
  cookies, personalised ads, opt-out links (Google Ads Settings, aboutads.info,
  NAI), plus GDPR & CCPA sections
- Cookie Policy page
- Terms & Conditions
- All linked in the footer

**Consent (required for EEA/UK/CH)**
- Google Consent Mode v2 default-denied snippet loads before any ad/analytics tag
- Self-built cookie banner wired to Consent Mode (Accept/Decline) + "Cookie
  settings" link to reopen it
- ⚠️ For EEA/UK/CH personalised ads you must still enable a **Google-certified
  CMP** - easiest is Google's free CMP in the AdSense dashboard (Privacy &
  messaging → European regulations message). The banner here is the baseline.

**Site structure / technical**
- Internal-only nav (external links in nav can trigger a policy violation)
- Sitemap, robots.txt, canonical URLs, structured data, per-page meta + OG images
- Mobile-friendly, fast (Astro static), 404 page, favicon, HTTPS-ready

**Positioning (policy safety)**
- Framed as a writing/formatting/style tool; About explicitly states it is **not**
  for cheating or beating AI detectors. Avoids risky phrasing.

**ads.txt**
- `/ads.txt` endpoint emits a harmless comment-only file until you set your ID,
  then emits the correct `google.com, pub-…, DIRECT, f08c47fec0942fa0` line.

## ▶️ Account/process steps (you do these)

1. Use a **custom top-level domain** (e.g. emdashremover.app) on HTTPS.
2. Create an AdSense account, add the site.
3. Set `ADSENSE_PUB_ID` in `src/consts.ts` to your `ca-pub-…` ID and redeploy.
   This activates the verification script in `<head>` and the correct `ads.txt`.
4. Submit for review (typically 1 day–2 weeks).
5. After approval: enable Google's certified CMP for EEA/UK, then (optionally)
   turn on Auto Ads or place ad units.

## How to place ads later (optional, after approval)

A dormant, CLS-safe `<AdSlot slot="…" />` component exists in
`src/components/AdSlot.astro`. It renders **nothing** until `ADSENSE_PUB_ID` is
set. To show an ad, create an ad unit in AdSense, then drop
`<AdSlot slot="YOUR_SLOT_ID" />` into a page. Nothing is placed right now.

> Legal pages are templates - have them reviewed for your jurisdiction.
