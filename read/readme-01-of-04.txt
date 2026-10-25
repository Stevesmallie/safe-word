=== README.md — part 1 of 4. Join all parts in order to get the full file. ===
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

