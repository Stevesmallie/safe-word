=== README.md — part 2 of 4. Join all parts in order to get the full file. ===
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

