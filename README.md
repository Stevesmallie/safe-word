# SAFE WORD — README AND BUILD GUIDE FOR POLSIA

Read this whole file before building. Then open `safe-word-screens.html` in a browser: that's exactly how the app must look and behave. It has two parts:
- **Part A: The product** — what Safe Word is, who it's for and how it must feel.
- **Part B: The build** — how to build it around the tested engine in `safe-word-engine.ts`.

The product is called **Safe Word**. Use no other product name anywhere: code, copy, emails, metadata, file names.

---

# PART A — THE PRODUCT

## What it is
Safe Word turns a tradie's spoken job description into a finished, site-specific SWMS (Safe Work Method Statement) in minutes. It works on our clean template (with the company logo if they want it) or on the company's own uploaded paperwork. The crew signs on their phones, and the document is emailed, printed or saved in a tap. All safety content is reviewed by a WHS-qualified professional.

## Who it's for
1. **Small trades and subcontractors** (self-serve). They need a site-specific SWMS before they're allowed on site.
2. **Small-to-mid builders and principal contractors.** The pitch: "Your subbies arrive with a site-specific SWMS, signed, before they start." The builder pays and invites its subbies.

## How it must feel
The person is in charge. Safe Word is the sharp offsider who helps when asked, never the boss. Nobody should ever feel told off, rushed, corrected or stupid.
- It **asks** short questions, the way a mate would. It never explains unless asked.
- It **waits** its turn. It never talks over anyone, never chases, and stays quiet while they type or tap.
- Its final read-over sounds like a mate glancing over the paperwork: "Had a read through. Just one thing: the job description's a bit light. What gear are you using, and how many of you?"
- "That's all" is always accepted. A light answer the person is happy with stays, and they're never nudged on it again.
- Voice and keyboard are equal. Switch any time. Everything works with voice muted.

## The core flow
1. **Start:** say "new job", pick the form (our template or their saved company paperwork), or open an old report to reuse.
2. **Talk it through:** the guide asks for each field. Known details (business, ABN, today's date) fill in silently. Spoken answers are tidied into WHS wording, with a faithfulness check that blocks any added facts.
3. **Hazards:** built only from reviewed content. Anything not covered is flagged for the person to add their own control.
4. **Read-over:** when they say they're done, a friendly check of anything missing or light.
5. **Sign:** saved signature goes on with one tap. Crew sign on the same phone ("pass the phone") or by link.
6. **Out:** email (sent from our server with the PDF attached), print (AirPrint or any printer), save to phone, and every send is logged in the dashboard.

## Features (all required for launch unless marked later)
**Voice in.** Streaming speech-to-text tuned for Australian English, site noise and trade terms (use `TRADE_VOCABULARY`). Live transcript on screen. Works offline: record now, process when signal returns.

**Voice out.** Natural, human Australian female and male voices (user picks once; default female). Microsoft Azure en-AU neural voices (Natasha and William) on Azure's free tier, the same provider for every line; phone voice only offline. ElevenLabs is an optional later upgrade, switched for every line at once. Fixed prompts are pre-generated as audio (instant, no per-use cost). Barge-in: the voice stops the moment the person speaks.

**Commands.** The full command set is in `commands.ts`. People can move around, change, clear, undo, read back, ask for a suggestion, sign, send, switch modes, change voice, pause and mute, in plain Aussie speech ("yeah nah", "she'll be right", "scratch that").

**Typing mode.** Every form can be filled entirely by keyboard. Typed words go in exactly as typed. An optional "Tidy wording" button runs the same faithfulness-checked tidy as voice and shows before and after; the person accepts or ignores it.

**Reuse old reports.** Open any previous Safe Word report, or upload a PDF from another system. Keep what still applies, clear what doesn't, then "continue by voice" or "continue by typing". Signatures are never copied. The date resets. High-risk work and hazards are rebuilt from current reviewed content.

**ℹ️ suggestions.** Every field has an ℹ️ button. Tapping it shows a suggestion based on the rest of the form and past jobs, with where it came from ("From your last job"). It's an offer only: "Use this", edit it, or ignore it. Control suggestions only ever come from reviewed content. Safety content is never guessed.

**Paperwork dashboard.** Upload company SWMS forms once. Fields are auto-mapped; anything unmatched is labelled once by tap or voice. Saved forms are reused on every job.

**Logo.** Optional. Snap a photo (auto crop and background clean-up), upload a file, or find it from the company website (Logo.dev). The person confirms it's their own business's logo.

**Signatures.** Draw once on the touchpad, save, apply to any number of documents with one tap. Redo any time: the new version becomes current, older documents still verify. Only the owner can apply their own signature. Every use is stamped with name, role, time and the exact document version. Editing a document after signing voids the signatures on it.

**Sent folder.** Every email, print and save is logged with which version went out. Emailing it to the principal contractor fills in "Date given to principal contractor" automatically.

**Sign everywhere.** On company forms with several signature boxes, one tap puts the person's saved signature in every box that's theirs.

**Free SWMS Check.** Upload any existing SWMS and describe the job. A friendly report shows what looks covered, what's missing (including high-risk work the job involves that the SWMS doesn't mention), leftover template text, and whether the site is named. Clearly labelled as a quick automated read, not a compliance assessment.

## Hard rules
- Never invent hazards or controls. Never let the AI write safety content.
- Never claim "compliant" or "certified". The business doing the work remains responsible for reviewing, following and monitoring the SWMS. Say so in the app and on every document.
- Only publish modules the founder has reviewed (electrical and asbestos also need a specialist review).
- Never apply anyone's signature but the signer's own, and never without their tap.
- Verified contact details only in any outreach.
- If the brief involves no high-risk construction work, say a SWMS isn't legally required for that job, but let them make one anyway.

## Design: build it from `safe-word-screens.html`
**The look is already built.** `safe-word-screens.html` (in this zip) is the design system and every app screen, written in code and tappable end to end. Build the app to match it exactly. Don't restyle it, don't swap in a component library's default look, and don't "improve" the colours or fonts.

How to use it:
- **The `<style>` block is the design system.** Lift it into the app's global stylesheet as-is. The tokens in `:root` (colours, fonts, radius, tap size, motion) are the only values any screen uses. If the app uses a framework, port each block to that framework's components and keep the class names, tokens and measurements identical.
- **Each `<section data-screen="…">` is one screen.** Build them as real screens wired to the engine (see "Screens" and "Engine map" below). The sample job (14 Ocean St, Brown Roofing, Coastline Builders, Dave, Mia, Jack) is example content only. Real screens show the user's own data.
- **The signature pad code is production-ready.** Keep it. Strokes are stored as normalised points, so one saved signature redraws sharply anywhere: on the pad, on the paper, and in the PDF. Pen ink on paper is `--sig-ink`.
- **Remove the preview-only parts:** the `.pv` screen picker bar, the `app.classList.add('preview')` line, and the scripted `STEPS` demo in the talk screen. Replace `STEPS` with real speech-to-text plus the engine (`extract`, `guide`, `commands`, `replies`, `pacing`).
- Fonts: Barlow Condensed (headings), Barlow (body), IBM Plex Mono (labels, references, stamps), all from Google Fonts. Self-host them in production.

The rules that make it work. Keep these when adding anything new:
- **Dark graphite app.** Background `#0B0F14`, surfaces `#121820` / `#1A222D`. It reads well outdoors, saves battery, and makes the white paper and hi-vis pop.
- **Hi-vis yellow `#E3FF00` is for the one thing to tap next.** Main buttons and the mic only, always with dark text. Never more than one hi-vis button visible at a time.
- **The SWMS is a real sheet of paper.** It's white, sits on the dark app, and fills in live while the user talks, with a highlighter sweep on each newly written field. The document is the hero, not the chat.
- **Status colours mean one thing each.** Amber `#FFB020` means "needs a look", green `#3DDC84` means "signed or done", blue `#4D8BFF` is for links. No other colour use.
- **Big, condensed, uppercase headings.** They read like site signage. Body text is 16–17px minimum. Tap targets are at least 56px (glove-friendly). Primary actions sit in the bottom third.
- **Real photos only:** `first-run-dawn` on first run and `home-hands` on home, with the gradient overlays shown. No stock smiles, no AI-looking people, no illustrations of people.
- **Motion:** 260ms ease-out, screens slide, fields settle in, and the tape has a slow sheen. Everything respects "reduce motion". No bounce, no confetti.
- **Avoid:** purple or neon gradients, sparkle or robot icons, "AI-powered" in copy, glassmorphism, emoji in the UI.
- **Hi-vis tape (signature brand detail):** the `.tape` class. It looks like the reflective tape on a hi-vis vest: fluoro yellow with a silver micro-prism band and a soft sheen. It goes in exactly three places, so it stays instantly recognisable:
  1. A 10px strip across the very top of every app screen (14px on web pages).
  2. An 8px divider between major sections.
  3. The top edge of confirmation cards: "Everyone's signed", "Sent to…", "Saved".
  Never on buttons, never vertical, never recoloured.

## Screens
0. **First run (once, ever):** dawn site photo, "Talk it. Sign it. Send it.", one "Get started" button. A sheet slides up: "One signature. Just once." Signature pad, one short line saying signing also means agreeing to the terms (linked), then "Sign and get started". This is the only gate: the app unlocks when it's done. See "First-run terms" below.
1. **Home:** big mic, "New SWMS", recent jobs (tap to reuse), paperwork, sent.
2. **Choose form:** Safe Word template, or a saved company form.
3. **Talk / Type:** live document on top, transcript or keyboard below, mic and ℹ️ always reachable.
4. **High-risk work and hazards:** cards with controls in hierarchy order; amber "not covered" cards with "Add a control".
5. **Read-over:** friendly checklist, jump-to-field, "Keep as is".
6. **Sign:** your saved signature, one tap. Crew: pass-the-phone mode (big name, read, sign, next) or send a link; live "who's signed".
7. **Send:** Email (saved contacts, e.g. the builder), Print, Save to phone. Confirmation names the recipient.
8. **Dashboard:** Paperwork, Sent, Signatures (view, redo), Contacts, Settings (voice male/female, voice on/off, speed, logo, business details).

## Business
**Pricing:** simple monthly subscription per company. Set a test price and validate it with the first users before adding features.
**Customer acquisition, in priority order:**
1. "Made with Safe Word" and a signup link on every signed SWMS PDF and share email.
2. Free SWMS Check: upload an existing SWMS, describe a job, get an instant gap report. Email required to view the full report.
3. The SEO site (Part B, step 8).
4. Hold paid ads until 1–3 are live and converting. Then small-budget Meta and Google ads aimed at Australian tradies and SWMS searches, pointing to the free check. Report cost per signup weekly.
5. Cold email only to publicly published business emails, with sender identification and unsubscribe, compliant with the Spam Act 2003.
**Success measure:** voice launch gate passed, then 3 active pilots and 1 paying customer before any new features.

---

# PART B — THE BUILD

## The engine
`safe-word-engine.ts` is a single, dependency-free TypeScript file containing all of Safe Word's logic, tested end to end. It runs in the browser, on the server and in edge functions. **Build the app around it. Do not rewrite its logic.**

1. Put it at `lib/safe-word-engine.ts`. You may split it into modules along its section markers if you prefer; keep the code identical.
2. Add a test that calls `selfTest()`. It must print **"All checks passed."** Run it on every build. If it fails, the build fails.
3. Browser-only helpers (`cleanLogo`, `saveToDevice`, `printPdf`) must only be called client-side.

## Do not loosen
`isPublishable()`, `faithfulnessCheck()`, the not-covered flags, the signature owner and tap rules, the content hash on signing, `PACING`, `TONE_BANNED`, `lintPages()`. These are the product's safety and trust. If a feature seems to need one loosened, stop and ask the founder.

## Engine map: what to call, where
| Need | Engine function |
|---|---|
| Speech-to-text custom vocabulary | `TRADE_VOCABULARY` |
| Turn transcript into job details (LLM) | `EXTRACTION_PROMPT` → `parseBrief()` |
| Ask for missing job details | `nextFollowUp()`, `readBack()` |
| Detect high-risk work, pick modules, flag gaps | `select()` |
| Build the SWMS | `assemble()`; edits via `applyEdit()`; adding a control via `resolveFlag()` |
| Tidy spoken/typed wording (LLM) | `WHS_PHRASING_PROMPT` → `faithfulnessCheck()` (use its `.text`) |
| Guided filling | `nextPrompt()`, `checkField()`, `whatToSay()`, `prefill()` |
| Read-over | `troubleshoot()` → `troubleshootSummary()` |
| Understand what was said | `parseCommand()`, `matchField()` |
| What to say back | `Replies.*`, field `voicePrompt` / `helpPrompt` / `nudge` |
| When to speak | `Pacer` (feed it events; check `canSpeak()` / `canReply()` before any speech) |
| ℹ️ button | `suggestFor()` |
| Drafts, typing, undo, reuse | `newDraft()`, `setValue()`, `undo()`, `clearFields()`, `copyFromOld()`, `importPreviousReport()`, `remainingFields()`, `continueWith()` |
| Forms and paperwork | `GENERIC_SWMS`, `buildCompanyForm()`, `labelField()`, `PaperworkLibrary` |
| Signatures | `SignatureVault`, `applySignature()`, `verifyStamp()`, `signOff()`, `validSignatures()` |
| Voices | `VOICE_CONFIG`, `elevenLabsRequest()`, `azureSsml()`, `promptLibrary()`, `audioKey()` |
| Logo | `logoLookupUrl()`, `cleanLogo()` |
| Sending | `emailPayload()`, `saveToDevice()`, `printPdf()`, `SentLog` |
| Launch gate | `runGate()` |
| Sign every box that's mine, one tap | `applyToAllMyFields()` |
| Free SWMS Check gap report | `checkExistingSwms()` |
| Founder content console | `reviewBlockers()`, `markReviewed()`, `editModule()` |
| State notice (Victoria) | `jurisdictionNotice()` |
| "Made with Safe Word" footer on every PDF and email | `referralFooter()` |
| Date given to the builder, set automatically on email | `markProvided()` |
| Record keeping | `RETENTION` |
| First-run terms, unlock, records, summaries | `TermsLedger`, `firstRunSave()`, `termsPrompt()`, `userCopyEmail()`, `founderSummary()`, `FIRST_RUN_COPY` |
| Upload heads-up for other companies' paperwork | `otherCompanyIn()`, `uploadAdvisory()` |
| Company paperwork access, notice, removal | `CompanyAccess`, `defaultNotice()`, `offlineCopyValid()`, `companyFooter()` |
| SEO site | `buildSite()` → `lintPages()` |

## First-run terms (smooth, barely noticeable, properly agreed)
- No separate legal step. The first-run signature screen does it all: their signature is saved for everyday use AND records their agreement (`firstRunSave()`).
- Copy is exactly `FIRST_RUN_COPY`. Never use the words waiver, disclaimer, liability or legal on this screen. No scroll box, no tick-box, no second screen.
- Light, not hidden: the agree line and Terms link sit directly above the button in readable text (15px minimum, normal contrast). That's what makes the agreement count.
- Everything else in the app stays locked until `appUnlocked()` is true. Asked once, ever (`termsPrompt()` returns "none" from then on).
- If the Terms materially change, bump `TERMS.version`. Users see one quiet line once (`TERMS_UPDATED_COPY`) and tap Agree.
- Crew signing by link don't see this screen; they get `CREW_FIRST_SIGN_LINE` beside their first signature.
- Records: each acceptance (who, terms version, when, device, signature id) is stored in the database. That record is the evidence; keep it with the same retention as signed SWMS.
- The user gets their own copy by email once (`userCopyEmail()`).
- The founder gets a weekly summary (`founderSummary()`) at `TERMS.founderSummaryEmail`: names, dates, versions only, never signature images. Full export available on request from the admin console.
- The Terms page itself: one page of plain English, written by a lawyer. Disclose the weekly summary email in the privacy policy.

## Accounts and roles
- **Owner:** billing, business details, company paperwork, content of the dashboard, users.
- **Supervisor / leading hand:** creates and sends SWMS, manages crew sign-off.
- **Worker:** reads and signs SWMS they're asked to sign, keeps their own saved signature. Crew who sign by link get a lightweight worker profile on first signature.

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

## Definition of done
`selfTest()` green, `lintPages()` clean, launch gate passed, a full SWMS done by voice only and by keyboard only, signed by three crew, emailed and printed, all without anyone feeling told what to do.
