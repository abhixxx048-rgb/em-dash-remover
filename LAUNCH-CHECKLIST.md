# LAUNCH-CHECKLIST.md — Human / Non-Code Launch Tracker

Owner-only tasks an AI agent can't do for you: account creation, time-gated aging, third-party signups, manual submissions, and recording. Code/build tasks live in the engineering backlog, not here. Cross-references point back to [`LAUNCH.md`](./LAUNCH.md).

> **Why this exists:** Several launch moves are *time-gated* (account aging) or require *your* identity/billing (analytics, AdSense, GitHub). Start §1 **today** — it gates launch week (`LAUNCH.md` §4) and cannot be rushed (`LAUNCH.md` "Completeness Critic" #2).

---

## 1. Start Today — Time-Gated (do these FIRST)

Account aging needs **2–4 weeks** of genuine, link-free karma before launch week fires (~T-21). A shadowban on r/ChatGPT (4.2M) is unrecoverable. (`LAUNCH.md` §1.1, §4 pre-week, Critic #2.)

- [ ] **Age a Reddit account** — post genuine, link-free help to reach 100+ karma; never drop your link during aging.
  - [ ] r/ChatGPT — *how to read & answer "how do I remove em dashes" threads; your launch-day home (4.2M).*
  - [ ] r/writing — *the "falsely accused of AI for using em dashes" angle; be a real contributor first.*
  - [ ] r/ObsidianMD — *help with paste/cleanup workflows; you'll lead with the plugin here on launch.*
  - [ ] r/SEO — *answer internal-linking / hub-spoke questions; build credibility for the build-story post.*
  - [ ] r/InternetIsBeautiful — *learn the rules; it rewards free single-purpose tools, no aging-karma needed but no self-promo abuse.*
- [ ] **Age an Indie Hackers account** — engage in build-in-public threads so your launch post isn't a cold link drop. (`LAUNCH.md` §4 Wed.)
- [ ] **Submit to BetaList now** — free queue runs ~2 months, so submit on day one to land near launch. (`LAUNCH.md` §4 pre-week.)
- [ ] **Submit the Obsidian plugin to the community catalog** — review queue is slow; get in line now so approval lands by launch week. (`LAUNCH.md` §4 pre-week, §4 Thu.)

---

## 2. Accounts & Setup You Must Create

Each needs your identity/billing. Where a value gets pasted into code, the key is named — drop the value in and the feature un-gates itself (config pattern: empty const = no-op until set).

- [ ] **Umami Cloud Hobby** (free, 100k events/mo) — create site, copy the website ID → paste into `src/consts.ts` as `UMAMI_WEBSITE_ID`. *Cookieless, no banner; powers per-tool funnels.* (`LAUNCH.md` §6.)
- [ ] **Cloudflare Web Analytics** — enable on Pages (one click), copy the token → paste into `src/consts.ts` as `CF_WA_TOKEN`. *Pageviews/referrers baseline.* (`LAUNCH.md` §6.)
- [ ] **Google Search Console** — verify the domain, then submit the sitemap and Request Indexing on `/` + top 5 tool pages. (`LAUNCH.md` §3 SEO-technical, §5.)
- [ ] **Bing Webmaster Tools** — verify and submit the same sitemap. (`LAUNCH.md` §3, §5.)
- [ ] **Google AdSense** — apply, get your publisher ID → paste into `src/consts.ts` as `ADSENSE_PUB_ID`. *Ship the "not a humanizer" FAQ first; scrub all bypass/undetectable language or approval is at risk.* (`LAUNCH.md` §2, §3, Critic #5.)
- [ ] **GitHub repo for the open-source engine** — create the public repo, push `src/lib/tools/*`, link it from the site. *Biggest Show HN trust multiplier + provable-privacy proof.* (`LAUNCH.md` Critic #7, §3, §4 Tue HN.)
- [ ] **Record the 15-sec clip** — screen-record paste → clean → empty Network tab; use for the PH gallery, Show HN, and X. *Only you can capture this on your machine.* (`LAUNCH.md` §4 pre-week, §4 Tue.)

---

## 3. Launch Week Calendar (Tue–Thu launch)

Condensed from `LAUNCH.md` §4. Fire only after §1 accounts are aged. Space Reddit posts across days — same post to all subs same day triggers shadowban.

- [ ] **Mon (T-1)** — Line up 15–30 warmed contacts (share link, never "please upvote"); schedule PH for 00:01 PT; finalize the HN maker first-comment.
- [ ] **Tue 00:01 PT — Product Hunt** (self-hunt) — tagline + 2 gallery images + demo GIF; maker comment frames the em-dash-as-AI-tell moment, "not a detection bypass."
- [ ] **Tue 8–10am ET — Show HN** — title `Show HN: Em Dash Remover – strip AI tells from text, 100% in-browser (no upload)`; link the open-source engine; reply to every comment.
- [ ] **Tue AM — X + LinkedIn** — X: empty-Network-tab recording into the live em-dash discourse; LinkedIn: "recruiters flag em dashes as AI" angle. Both point at PH/HN.
- [ ] **Tue — r/InternetIsBeautiful** — "free, 100% in-browser tool that reveals invisible characters in AI text."
- [ ] **Wed — r/ChatGPT (4.2M)** — answer a real "remove em dashes" thread with the manual method, then disclose the tool. Value first.
- [ ] **Wed — Directories wave 1** — TAAFT, FutureTools, Futurepedia, TopAI.tools, AlternativeTo (vs undash, DashAway, QuoteCleaner, wordcounter.net, diffchecker, Hemingway).
- [ ] **Wed — Indie Hackers** — build-in-public post with the why + early numbers, not a link drop.
- [ ] **Thu — r/writing + r/freelanceWriters + r/copywriting** — the "falsely accused of AI" emotional hook.
- [ ] **Thu — r/ObsidianMD + r/Notion** — lead with "my Obsidian plugin just got approved," not the web app.
- [ ] **Thu — r/SEO (380K) + r/SideProject + r/SaaS/r/startups share threads** — r/SEO gets the hub-spoke/privacy build story.
- [ ] **Fri — Peerlist + Uneed + MicroLaunch + SaaSHub** — Tier-2 directories for a second spike.
- [ ] **Following week — Mini-launch #2** — re-launch the Invisible/Watermark Character Inspector standalone on Show HN / r/InternetIsBeautiful / X.
- [ ] **Lobsters — only if invited** by a member; frame purely technically.

---

## 4. Directories to Submit To

Do-follow links + AI-citation surface. Pitched as alternatives where noted. (`LAUNCH.md` §4, backlog P1.)

- [ ] **BetaList** — submit now (slow free queue; see §1).
- [ ] **There's An AI For That (TAAFT)** — wave 1.
- [ ] **FutureTools** — wave 1.
- [ ] **Futurepedia** — wave 1.
- [ ] **TopAI.tools** — wave 1.
- [ ] **AlternativeTo** — list as alternative to undash, DashAway, QuoteCleaner, wordcounter.net, diffchecker, Hemingway.
- [ ] **Peerlist** — Tier-2 (Fri).
- [ ] **Uneed** — Tier-2 (Fri).
- [ ] **MicroLaunch** — Tier-2 (Fri).
- [ ] **SaaSHub** — Tier-2 (Fri).

---

## 5. Ongoing

After launch week — recurring owner effort that compounds backlinks and branded search. (`LAUNCH.md` §8 footer, backlog P1.)

- [ ] **Featured.com (HARO successor)** — create a source profile; answer "AI detection / em dash / ChatGPT / privacy" queries on a recurring schedule.
- [ ] **Qwoted** — create a source profile; same answer cadence as Featured.com.
- [ ] **Recurring directory + AlternativeTo resubmits** — keep listings fresh on a schedule.
- [ ] **Roundup-inclusion outreach** — pitch the word counter / diff viewer into "best tool" roundups (100+ lists).
- [ ] **Content calendar** — execute the 90-day post schedule. Full week-by-week titles, keywords, and channels live in [`LAUNCH.md`](./LAUNCH.md) §8 — work straight from that table.
