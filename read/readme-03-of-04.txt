=== README.md — part 3 of 4. Join all parts in order to get the full file. ===
## Worker uploads come first
Safe Word is built for workers. Anyone can upload any document into their own account; nothing is ever blocked. If an upload looks like another business's paperwork (`otherCompanyIn()`), show a one-line heads-up once per document (`uploadAdvisory()`): "Heads up: this looks like Acme Roofing's paperwork. Using it may need their OK. Continue?" with Continue / Cancel. The answer stays in the worker's own account and is never reported to anyone.

## Company paperwork access
Company forms belong to the company. Only people the company currently authorises (employees and contractors) can use them. Safe Word's own template stays free to everyone.
- **Notice:** the first time someone opens a company's paperwork, they accept the company's confidentiality notice (`defaultNotice()`; the owner can edit the wording). If the wording changes, everyone accepts it again.
- **Remove access:** owner-only, one tap, with a short confirmation. It takes effect immediately: company forms, drafts and the company's sent folder disappear for that person. No reason is asked for; there's an optional private note only the owner sees. Their drafts in progress move to the owner so no work is lost.
- **Records stay:** signed SWMS remain with the company as safety records. The person's signature on past SWMS is never removed. Their saved signature remains their own and can't be used by the company.
- **Re-invite:** restores access; the log shows it.
- **No blank copies:** only owners can download blank company forms. Workers can only send out finished, signed documents.
- **Offline:** cached company forms stop working after 7 days without the phone checking in (`offlineCopyValid()`), so removal reaches phones that were offline.
- **Footer:** every PDF made on company paperwork carries `companyFooter()` ("Prepared on Acme Roofing paperwork. Confidential to Acme Roofing.").
- **Audit log:** every grant, notice acceptance, removal, re-invite and draft transfer, visible to the owner.
- **What the person sees:** a neutral message. "Your access to Acme Roofing's paperwork has ended. Your own saved signature and the Safe Word template are still yours to use."

## Founder content console (admin only)
A private screen for the founder to manage safety content: create a module, draft hazards and controls from the codes of practice, add sources and trigger words, write the optional public page summary, then "Mark reviewed". `reviewBlockers()` must return nothing before that button works. Electrical and asbestos modules need a second, specialist sign-off. Any edit to a reviewed module creates a new draft version (`editModule()`), which isn't used until reviewed again. Show version history.

## Privacy, consent and records
- Ask for microphone consent on first use, in plain words. Show clearly when the mic is listening.
- Delete raw voice audio once it's transcribed, unless the user turns on keeping it. Store transcripts and documents only.
- Host data in Australia. Encrypt signatures at rest. Signatures are only ever used by their owner.
- Publish a plain-English privacy policy covering what's collected (names, signatures, voice, documents), why, where it's stored and how to get it deleted. Build to Privacy Act standards even if the business is under the small business threshold: builders will expect it, and the law is under review.
- Record keeping (`RETENTION`): a SWMS must be kept until the high-risk work is finished, and for at least 2 years after a notifiable incident. Signed versions can be archived but never deleted by users. Default retention 7 years.

## Which states
Launch content is built on the national model WHS list of 18 high-risk activities. The business profile records the state. Victorian businesses see `jurisdictionNotice()` until a reviewed Victorian list is added.

## Services to connect
- **Auth and database** (Supabase or equivalent). Tables: companies, users, contacts, signatures (all versions), forms (paperwork), drafts, documents (final PDFs + content hash), sent_records, modules (reviewed content), gate_cases.
- **Speech-to-text:** streaming, Australian English, custom vocabulary, good noise handling. Feed end-of-speech events to `Pacer`.
- **LLM** for extraction and phrasing only, using the engine's prompts. Never for hazards or controls.
- **Voices and speech-to-text:** Microsoft Azure Speech on the free tier (0.5M neural characters and 5 hours of recognition a month), language en-AU, `TRADE_VOCABULARY` as phrase hints. Server route `/api/speak` (keys stay server-side). Pre-generate every line in `promptLibrary()` for both voices at build time to the paths from `audioKey()`. Live-generate only dynamic lines.
- **Email:** server route `/api/send` (e.g. Resend) using `emailPayload()`, PDF attached.
- **PDF:** generate our template PDFs; fill uploaded company PDFs at each field's `place`. Read fillable PDF fields to feed `buildCompanyForm()`; for flat PDFs, let the user tap each box once to place it.
- **Logo.dev** publishable key for website logo lookup (check their attribution terms on the free plan).
- **PDF footer** on every page: the disclaimer line, the version and content hash, and `referralFooter()`.

## Build order and acceptance tests
1. **Engine in, `selfTest()` green.**
2. **Accounts, business profile, contacts, signatures.** Draw, save, redo, reuse; verify old documents still verify after a redo.
3. **Template flow by keyboard first.** Fill a full SWMS by typing only; read-over works; PDF looks professional.
4. **Voice in and out.** Guided filling, commands, pacing, barge-in, read-back, mute. Test with real site noise.
5. **Hazards and flags.** Not-covered items block signing until a control is added.
6. **Crew signing and sending.** Pass-the-phone, crew link, email, print, save, sent log.
7. **Company paperwork and reuse.** Upload, map, fill; open old report, clear, continue by voice or typing; import a PDF from another system.
8. **SEO site.** At build time run `buildSite(reviewedModules, config)` and write each page to the public folder. Build fails unless `lintPages()` returns no errors. Set the real domain and reviewer in the config. Submit `sitemap.xml` in Google Search Console. Trade pages publish when the founder sets `reviewed: true`.
9. **Free SWMS Check and landing page.** Landing page shows the voice-to-SWMS flow and the free check as the main call to action, states content is reviewed by a WHS-qualified professional, never claims certified compliance.
10. **Launch gate.** Founder records real briefs on noisy sites; `runGate()` must pass (10+ cases, 90%+) before launch.

## Values the founder supplies (all marked `PASTE_` in the engine)
Domain (getsafeword.com.au, once registered), reviewer name, Azure Speech key and region, Logo.dev publishable key. `lintPages()` blocks any public page that still contains a placeholder.

## Brand assets (in `/assets`)
| File | Where it goes |
|---|---|
| `favicon.svg` | Site root `/favicon.svg` |
| `apple-touch-icon.png` (180) | Site root `/apple-touch-icon.png` |
| `icon-192.png`, `icon-512.png` | Web app manifest icons |
| `icon-1024.png` | App store listings and anywhere a large icon is needed |
| `safe-word-share.png` (1200×630) | `/og/safe-word-share.png` — the share image every page uses (matches `SITE_DEFAULTS.ogImage`) |
| `first-run-dawn-768.webp`, `-1290.webp`, `-full.webp`, `.jpg` (9:16) | App first-run screen background, exactly as in `safe-word-screens.html`. Use `srcset` with the 768 and 1290 sizes. Alt: "A builder in hi-vis checking his phone at dawn on a house frame site". |
| `home-hands-768.webp`, `-1290.webp`, `-full.webp`, `.jpg` (9:16) | App home screen header photo. Alt: "Gloved hands holding a phone beside a fresh concrete slab". |
| `hero-1536.webp`, `hero-768.webp`, `hero-1536.jpg` | Landing page hero. Use `<picture>` with the WebP sizes and the JPG fallback, explicit width/height, and alt text: "A tradie's gloved hand holding a phone on a residential building site at sunset". Don't lazy-load the hero. |
| `illus-empty-clipboard-light/dark.png` | Empty states: no jobs yet, no paperwork uploaded |
| `illus-sent-light/dark.png` | Sent folder empty state and the "sent" confirmation |
| `illus-sign-light/dark.png` | Signatures screen and "no signature saved yet" |
| `icon-alt-chatgpt-1024.png` | Alternative icon. Not used unless the founder chooses it. |
| `landing/before-*.webp` | Landing page "the old way" section: a dirty paper SWMS on a ute dashboard. Alt: "A crumpled paper SWMS on the dashboard of a work ute at sunrise". |
| `landing/tailgate-*.webp` | Landing page "how it works" section. Alt: "Tape measure, gloves, pencil and a phone on a ute tailgate at a building site". |
| `landing/prestart-*.webp` | Landing page "crew sign-off" section. Alt: "Three workers in hi-vis and hard hats at a morning pre-start on a slab". |
| `trades/<slug>.webp` (1200×800) | Trade page photo, served at `/img/trades/<slug>.webp`. |
| `trades/<slug>-share.jpg` (1200×630) | That trade page's share image, served at `/img/trades/<slug>-share.jpg`. |

Trade photos are ready for all eight trades. Pass `tradePhotos: { roofers: true, electricians: true, plumbers: true, carpenters: true, concreters: true, scaffolders: true, painters: true, "demolition-contractors": true }` in the site config. Every photo on the site must show correct safety practice; any new photo is checked by the founder before it goes up.

Use the `-dark` illustrations in dark mode. Show illustrations small (about 120–160px), with one short line of friendly copy under each.

