/*
 * SAFE WORD — CORE ENGINE
 * Read README.md first. Build the app around this file; do not rewrite its logic.
 *
 * One dependency-free TypeScript file. Runs in the browser, on the server and in edge functions.
 * Run selfTest() on every build: it must print "All checks passed."
 *
 *  Crypto        portable IDs and SHA-256 (locks signatures to the exact document version)
 *  HRCW          the 18 high-risk construction work activities (model WHS Regulations r291)
 *  Types         modules, hazards, controls, job brief, SWMS, sign-offs
 *  Signatures    draw once, save, apply unlimited times with one tap, redo any time;
 *                only the owner can apply their own; every use stamped to the document version
 *  Forms         Safe Word template (logo optional) + uploaded company paperwork, auto-mapped,
 *                saved in the paperwork dashboard; natural spoken names for every field
 *  Phrasing      tidies spoken or typed answers into WHS wording; blocks any added facts
 *  Guide         guided filling, silent prefill, friendly read-over, "that's all" accepted
 *  Commands      everything a person can say, in plain Aussie speech
 *  Replies       specific, friendly things the app says back; TONE_BANNED keeps it respectful
 *  Pacing        when the voice may speak: never over the person, never chasing, help on request
 *  Extraction    speech-to-text vocabulary, extraction prompt, strict parsing, read-back
 *  Selection     detects high-risk work, uses ONLY reviewed modules, flags anything not covered
 *  Assembly      hierarchy-of-control ordering, content hash, signing blocked while flags are open
 *  Launch gate   real site recordings: 10+ cases and 90%+ or no launch
 *  Reuse         drafts, typing mode, undo, copy old reports, import other systems' reports
 *  Suggest       the ℹ️ button: context suggestions, never guessed safety content
 *  Voice         natural Australian female and male voices, pre-generated prompt audio
 *  Logo          photo or upload with auto crop and clean-up, or find by website
 *  Output        email, print (AirPrint or any printer), save to phone, sent log
 *  Terms         first-run signature doubles as agreement; asked once; records + weekly summary
 *  Membership    company paperwork access: confidentiality notice, remove access, audit log
 *  SWMS Check    free gap report on an uploaded SWMS (lead magnet)
 *  Content       founder's review rules: nothing goes live until reviewBlockers() is empty
 *  SEO           hub, activity and trade pages from reviewed content; lintPages() gates the build
 *  Self-test     selfTest()
 *
 * Values marked PASTE_ are supplied by the founder before launch.
 * Test data inside selfTest() is not real safety content.
 */

// ===================== crypto =====================
// Portable IDs and hashing: runs the same in the browser, on the server and in edge functions.
// No Node-only modules.

export function newId(): string {
  const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (c?.randomUUID) return c.randomUUID();
  // Fallback for very old environments.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// SHA-256 (synchronous, UTF-8). Used to lock signatures to the exact document version.
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

export function sha256Hex(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const bitLen = bytes.length * 8;
  const padded = new Uint8Array(((bytes.length + 9 + 63) >> 6) << 6);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000));
  view.setUint32(padded.length - 4, bitLen >>> 0);
  const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const W = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) W[i] = view.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(W[i - 15], 7) ^ rotr(W[i - 15], 18) ^ (W[i - 15] >>> 3);
      const s1 = rotr(W[i - 2], 17) ^ rotr(W[i - 2], 19) ^ (W[i - 2] >>> 10);
      W[i] = (W[i - 16] + s0 + W[i - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const t1 = (h + S1 + ((e & f) ^ (~e & g)) + K[i] + W[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const t2 = (S0 + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  }
  return Array.from(H, (x) => x.toString(16).padStart(8, "0")).join("");
}

// ===================== check =====================
// Tiny portable assertion helper for selfTest() — no Node modules, runs anywhere.

function fail(msg: string): never {
  throw new Error(`Self-test failed: ${msg}`);
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export const assert = {
  ok(v: unknown, msg = "expected a truthy value"): void { if (!v) fail(msg); },
  equal(a: unknown, b: unknown, msg?: string): void { if (a !== b) fail(msg ?? `${JSON.stringify(a)} !== ${JSON.stringify(b)}`); },
  notEqual(a: unknown, b: unknown, msg?: string): void { if (a === b) fail(msg ?? `${JSON.stringify(a)} should differ`); },
  deepEqual(a: unknown, b: unknown, msg?: string): void { if (!same(a, b)) fail(msg ?? `${JSON.stringify(a)} not equal to ${JSON.stringify(b)}`); },
  match(s: string, re: RegExp, msg?: string): void { if (!re.test(s)) fail(msg ?? `${s} does not match ${re}`); },
  throws(fn: () => unknown, msg = "expected an error"): void {
    try { fn(); } catch { return; }
    fail(msg);
  },
};

// ===================== hrcw =====================
// The 18 high-risk construction work (HRCW) activities in the model WHS Regulations (r291).
// Victoria uses its own 19-activity list and some states vary fall thresholds:
// jurisdiction settings live in JURISDICTION and must be checked by the founder before launch.

export interface HrcwCategory {
  id: string;
  number: number;
  title: string;
  // Words/phrases in a brief that suggest this category applies. Matching only SUGGESTS;
  // the user confirms in the read-back step.
  triggers: string[];
}

export const HRCW_CATEGORIES: HrcwCategory[] = [
  { id: "falls", number: 1, title: "Risk of a person falling more than the fall threshold", triggers: ["roof", "re-roof", "ladder", "scaffold", "ewp", "scissor lift", "boom lift", "mezzanine", "height", "storey", "harness", "edge", "skylight", "gutter"] },
  { id: "telco-tower", number: 2, title: "Work on a telecommunication tower", triggers: ["telecommunication tower", "telco tower", "comms tower", "mobile tower", "antenna mast"] },
  { id: "demolition", number: 3, title: "Demolition of a load-bearing or structurally integral element", triggers: ["demolish", "demolition", "knock down", "remove load-bearing", "remove wall"] },
  { id: "asbestos", number: 4, title: "Work likely to disturb asbestos", triggers: ["asbestos", "fibro", "acm", "super six", "pre-1990", "pre 1990"] },
  { id: "temp-support", number: 5, title: "Structural alterations or repairs requiring temporary support", triggers: ["propping", "temporary support", "acrow", "underpin", "shoring", "structural alteration"] },
  { id: "confined-space", number: 6, title: "Work in or near a confined space", triggers: ["confined space", "tank", "pit", "silo", "manhole", "vessel entry", "sewer"] },
  { id: "trench-tunnel", number: 7, title: "Work in or near a shaft or trench deeper than 1.5 m, or a tunnel", triggers: ["trench", "excavation", "excavate", "shaft", "tunnel", "dig", "footing"] },
  { id: "explosives", number: 8, title: "Work involving the use of explosives", triggers: ["explosive", "blasting", "detonate", "powder-actuated"] },
  { id: "gas-mains", number: 9, title: "Work on or near pressurised gas distribution mains or piping", triggers: ["gas main", "gas line", "gas pipe", "pressurised gas"] },
  { id: "chem-fuel-refrig", number: 10, title: "Work on or near chemical, fuel or refrigerant lines", triggers: ["fuel line", "refrigerant", "chemical line", "aircon line", "fuel tank"] },
  { id: "energised-electrical", number: 11, title: "Work on or near energised electrical installations or services", triggers: ["live wire", "live power", "live circuit", "energised", "switchboard", "power line", "overhead line", "cable", "electrical", "isolation"] },
  { id: "contaminated-atmosphere", number: 12, title: "Work in an area that may have a contaminated or flammable atmosphere", triggers: ["fumes", "flammable", "solvent", "contaminated", "gas detected", "spray booth"] },
  { id: "tilt-up-precast", number: 13, title: "Tilt-up or precast concrete elements", triggers: ["tilt-up", "tilt up", "precast", "panel lift"] },
  { id: "traffic-corridor", number: 14, title: "Work on, in or next to a road, railway, shipping lane or other traffic corridor in use", triggers: ["road", "traffic", "footpath", "railway", "rail corridor", "highway", "verge", "shipping lane"] },
  { id: "mobile-plant", number: 15, title: "Work where there is movement of powered mobile plant", triggers: ["excavator", "bobcat", "forklift", "loader", "truck", "crane", "telehandler", "roller", "tipper", "plant"] },
  { id: "temp-extremes", number: 16, title: "Work in areas with artificial extremes of temperature", triggers: ["cold room", "freezer room", "furnace", "kiln", "boiler room"] },
  { id: "drowning", number: 17, title: "Work in or near water or other liquid with a risk of drowning", triggers: ["water", "pool", "dam", "river", "marina", "jetty", "pontoon", "tank of liquid"] },
  { id: "diving", number: 18, title: "Diving work", triggers: ["diving", "diver", "underwater"] },
];

export const JURISDICTION = {
  // Founder to confirm per state before launch (Queensland has its own fall rules).
  state: "QLD",
  fallThresholdMetres: 2,
  trenchDepthMetres: 1.5,
};

// ===================== types =====================
// Core data shapes. Every SWMS is built only from these — nothing free-written by the AI.

export type ControlLevel =
  | "elimination"
  | "substitution"
  | "isolation"
  | "engineering"
  | "administrative"
  | "ppe";

export interface Control {
  id: string;
  text: string;
  level: ControlLevel; // hierarchy of control — used to order controls, most effective first
}

export interface Hazard {
  id: string;
  description: string;
  risk: string; // what could go wrong
  controls: Control[];
  source?: "reviewed-module" | "added-on-site"; // on-site additions are shown as such on the PDF
}

export interface Module {
  id: string;
  title: string;
  hrcwCategoryId: string | null; // null = common module (manual handling, power tools…)
  triggers: string[];
  hazards: Hazard[];
  sources: string[]; // codes of practice the module was drafted from
  version: number;
  status: "draft" | "reviewed";
  reviewedBy?: string;
  reviewedAt?: string; // ISO date
  specialistReviewRequired?: boolean; // electrical, asbestos
  specialistReviewedBy?: string;
  // Unique, founder-reviewed plain-English explainer used on the SEO page (min 120 words).
  // No summary = no public page, so search pages are never thin or unreviewed.
  seoSummary?: string;
}

// What the voice brief is turned into. Unknowns stay null — never guessed.
export interface JobBrief {
  transcript: string;
  task: string | null;
  location: string | null;
  maxHeightMetres: number | null;
  trenchDepthMetres: number | null;
  equipment: string[];
  crewSize: number | null;
  siteConditions: string[];
}

export interface CoverageFlag {
  item: string; // the thing from the brief that no reviewed module covers
  message: string;
}

export interface SwmsDraft {
  id: string;
  version: number;
  company: { name: string; abn?: string; logoUrl?: string };
  brief: JobBrief;
  hrcwActivities: { id: string; title: string }[];
  modules: { id: string; title: string; version: number }[];
  hazards: Hazard[]; // controls already ordered by hierarchy
  notCovered: CoverageFlag[];
  notices: string[];
  disclaimer: string;
  createdAt: string;
  contentHash: string; // SHA-256 of the safety content; signatures bind to this
}

export interface SignOff {
  name: string;
  role: string;
  signedAt: string;
  contentHash: string; // must equal the SWMS contentHash at time of signing
  signatureId: string; // which saved signature was applied
  signatureVersion: number;
}

// ===================== signature =====================
// Signature vault. Draw once on the touchpad, save it, apply it to as many documents as needed.
// Redo any time: the new version becomes current, older versions stay on record so documents
// already signed still verify.
//
// Two rules keep signatures legally meaningful:
//  1. Only the owner can apply their own signature. Nobody applies a crew member's signature for them.
//  2. Every application needs a deliberate tap ("Sign here") — never applied automatically —
//     and is stamped with name, role, time and the exact document version.


export interface SavedSignature {
  id: string;
  ownerId: string;
  ownerName: string;
  svgPath: string; // touchpad strokes as an SVG path — crisp at any size, tiny to store
  version: number;
  createdAt: string;
  retiredAt?: string; // set when replaced by a redo
}

export interface SignatureStamp {
  signatureId: string;
  signatureVersion: number;
  ownerId: string;
  ownerName: string;
  role: string;
  fieldId: string;
  documentHash: string;
  appliedAt: string;
}

export class SignatureVault {
  private all: SavedSignature[] = [];

  constructor(existing: SavedSignature[] = []) {
    this.all = [...existing];
  }

  current(ownerId: string): SavedSignature | undefined {
    return this.all.find((s) => s.ownerId === ownerId && !s.retiredAt);
  }

  byId(id: string): SavedSignature | undefined {
    return this.all.find((s) => s.id === id);
  }

  // First save, or a redo if one already exists.
  save(ownerId: string, ownerName: string, svgPath: string): SavedSignature {
    if (!isUsableSignature(svgPath)) throw new Error("That one came out a bit small. Have another go?");
    const prev = this.current(ownerId);
    if (prev) prev.retiredAt = new Date().toISOString();
    const sig: SavedSignature = {
      id: newId(),
      ownerId,
      ownerName,
      svgPath,
      version: prev ? prev.version + 1 : 1,
      createdAt: new Date().toISOString(),
    };
    this.all.push(sig);
    return sig;
  }

  history(ownerId: string): SavedSignature[] {
    return this.all.filter((s) => s.ownerId === ownerId).sort((a, b) => a.version - b.version);
  }

  export(): SavedSignature[] {
    return [...this.all];
  }
}

// Rejects a blank pad or a stray tap: needs a real stroke of reasonable length.
export function isUsableSignature(svgPath: string): boolean {
  const nums = (svgPath.match(/-?\d+(\.\d+)?/g) || []).map(Number);
  if (nums.length < 8) return false;
  let length = 0;
  for (let i = 2; i + 1 < nums.length; i += 2) length += Math.hypot(nums[i] - nums[i - 2], nums[i + 1] - nums[i - 1]);
  return length >= 60;
}

export function applySignature(
  vault: SignatureVault,
  opts: { actingUserId: string; fieldId: string; role: string; documentHash: string; confirmedTap: boolean }
): SignatureStamp {
  if (!opts.confirmedTap) throw new Error("Tap 'Sign here' to apply your signature.");
  const sig = vault.current(opts.actingUserId);
  if (!sig) throw new Error("No saved signature yet. Draw it once and we'll keep it for next time.");
  return {
    signatureId: sig.id,
    signatureVersion: sig.version,
    ownerId: sig.ownerId,
    ownerName: sig.ownerName,
    role: opts.role,
    fieldId: opts.fieldId,
    documentHash: opts.documentHash,
    appliedAt: new Date().toISOString(),
  };
}

export function verifyStamp(vault: SignatureVault, stamp: SignatureStamp, documentHash: string): boolean {
  const sig = vault.byId(stamp.signatureId);
  return !!sig && sig.ownerId === stamp.ownerId && sig.version === stamp.signatureVersion && stamp.documentHash === documentHash;
}

// "Sign everywhere I need to": one tap applies the person's saved signature to every signature
// box that's theirs on the document (e.g. a company form with "Prepared by" on page 1 and
// "Acknowledged" on page 4). Still one deliberate tap, still only their own signature.
export function applyToAllMyFields(
  vault: SignatureVault,
  fields: { id: string; kind: string; signer?: "author" | "crew" | "supervisor" }[],
  opts: { actingUserId: string; as: "author" | "crew" | "supervisor"; role: string; documentHash: string; confirmedTap: boolean }
): SignatureStamp[] {
  const mine = fields.filter((f) => f.kind === "signature" && (f.signer ?? "author") === opts.as);
  return mine.map((f) => applySignature(vault, { ...opts, fieldId: f.id }));
}

// ===================== forms =====================
// Forms: the generic Safe Word SWMS template, and company paperwork uploaded into the dashboard.
// Every field carries its own spoken prompt, spoken help and detail rules, so the voice guide
// can walk the user through any form, ours or theirs.


export type FieldKind = "text" | "longtext" | "number" | "date" | "checkbox" | "signature" | "logo" | "hazards" | "hrcw";

export interface FieldDef {
  id: string;
  key: StandardKey | null; // what the field means, so data can flow between forms
  label: string;
  spokenName?: string; // how it's said out loud, e.g. "the review bit"
  kind: FieldKind;
  required: boolean;
  minWords?: number; // detail check for free-text answers
  mustInclude?: ("number" | "action")[];
  voicePrompt: string; // what the app says to ask for it
  helpPrompt: string; // what the app says if the user asks for help
  nudge?: string; // friendly line when the answer's there but a bit light
  whsPhrase?: boolean; // tidy the spoken answer into WHS language (with faithfulness check)
  signer?: "author" | "crew" | "supervisor";
  place?: { page: number; x: number; y: number; w: number; h: number }; // position on uploaded paperwork (PDF points)
}

export type StandardKey =
  | "businessName" | "abn" | "businessAddress" | "principalContractor" | "siteAddress"
  | "workDescription" | "hrcw" | "hazards" | "responsiblePerson" | "datePrepared"
  | "reviewTrigger" | "authorSignature" | "crewSignatures" | "supervisorSignature" | "logo"
  | "controlMonitoring" | "dateProvided";

export interface FormTemplate {
  id: string;
  name: string;
  kind: "generic" | "company";
  companyId?: string;
  logoUrl?: string; // optional on the generic template
  fileUrl?: string; // original uploaded paperwork (PDF) for company forms
  fields: FieldDef[];
  version: number;
  createdAt: string;
}

const F = (f: FieldDef) => f;

// The name used when talking about a field: "the review bit", not "the when this SWMS will be reviewed".
export const spoken = (f: FieldDef) => f.spokenName ?? f.label.charAt(0).toLowerCase() + f.label.slice(1);

export const GENERIC_SWMS: FormTemplate = {
  id: "generic-swms",
  name: "Safe Word SWMS",
  kind: "generic",
  version: 1,
  createdAt: "2026-10-25",
  fields: [
    // Prompt style: a short question a good offsider would ask. Help is only spoken when asked for.
    F({ id: "logo", key: "logo", label: "Company logo", kind: "logo", required: false,
      voicePrompt: "Add your logo?",
      helpPrompt: "Snap a photo of it, upload one, or find it from your website." }),
    F({ id: "businessName", key: "businessName", label: "Business name", kind: "text", required: true,
      voicePrompt: "Business name?",
      helpPrompt: "Whatever's on your invoices." }),
    F({ id: "abn", key: "abn", label: "ABN", kind: "text", required: true,
      voicePrompt: "And the ABN?",
      helpPrompt: "Eleven digits. Groups are fine." }),
    F({ id: "businessAddress", key: "businessAddress", label: "Business address", kind: "text", required: true, minWords: 3,
      voicePrompt: "And the business address?",
      helpPrompt: "Your business's street address. It goes on every SWMS.",
      nudge: "The business address looks a bit short. What's the suburb?" }),
    F({ id: "principalContractor", key: "principalContractor", label: "Principal contractor", spokenName: "builder", kind: "text", required: false,
      voicePrompt: "Who's the builder on this one?",
      helpPrompt: "The principal contractor running the site. Say none if there isn't one." }),
    F({ id: "siteAddress", key: "siteAddress", label: "Site address", kind: "text", required: true, minWords: 3,
      voicePrompt: "Site address?",
      helpPrompt: "Street and suburb's fine.",
      nudge: "The site address looks a bit short. What's the suburb?" }),
    F({ id: "workDescription", key: "workDescription", label: "Work activity", spokenName: "job description", kind: "longtext", required: true, minWords: 8, whsPhrase: true,
      voicePrompt: "What's the job?",
      helpPrompt: "Talk it through like you'd tell your offsider: the task, the gear, how many of you.",
      nudge: "The job description's a bit light. What gear are you using, and how many of you?" }),
    F({ id: "hrcw", key: "hrcw", label: "High-risk construction work", spokenName: "high-risk work", kind: "hrcw", required: true,
      voicePrompt: "Here's the high-risk work I've picked up. All good?",
      helpPrompt: "Worked out from what you told me. Tell me if anything's missing." }),
    F({ id: "hazards", key: "hazards", label: "Hazards and controls", kind: "hazards", required: true,
      voicePrompt: "Hazards are in. Just need you on the flagged ones.",
      helpPrompt: "What'll you do about it? Something like: stop work if the wind picks up." }),
    F({ id: "responsiblePerson", key: "responsiblePerson", label: "Person responsible for monitoring controls", spokenName: "person keeping an eye on the controls", kind: "text", required: true,
      voicePrompt: "Who's keeping an eye on the controls?",
      helpPrompt: "Usually the leading hand or supervisor." }),
    F({ id: "controlMonitoring", key: "controlMonitoring", label: "How the controls will be checked", spokenName: "control checks", kind: "longtext", required: true, minWords: 6, whsPhrase: true,
      voicePrompt: "How will the controls get checked on site?",
      helpPrompt: "Something like: leading hand checks edge protection and harnesses at the start of each day and after any change.",
      nudge: "The control checks are a bit light. Who checks what, and when?" }),
    F({ id: "reviewTrigger", key: "reviewTrigger", label: "When this SWMS will be reviewed", spokenName: "review bit", kind: "longtext", required: true, minWords: 6, whsPhrase: true,
      voicePrompt: "When should this get reviewed?",
      helpPrompt: "'If the job, crew or conditions change' covers it.",
      nudge: "The review part's a bit light. Something like 'if the job, crew or conditions change' would cover it." }),
    F({ id: "datePrepared", key: "datePrepared", label: "Date prepared", spokenName: "date", kind: "date", required: true,
      voicePrompt: "Today's date okay?",
      helpPrompt: "That's the date it was prepared." }),
    F({ id: "dateProvided", key: "dateProvided", label: "Date given to principal contractor", spokenName: "date it went to the builder", kind: "date", required: false,
      voicePrompt: "When did the builder get a copy?",
      helpPrompt: "Fills in by itself when you email it to the builder." }),
    F({ id: "authorSignature", key: "authorSignature", label: "Prepared by (signature)", spokenName: "your signature", kind: "signature", required: true, signer: "author",
      voicePrompt: "Ready to sign?",
      helpPrompt: "One tap puts your saved signature on." }),
    F({ id: "crewSignatures", key: "crewSignatures", label: "Crew sign-off", spokenName: "crew sign-off", kind: "signature", required: true, signer: "crew",
      voicePrompt: "Crew's turn to sign.",
      helpPrompt: "Pass the phone round or send the link. Everyone signs with their own." }),
  ],
};

// ---------- Company paperwork ----------

// Field names commonly found on company SWMS forms, mapped to what they mean.
const SYNONYMS: Record<StandardKey, string[]> = {
  businessName: ["company", "business name", "contractor name", "pcbu", "employer", "trading name"],
  abn: ["abn", "a.b.n", "business number"],
  businessAddress: ["business address", "company address", "postal address"],
  principalContractor: ["principal contractor", "head contractor", "builder", "main contractor"],
  siteAddress: ["site address", "job address", "work location", "project address", "site location", "location of work"],
  workDescription: ["work activity", "job description", "task description", "scope of work", "description of work", "activity"],
  hrcw: ["high risk", "hrcw", "high-risk construction"],
  hazards: ["hazard", "risk", "control measure", "controls"],
  responsiblePerson: ["responsible person", "person responsible", "supervisor name", "monitoring"],
  datePrepared: ["date prepared", "date", "issue date"],
  controlMonitoring: ["monitor", "monitoring", "how controls", "implemented", "implementation"],
  dateProvided: ["date provided", "date given", "provided to principal", "date issued to"],
  reviewTrigger: ["review", "review date", "revision"],
  authorSignature: ["prepared by", "author signature", "signature of person preparing"],
  crewSignatures: ["worker signature", "employee signature", "crew", "acknowledgement", "sign on", "workers"],
  supervisorSignature: ["supervisor signature", "approved by", "authorised by", "manager signature"],
  logo: ["logo"],
};

export interface DetectedField {
  name: string; // field name read from the PDF form, or label text the user tapped
  kind: "text" | "checkbox" | "signature";
  page: number;
  rect: { x: number; y: number; w: number; h: number };
}

const lc = (s: string) => s.toLowerCase().replace(/[_\-.]+/g, " ").replace(/\s+/g, " ").trim();

export function guessKey(name: string): StandardKey | null {
  const n = lc(name);
  let best: { key: StandardKey; len: number } | null = null;
  for (const [key, words] of Object.entries(SYNONYMS) as [StandardKey, string[]][]) {
    for (const w of words) {
      if (n.includes(w) && (!best || w.length > best.len)) best = { key, len: w.length };
    }
  }
  return best ? best.key : null;
}

// Turns the fields found on an uploaded PDF into a guided Safe Word form.
// Fields we can't place are returned as `unmatched` so the user can label them by voice or tap, once.
export function buildCompanyForm(companyId: string, name: string, fileUrl: string, detected: DetectedField[]) {
  const fields: FieldDef[] = [];
  const unmatched: DetectedField[] = [];
  for (const d of detected) {
    const key = guessKey(d.name);
    const base = GENERIC_SWMS.fields.find((f) => f.key === key);
    if (!key || !base) {
      unmatched.push(d);
      continue;
    }
    fields.push({
      ...base,
      id: `${key}-${fields.length}`,
      label: d.name,
      kind: d.kind === "signature" || base.kind === "signature" ? "signature" : base.kind,
      place: { page: d.page, ...d.rect },
    });
  }
  const form: FormTemplate = {
    id: newId(), name, kind: "company", companyId, fileUrl, fields, version: 1, createdAt: new Date().toISOString(),
  };
  return { form, unmatched };
}

// The user labels an unmatched field ("that box is the site address").
export function labelField(form: FormTemplate, d: DetectedField, key: StandardKey): FormTemplate {
  const base = GENERIC_SWMS.fields.find((f) => f.key === key)!;
  return {
    ...form,
    version: form.version + 1,
    fields: [...form.fields, { ...base, id: `${key}-${form.fields.length}`, label: d.name, place: { page: d.page, ...d.rect } }],
  };
}

// ---------- Paperwork dashboard ----------

export class PaperworkLibrary {
  private forms: FormTemplate[] = [GENERIC_SWMS];
  add(form: FormTemplate) {
    this.forms = this.forms.filter((f) => f.id !== form.id).concat(form);
  }
  remove(id: string) {
    if (id === GENERIC_SWMS.id) throw new Error("The Safe Word template can't be removed.");
    this.forms = this.forms.filter((f) => f.id !== id);
  }
  list(companyId?: string) {
    return this.forms.filter((f) => f.kind === "generic" || f.companyId === companyId);
  }
  get(id: string) {
    return this.forms.find((f) => f.id === id);
  }
}

// ===================== phrasing =====================
// Smart phrasing: turns what the tradie said into clear WHS language for the form.
// It may tidy and restructure. It may NOT add facts, numbers, equipment or controls.
// Every rewrite passes faithfulnessCheck() and is read back for a one-tap OK.
// If the check fails, the user's own words go on the form instead.

export const WHS_PHRASING_PROMPT = `Rewrite the speaker's words as clear, professional Australian WHS wording for a Safe Work Method Statement field.
Rules:
- Keep every fact the speaker gave. Add nothing: no new hazards, controls, equipment, numbers, names or places.
- Use plain, active sentences. Australian spelling. No jargon the speaker didn't use, except standard WHS terms for what they said.
- Convert spoken numbers to digits with units (seven metres -> 7 m, forty k's -> 40 km/h).
- If the speaker's words are too vague to rewrite without guessing, return exactly: NEEDS_MORE_DETAIL
Return only the rewritten text.`;

const WORD_NUMS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90, hundred: 100,
};

export function numbersIn(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(/\d+(\.\d+)?/g)) out.push(Number(m[0]));
  const words = text.toLowerCase().split(/[^a-z]+/);
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (!(w in WORD_NUMS)) continue;
    let v = WORD_NUMS[w];
    // "forty five" -> 45
    if (v >= 20 && v % 10 === 0 && words[i + 1] in WORD_NUMS && WORD_NUMS[words[i + 1]] < 10) {
      v += WORD_NUMS[words[i + 1]];
      i++;
    }
    out.push(v);
  }
  return out;
}

// Control and equipment words the phrasing must never introduce on its own.
const GUARDED_TERMS = [
  "harness", "lanyard", "static line", "guardrail", "edge protection", "scaffold", "ewp", "exclusion zone", "spotter",
  "barricade", "traffic controller", "respirator", "p2", "ppe", "hard hat", "gloves", "glasses", "earmuffs",
  "isolate", "isolation", "lock out", "loto", "tag out", "rcd", "permit", "gas test", "shoring", "trench shield",
  "fire extinguisher", "first aid", "rescue plan", "ladder", "scissor lift", "boom lift", "crane", "dogman", "rigger",
];

export interface FaithfulnessResult {
  ok: boolean;
  problems: string[];
  text: string; // what goes on the form
}

export function faithfulnessCheck(spoken: string, phrased: string): FaithfulnessResult {
  const problems: string[] = [];
  const p = phrased.trim();
  if (p === "NEEDS_MORE_DETAIL") return { ok: false, problems: ["needs more detail"], text: spoken.trim() };

  const said = new Set(numbersIn(spoken));
  for (const n of numbersIn(p)) if (!said.has(n)) problems.push(`added a number that wasn't said: ${n}`);

  const s = spoken.toLowerCase();
  const pl = p.toLowerCase();
  for (const t of GUARDED_TERMS) {
    const re = new RegExp(`\\b${t.replace(/ /g, "\\s+")}`, "i");
    if (re.test(pl) && !re.test(s)) problems.push(`added something that wasn't said: ${t}`);
  }

  const sw = spoken.split(/\s+/).filter(Boolean).length;
  const pw = p.split(/\s+/).filter(Boolean).length;
  if (pw > Math.max(12, sw * 2.5)) problems.push("rewrite is much longer than what was said");

  const ok = problems.length === 0;
  return { ok, problems, text: ok ? p : spoken.trim() };
}

// ===================== guide =====================
// The voice guide: works through any form, asks for each field out loud, checks every answer,
// and runs the final troubleshooting pass. Everything it says is also shown on screen.
// The user can switch to typing at any point; the same checks apply.


export type Values = Record<string, unknown>;

export interface Issue {
  fieldId: string;
  problem: "missing" | "too-brief" | "needs-number" | "needs-action" | "unsigned" | "not-covered";
  spoken: string;
}

const ACTION_WORDS = /\b(stop|use|wear|fit|install|isolate|check|inspect|keep|set up|barricade|tag|lock|test|supervise|restrict|secure|tie|remove|replace|clear|monitor|ensure|provide|maintain|erect|brief)\b/i;

const words = (v: unknown) => (typeof v === "string" ? v.trim().split(/\s+/).filter(Boolean).length : 0);

// accepted: fields the user chose to keep as they are ("that's all", "leave it").
// They're never nudged again. Empty required fields, uncontrolled hazards and missing
// signatures still can't be waved through.
export interface CheckContext { notCoveredCount?: number; accepted?: string[] }

export function checkField(f: FieldDef, v: unknown, ctx: CheckContext = {}): Issue | null {
  const empty = v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);

  // Tone: a mate reading over your shoulder. Points at the exact spot, friendly, no lecturing.
  const label = spoken(f);
  const n = ctx.notCoveredCount ?? 0;
  if (f.kind === "hazards" && n > 0)
    return { fieldId: f.id, problem: "not-covered", spoken: n === 1
      ? "There's one hazard without a control yet. What'll you do about it?"
      : `There are ${n} hazards without a control yet. Want to run through them?` };

  if (f.kind === "signature") {
    const stamps = (Array.isArray(v) ? v : v ? [v] : []) as SignatureStamp[];
    if (f.required && stamps.length === 0)
      return { fieldId: f.id, problem: "unsigned", spoken: f.signer === "crew" ? "Just waiting on the crew to sign." : "You haven't signed it yet." };
    return null;
  }

  if (empty) return f.required ? { fieldId: f.id, problem: "missing", spoken: `Looks like the ${label} hasn't gone in yet.` } : null;

  const kept = ctx.accepted?.includes(f.id) ?? false;

  if (!kept && f.minWords && words(v) < f.minWords)
    return { fieldId: f.id, problem: "too-brief", spoken: f.nudge ?? `The ${label} is a bit light. Can you add a bit more?` };

  if (typeof v === "string") {
    if (!kept && f.mustInclude?.includes("number") && numbersIn(v).length === 0)
      return { fieldId: f.id, problem: "needs-number", spoken: `The ${label} needs a number. Roughly how many?` };
    if (f.mustInclude?.includes("action") && !ACTION_WORDS.test(v))
      return { fieldId: f.id, problem: "needs-action", spoken: "That one doesn't say what you'll actually do yet. What's the plan?" };
  }

  if (f.key === "abn" && typeof v === "string" && v.replace(/\D/g, "").length !== 11)
    return { fieldId: f.id, problem: "missing", spoken: "That ABN looks a digit or two off. Mind reading it out again?" };

  return null;
}

// Checks a single control the user adds for a "not covered" item.
// A short control is fine if it says what they'll do ("stop if it's windy") and they've said
// that's all. It still has to be an actual action.
export function checkControl(text: string, keptAsIs = false): string | null {
  if (!keptAsIs && words(text) < 4) return "That's a bit light. What'll you do, and how?";
  if (!ACTION_WORDS.test(text)) return "That one doesn't say what you'll actually do yet. What's the plan?";
  return null;
}

// ---------- How the guide talks ----------
// Ask, don't explain. Help only when asked for, or after a second miss.
// The second ask is shorter, never a repeat. Regular users get even less.

export interface TalkState {
  attempts: Record<string, number>; // failed answers per field
  completedSwms: number; // after a few, prompts shrink to the bare question
  muted: boolean; // text and taps only
}

export function whatToSay(f: FieldDef, s: TalkState, askedForHelp = false): string | null {
  if (s.muted) return null;
  if (askedForHelp) return f.helpPrompt;
  const tries = s.attempts[f.id] ?? 0;
  if (tries >= 2) return f.helpPrompt;
  if (tries === 1 || s.completedSwms >= 5) return shortPrompt(f);
  return f.voicePrompt;
}

export function shortPrompt(f: FieldDef): string {
  if (f.kind === "signature") return f.signer === "crew" ? "Crew to sign." : "Sign?";
  return `${f.label.split(/\s+\(|\s+for\s/)[0]}?`;
}

// Fields we already know (saved business details, last site, today's date) are filled in
// silently and only shown in the final read-back — never asked.
export function prefill(form: FormTemplate, profile: Partial<Record<string, unknown>>, today: string): Values {
  const out: Values = {};
  for (const f of form.fields) {
    if (f.key === "datePrepared") out[f.id] = today;
    else if (f.key && profile[f.key] !== undefined && f.kind !== "signature") out[f.id] = profile[f.key];
  }
  return out;
}

// Final troubleshooting pass before the form can be sent.
export function troubleshoot(form: FormTemplate, values: Values, ctx: CheckContext = {}): Issue[] {
  return form.fields.map((f) => checkField(f, values[f.id], ctx)).filter((x): x is Issue => !!x);
}

export function troubleshootSummary(issues: Issue[]): string {
  if (issues.length === 0) return "Had a read through. Looks good to me. Ready to send.";
  if (issues.length === 1) return `Had a read through. Just one thing: ${issues[0].spoken}`;
  return `Had a read through. Just ${issues.length} things to sort. First up: ${issues[0].spoken}`;
}

// What to ask next, in form order.
export function nextPrompt(form: FormTemplate, values: Values, ctx: CheckContext = {}) {
  for (const f of form.fields) {
    if (!(f.id in values) && f.required) return { fieldId: f.id, spoken: f.voicePrompt };
    const issue = checkField(f, values[f.id], ctx);
    if (issue) return { fieldId: f.id, spoken: issue.spoken };
  }
  return { fieldId: null, spoken: troubleshootSummary([]) };
}


// ===================== commands =====================
// Everything a person can say to Safe Word. Plain Aussie speech, lots of ways to say each thing.
// Anything that isn't a command is treated as an answer to the current field.


export type Command =
  // moving around
  | { type: "next" } | { type: "back" } | { type: "goTo"; field: string } | { type: "whatsLeft" } | { type: "finish" }
  // answering
  | { type: "yes" } | { type: "no" } | { type: "keep" } | { type: "skip" } | { type: "undo" }
  | { type: "change"; field: string; value: string } | { type: "clear"; field: string } | { type: "readField"; field: string }
  | { type: "addHazard" } | { type: "sameAsLast" }
  // help, on the user's terms
  | { type: "help" } | { type: "suggest" } | { type: "useSuggestion" } | { type: "repeat" } | { type: "readBack" } | { type: "check" }
  // documents
  | { type: "newSwms" } | { type: "usePaperwork" } | { type: "useTemplate" } | { type: "openOld" }
  // signing
  | { type: "sign" } | { type: "redoSignature" } | { type: "whoSigned" } | { type: "passPhone" } | { type: "sendCrewLink" }
  // getting it out
  | { type: "send" } | { type: "email" } | { type: "emailTo"; name: string } | { type: "print" } | { type: "save" }
  // how the app talks
  | { type: "typeMode" } | { type: "voiceMode" } | { type: "quiet" } | { type: "slower" } | { type: "faster" }
  | { type: "voice"; gender: "female" | "male" } | { type: "pause" } | { type: "resume" } | { type: "stop" } | { type: "cancel" }
  | { type: "answer"; text: string };

type Rule = [RegExp, (m: RegExpMatchArray) => Command];
const fixed = (type: Command["type"]) => () => ({ type } as Command);

const RULES: Rule[] = [
  // Aussie double negatives first: "yeah nah" means no, "nah yeah" means yes.
  [/^yeah,? ?nah\b/, fixed("no")],
  [/^nah,? ?yeah\b/, fixed("yes")],

  [/^(?:change|make|set|update|put)\s+(?:the\s+)?(.+?)\s+(?:to|as)\s+(.+)$/, (m) => ({ type: "change", field: m[1], value: m[2] })],
  [/^(?:clear|wipe|delete|rub out|scrub|get rid of)\s+(?:the\s+)?(.+)$/, (m) => ({ type: "clear", field: m[1] })],
  [/^(?:go to|jump to|take me to|back to|open)\s+(?:the\s+)?(.+?)(?:\s+(?:bit|part|section))?$/, (m) =>
    /(old|last|previous)\s+(swms|report|one|job)/.test(m[1]) ? { type: "openOld" } : { type: "goTo", field: m[1] }],
  [/^(?:what'?s|what is|read me|read out|tell me)\s+(?:the\s+)?(.+?)(?:\s+say)?$/, (m) =>
    /^missing$/.test(m[1]) ? { type: "check" } : /^(left|next|to go)$/.test(m[1]) ? { type: "whatsLeft" } : { type: "readField", field: m[1] }],
  [/^(?:email|send|flick)\s+(?:it|this|that)?\s*(?:over\s+)?to\s+(?:the\s+)?(.+)$/, (m) => ({ type: "emailTo", name: m[1] })],
  [/^(?:use|switch to|go with)\s+(?:the\s+)?(female|male|woman'?s?|man'?s?|bloke'?s?|lady'?s?)\s*(?:voice)?$/, (m) =>
    ({ type: "voice", gender: /fem|wom|lad/.test(m[1]) ? "female" : "male" })],

  [/^(next|next one|keep going|carry on|moving on|onwards)$/, fixed("next")],
  [/^(back|go back|previous|last one|back one)$/, fixed("back")],
  [/^(what'?s left|how many (to go|left)|what else|anything else)$/, fixed("whatsLeft")],
  [/^(i'?m done|done|finished|that'?s everything|all done|wrap it up)$/, fixed("finish")],

  [/^(yes|yep|yeah|yup|correct|that'?s right|spot on|too right|righto|sure|ok|okay|go for it|sweet|bang on|yes please|perfect|you bet)$/, fixed("yes")],
  [/^(no|nope|nah|wrong|that'?s wrong|not quite|not right|no thanks)$/, fixed("no")],
  [/^(that'?s (all|it|all i'?ve got|enough|fine|all there is)|that'?ll do|leave it( like that| there| as is)?|keep it( as is)?|good as is|good enough|it'?s fine( as is)?|all good|nothing more|no more|she'?ll be right)$/, fixed("keep")],
  [/^(skip|skip it|skip that|not needed|doesn'?t apply|n\/?a|not applicable|none|no one|nobody)$/, fixed("skip")],
  [/^(undo|scratch that|take that back|that'?s not what i said|not what i said|undo that|go back on that)$/, fixed("undo")],
  [/^(add (a|another) hazard|there'?s another hazard|one more hazard|new hazard)$/, fixed("addHazard")],
  [/^(same as (last|the last) (job|time|one)|same as yesterday|same site( as last time)?|copy (the )?last (job|one))$/, fixed("sameAsLast")],

  [/^(help|i don'?t know|not sure|what do you need|what do i say|what goes here|what do i put)$/, fixed("help")],
  [/^(suggest something|give me a suggestion|what would you put|any ideas|got a suggestion|suggestion)$/, fixed("suggest")],
  [/^(use that|that'?ll work|put that in|go with that|use the suggestion|yeah use that)$/, fixed("useSuggestion")],
  [/^(repeat|say that again|what was that|pardon|come again|sorry|what)$/, fixed("repeat")],
  [/^(read it back|read back|what have you got|read it out|read the lot)$/, fixed("readBack")],
  [/^(check|check it|check it over|have a look|look over it|am i done|is it done|what'?s missing|anything missing)$/, fixed("check")],

  [/^(new swms|new one|start a new one|new job|fresh one|start again|start fresh)$/, fixed("newSwms")],
  [/^(use my (paperwork|form|company form|own form|template)|use (our|the company) (form|paperwork))$/, fixed("usePaperwork")],
  [/^(use the (template|standard one|safe word one|normal one|generic one))$/, fixed("useTemplate")],
  [/^(open (an )?old (one|report|swms)|use an old (one|report|swms)|start from an old (one|report))$/, fixed("openOld")],

  [/^(sign|sign it|sign here|add my signature|put my signature on|signature)$/, fixed("sign")],
  [/^(redo my signature|new signature|change my signature|do my signature again)$/, fixed("redoSignature")],
  [/^(who'?s signed|who has signed|who still needs to sign|who'?s left( to sign)?|has everyone signed)$/, fixed("whoSigned")],
  [/^(pass the phone( around)?|crew (to )?sign|crew'?s turn|hand it round)$/, fixed("passPhone")],
  [/^(send the (crew|boys|team|guys) the link|text the (crew|team|boys)|send (the )?link)$/, fixed("sendCrewLink")],

  [/^(send|send it|send it off|fire it off)$/, fixed("send")],
  [/^(email|email it|email that)$/, fixed("email")],
  [/^(print|print it|print that|print a copy)$/, fixed("print")],
  [/^(save|save it|save to (my )?phone|download|keep a copy)$/, fixed("save")],

  [/^(type|i'?ll type|let me type|keyboard|switch to typing|text mode)$/, fixed("typeMode")],
  [/^(voice|talk|switch to voice|voice mode|i'?ll talk)$/, fixed("voiceMode")],
  [/^(quiet|be quiet|shush|shh+|mute|voice off|go quiet|stop talking)$/, fixed("quiet")],
  [/^(slow down|slower|too fast|bit slower)$/, fixed("slower")],
  [/^(speed up|faster|bit faster|quicker)$/, fixed("faster")],
  [/^(hang on|give me a (sec|second|minute)|one sec|wait|hold on|just a sec)$/, fixed("pause")],
  [/^(ok go|go on|righto go|ready|i'?m back|carry on then)$/, fixed("resume")],
  [/^(stop)$/, fixed("stop")],
  [/^(cancel|forget it|never mind|don'?t worry about it)$/, fixed("cancel")],
];

export function parseCommand(utterance: string): Command {
  const u = utterance.trim().toLowerCase().replace(/[.!?,]+$/g, "").replace(/\s+/g, " ");
  for (const [re, make] of RULES) {
    const m = u.match(re);
    if (m) return make(m);
  }
  return { type: "answer", text: utterance.trim() };
}

// Everyday names people use for each field.
const FIELD_ALIASES: Partial<Record<StandardKey, string[]>> = {
  businessName: ["business", "company", "business name", "company name"],
  abn: ["abn", "business number"],
  principalContractor: ["builder", "principal contractor", "head contractor", "contractor"],
  siteAddress: ["address", "site", "site address", "job address", "location"],
  workDescription: ["job", "work", "job description", "work activity", "task", "description"],
  hrcw: ["high risk", "high-risk work", "high risk work"],
  hazards: ["hazards", "controls", "hazards and controls", "risks"],
  responsiblePerson: ["responsible person", "supervisor", "who's responsible", "person responsible"],
  reviewTrigger: ["review", "review date", "when to review"],
  datePrepared: ["date"],
  businessAddress: ["business address", "company address", "office address"],
  controlMonitoring: ["monitoring", "checks", "control checks"],
  dateProvided: ["date provided", "date it went to the builder"],
  authorSignature: ["my signature"],
  crewSignatures: ["crew signatures", "crew sign off", "sign off"],
  logo: ["logo"],
};

export function matchField(form: FormTemplate, spokenName: string): FieldDef | null {
  const n = spokenName.toLowerCase().trim();
  return (
    form.fields.find((f) => f.label.toLowerCase() === n) ||
    form.fields.find((f) => f.key && FIELD_ALIASES[f.key]?.includes(n)) ||
    form.fields.find((f) => f.label.toLowerCase().includes(n) || n.includes(f.label.toLowerCase())) ||
    null
  );
}

// ===================== replies =====================
// What Safe Word says back. Specific, short, friendly — it names the actual thing, never a generic "done".
// Tone rules (enforced by TONE_BANNED in the self-test): the user is in charge. We offer, we don't instruct.
// Never "you need to", "you must", "you forgot", "invalid", "error", "please" or anything that sounds like a telling-off.


export const TONE_BANNED = [
  "you need to", "you must", "you have to", "you forgot", "you didn't", "you did not", "you should",
  "invalid", "error", "incorrect", "failed", "please", "required field", "as an ai", "i'm sorry, but", "mandatory",
];

const list = (names: string[]) =>
  names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

export interface Contact { name: string; company?: string; email?: string }

export const Replies = {
  // Signing
  whoSigned(signed: string[], waiting: string[]): string {
    if (signed.length === 0 && waiting.length === 0) return "No one's on the crew list yet. Who's working on this one?";
    if (signed.length === 0) return `No one's signed yet. Waiting on ${list(waiting)}.`;
    if (waiting.length === 0) return `Everyone's signed: ${list(signed)}.`;
    return `${list(signed)} ${signed.length === 1 ? "has" : "have"} signed. Just ${list(waiting)} to go.`;
  },
  crewLinkSent(count: number) {
    return `Link's gone to ${count === 1 ? "one person" : `all ${count}`}. I'll let you know as they sign.`;
  },
  crewMemberSigned(name: string, remaining: number) {
    return remaining === 0 ? `${name}'s signed. That's everyone.` : `${name}'s signed. ${remaining} to go.`;
  },
  redoSignature() { return "Draw your new one whenever you're ready. Your old one stays on anything already signed."; },

  // Sending
  emailTo(c: Contact | null, spokenName: string): string {
    if (!c) return `I haven't got an email for ${spokenName} yet. What's their email?`;
    if (!c.email) return `I've got ${c.name} but no email. What's the best one?`;
    return `Sending to ${c.name}${c.company ? ` at ${c.company}` : ""}.`;
  },
  emailed(c: Contact) { return `Sent to ${c.name}. It's in your sent folder.`; },
  sendOptions() { return "Email, print or save it?"; },
  saved(name: string) { return `${name} saved to your phone.`; },
  printing() { return "Sending it to the printer."; },

  // Moving around
  whatsLeft(remaining: FieldDef[]): string {
    if (remaining.length === 0) return "Nothing left. Want me to read over it?";
    if (remaining.length === 1) return `Just the ${spoken(remaining[0])} left.`;
    if (remaining.length === 2) return `Two to go: the ${spoken(remaining[0])}, then the ${spoken(remaining[1])}.`;
    return `${remaining.length} to go. Next up is the ${spoken(remaining[0])}.`;
  },
  readField(f: FieldDef, value: unknown): string {
    if (value === undefined || value === null || value === "") return `The ${spoken(f)} is still blank.`;
    return `The ${spoken(f)} says: ${String(value)}.`;
  },
  goTo(f: FieldDef) { return f.voicePrompt; },
  cleared(f: FieldDef) { return `Cleared the ${spoken(f)}.`; },
  changed(f: FieldDef, value: string) { return `Changed the ${spoken(f)} to ${value}.`; },
  undone(f: FieldDef, previous: unknown) {
    return previous === undefined || previous === "" ? `Put the ${spoken(f)} back to blank.` : `Put the ${spoken(f)} back to ${String(previous)}.`;
  },
  noField(spoken: string) { return `Not sure which bit you mean by ${spoken}. Which one?`; },

  // Documents
  newSwms(formName: string | null) { return formName ? `New one on your ${formName}. What's the job?` : "New one. What's the job?"; },
  sameAsLast(jobName: string, copied: string[]) {
    return `Copied the ${list(copied.map(lower))} from ${jobName}. Signatures start fresh.`;
  },
  reused(jobName: string, carried: number, left: number) {
    return left === 0
      ? `Copied ${carried} fields from ${jobName}. Have a look over it before anyone signs.`
      : `Copied ${carried} fields from ${jobName}. ${left} left to fill. Voice or keyboard?`;
  },
  hazardsRebuilt() { return "I've rebuilt the hazards from our latest reviewed content, so they're current."; },

  // Help, on request
  suggestion(text: string, basis: string) { return `${basis}: ${text}. Want that, or something different?`; },
  noSuggestion() { return "Nothing I'd want to guess on that one. What would you put?"; },

  // Mishearing — offers, never blame
  notHeard(times: number) {
    return times <= 1 ? "Didn't catch that." : "Still not catching it, it might be the noise. Want to type that one?";
  },

  // Modes
  typeMode() { return "Typing it is. I'll stay quiet unless you ask."; },
  voiceMode(remaining: number) {
    return remaining === 0 ? "Righto, I'm listening." : `Righto. ${remaining} left, I'll go through them with you.`;
  },
  quiet() { return "Going quiet. Tap the mic or say voice on when you want me."; },
  paused() { return "No worries, take your time."; },
  cancelled() { return "No worries, left it as it was."; },
  voiceChanged(gender: "female" | "male") { return gender === "female" ? "This is the female voice. Sound alright?" : "This is the male voice. Sound alright?"; },
};

// ===================== pacing =====================
// Pacing: WHEN the voice speaks matters as much as what it says.
// The person is in charge. The voice waits its turn, never talks over them, never chases them,
// and saves its observations for when they ask, like a good offsider would.
//
// Rules this enforces:
//  1. Never speak while the person is talking, typing or touching the screen.
//  2. Wait for them to finish. Short answers: a 0.9 s pause ends the turn. Long answers
//     (job description, controls): 2.2 s, because people pause to think mid-sentence.
//  3. After any tap or keystroke, stay quiet for 5 s. They're doing it themselves.
//  4. Silence is fine. If they go quiet on a field, the voice says nothing; the ℹ️ button glows softly
//     after 12 s. Help is only spoken when they ask, or offered (as a question) after a second miss.
//  5. One offer per field, ever. If they ignore it, it's dropped.
//  6. Light answers are not flagged during filling. They're saved for the read-over, which only
//     happens when they say they're done or reach the end.
//  7. At least 0.6 s between anything the app says, so it never gabbles.
//  8. "Stop", "hang on" or "quiet" silence it instantly.

export type Event =
  | { type: "speechStart"; at: number }
  | { type: "speechEnd"; at: number; longAnswerField: boolean }
  | { type: "touch"; at: number }
  | { type: "appSpoke"; at: number }
  | { type: "fieldChanged"; at: number; fieldId: string }
  | { type: "missed"; fieldId: string } // answer not understood or rejected
  | { type: "offerMade"; fieldId: string }
  | { type: "pause" } | { type: "resume" } | { type: "quiet" } | { type: "voiceOn" };

export const PACING = {
  endOfTurnShortMs: 900,
  endOfTurnLongMs: 2200,
  quietAfterTouchMs: 5000,
  infoGlowAfterMs: 12000,
  minGapMs: 600,
};

export class Pacer {
  private speaking = false;
  private lastSpeechEnd = -Infinity;
  private lastLong = false;
  private lastTouch = -Infinity;
  private lastAppSpoke = -Infinity;
  private fieldSince = 0;
  private misses: Record<string, number> = {};
  private offered = new Set<string>();
  private paused = false;
  private muted = false;
  private field: string | null = null;

  on(e: Event): void {
    switch (e.type) {
      case "speechStart": this.speaking = true; break;
      case "speechEnd": this.speaking = false; this.lastSpeechEnd = e.at; this.lastLong = e.longAnswerField; break;
      case "touch": this.lastTouch = e.at; break;
      case "appSpoke": this.lastAppSpoke = e.at; break;
      case "fieldChanged": this.field = e.fieldId; this.fieldSince = e.at; break;
      case "missed": this.misses[e.fieldId] = (this.misses[e.fieldId] ?? 0) + 1; break;
      case "offerMade": this.offered.add(e.fieldId); break;
      case "pause": this.paused = true; break;
      case "resume": this.paused = false; break;
      case "quiet": this.muted = true; break;
      case "voiceOn": this.muted = false; break;
    }
  }

  // May the app speak right now?
  canSpeak(now: number): boolean {
    if (this.muted || this.paused || this.speaking) return false;
    if (now - this.lastTouch < PACING.quietAfterTouchMs) return false;
    if (now - this.lastAppSpoke < PACING.minGapMs) return false;
    const wait = this.lastLong ? PACING.endOfTurnLongMs : PACING.endOfTurnShortMs;
    return now - this.lastSpeechEnd >= wait;
  }

  // Answers to direct commands ("who's signed?") skip the touch hold-off but still wait their turn.
  canReply(now: number): boolean {
    if (this.muted || this.speaking) return false;
    const wait = this.lastLong ? PACING.endOfTurnLongMs : PACING.endOfTurnShortMs;
    return now - this.lastSpeechEnd >= Math.min(wait, PACING.endOfTurnShortMs) && now - this.lastAppSpoke >= PACING.minGapMs;
  }

  // Visual only: soft glow on the ℹ️ button after a long quiet spell. Never a voice prompt.
  showInfoGlow(now: number): boolean {
    return this.field !== null && now - this.fieldSince >= PACING.infoGlowAfterMs && now - this.lastTouch >= PACING.infoGlowAfterMs;
  }

  // Offer a suggestion (as a question) only after a second miss, once per field.
  shouldOfferSuggestion(fieldId: string): boolean {
    return !this.muted && (this.misses[fieldId] ?? 0) >= 2 && !this.offered.has(fieldId);
  }
}

export const OFFER_LINE = "Want a suggestion for that one?";

// ===================== extract =====================
// Turns a voice transcript into a structured JobBrief, then checks it strictly.
// The model is only asked to EXTRACT what the tradie said. It never writes hazards or controls.


export const TRADE_VOCABULARY = [
  "EWP", "scissor lift", "boom lift", "RCD", "tilt-up", "precast", "excavator", "bobcat",
  "telehandler", "scaffold", "harness", "static line", "exclusion zone", "spotter",
  "angle grinder", "nail gun", "jackhammer", "concrete saw", "fibro", "Colorbond",
  "switchboard", "isolation", "lock out tag out", "LOTO", "trench shield", "acrow prop",
];

// Pass TRADE_VOCABULARY to the speech-to-text service as custom vocabulary / keyterms
// where the provider supports it. This is the single biggest accuracy gain on site.

export const EXTRACTION_PROMPT = `You extract job details from an Australian tradie's spoken description of a job.
Return ONLY valid JSON matching this shape:
{"task": string|null, "location": string|null, "maxHeightMetres": number|null,
 "trenchDepthMetres": number|null, "equipment": string[], "crewSize": number|null,
 "siteConditions": string[]}
Rules:
- Use only what the speaker said. If something was not said, use null or [].
- Never invent hazards, controls, equipment or numbers.
- Convert spoken numbers to digits ("two storey" is NOT a height; leave maxHeightMetres null unless a height was stated).
- Keep trade terms as spoken (EWP, scissor lift, bobcat).
- siteConditions = things about the site: wet, windy, live traffic, occupied house, asbestos suspected, near power lines.`;

export function parseBrief(transcript: string, modelJson: string): JobBrief {
  let raw: any;
  try {
    raw = JSON.parse(modelJson);
  } catch {
    throw new Error("Extraction returned invalid JSON — retry, never guess");
  }
  const str = (v: any) => (typeof v === "string" && v.trim() ? v.trim() : null);
  const num = (v: any) => (typeof v === "number" && isFinite(v) && v >= 0 ? v : null);
  const list = (v: any) =>
    Array.isArray(v) ? v.filter((x) => typeof x === "string" && x.trim()).map((x: string) => x.trim()) : [];
  const crew = num(raw.crewSize);
  return {
    transcript,
    task: str(raw.task),
    location: str(raw.location),
    maxHeightMetres: num(raw.maxHeightMetres),
    trenchDepthMetres: num(raw.trenchDepthMetres),
    equipment: list(raw.equipment),
    crewSize: crew !== null && Number.isInteger(crew) && crew > 0 ? crew : null,
    siteConditions: list(raw.siteConditions),
  };
}

// One short follow-up question at a time, most important first.
export function nextFollowUp(brief: JobBrief, heightLikely: boolean): string | null {
  if (!brief.task) return "What's the job you're doing today?";
  if (heightLikely && brief.maxHeightMetres === null)
    return "Roughly how high off the ground will you be working, in metres?";
  if (brief.equipment.length === 0) return "What gear and tools are you using?";
  if (brief.crewSize === null) return "How many in the crew?";
  return null;
}

// The read-back the tradie confirms with one tap.
export function readBack(brief: JobBrief): string {
  const parts = [
    brief.task,
    brief.location,
    brief.maxHeightMetres !== null ? `up to ${brief.maxHeightMetres} m` : null,
    brief.equipment.length ? brief.equipment.join(", ") : null,
    brief.crewSize !== null ? `${brief.crewSize} crew` : null,
  ].filter(Boolean);
  return `${parts.join(" — ")}. Correct?`;
}

// ===================== select =====================
// Decides which HRCW activities apply and which reviewed modules to use.
// Anything the brief mentions that no reviewed module covers is FLAGGED, never filled in.


const norm = (s: string) => ` ${s.toLowerCase().replace(/[^a-z0-9.\- ]+/g, " ").replace(/\s+/g, " ")} `;
// Matches at the start of a word, so "roof" also catches "roofing". Leaning towards
// catching too much is deliberate: a missed high-risk activity is worse than an extra one.
const mentions = (text: string, term: string) => text.includes(norm(term).trimEnd());

function briefText(b: JobBrief): string {
  return norm([b.transcript, b.task ?? "", b.location ?? "", ...b.equipment, ...b.siteConditions].join(" "));
}

export function isPublishable(m: Module): boolean {
  if (m.status !== "reviewed" || !m.reviewedBy || !m.reviewedAt) return false;
  if (m.specialistReviewRequired && !m.specialistReviewedBy) return false;
  return true;
}

export interface Selection {
  hrcw: { id: string; title: string }[];
  modules: Module[];
  notCovered: CoverageFlag[];
  notices: string[];
  needsHeight: boolean;
}

export function select(brief: JobBrief, library: Module[]): Selection {
  const text = briefText(brief);
  const notices: string[] = [];
  const notCovered: CoverageFlag[] = [];

  // 1. Detect HRCW activities.
  const detected = new Set<string>();
  for (const c of HRCW_CATEGORIES) {
    if (c.triggers.some((t) => mentions(text, t))) detected.add(c.id);
  }
  // Numbers override keyword guesses where we have them.
  const heightWords = detected.has("falls");
  if (brief.maxHeightMetres !== null) {
    if (brief.maxHeightMetres > JURISDICTION.fallThresholdMetres) detected.add("falls");
    else detected.delete("falls");
  }
  if (brief.trenchDepthMetres !== null) {
    if (brief.trenchDepthMetres > JURISDICTION.trenchDepthMetres) detected.add("trench-tunnel");
    else if (!mentions(text, "tunnel") && !mentions(text, "shaft")) detected.delete("trench-tunnel");
  }

  // 2. Pick reviewed modules only.
  const usable = library.filter(isPublishable);
  const chosen = usable.filter(
    (m) =>
      (m.hrcwCategoryId !== null && detected.has(m.hrcwCategoryId)) ||
      (m.hrcwCategoryId === null && m.triggers.some((t) => mentions(text, t)))
  );

  // 3. Flag HRCW activities with no reviewed module.
  for (const id of detected) {
    if (!chosen.some((m) => m.hrcwCategoryId === id)) {
      const cat = HRCW_CATEGORIES.find((c) => c.id === id)!;
      notCovered.push({
        item: cat.title,
        message: "Not covered: no reviewed module for this high-risk activity. Add hazards and controls before work starts.",
      });
    }
  }

  // 4. Flag equipment and site conditions no chosen module mentions.
  const covered = (term: string) =>
    chosen.some((m) => m.triggers.some((t) => norm(term).includes(norm(t).trim()) || norm(t).includes(norm(term).trim())));
  for (const item of [...brief.equipment, ...brief.siteConditions]) {
    if (!covered(item)) notCovered.push({ item, message: "Not covered: add a control." });
  }

  // 5. Legal notice when no HRCW is detected.
  if (detected.size === 0) {
    notices.push(
      "No high-risk construction work detected in this brief. A SWMS may not be legally required for this job, but the risks still need managing."
    );
  }

  return {
    hrcw: HRCW_CATEGORIES.filter((c) => detected.has(c.id)).map((c) => ({ id: c.id, title: c.title })),
    modules: chosen,
    notCovered,
    notices,
    needsHeight: heightWords && brief.maxHeightMetres === null,
  };
}

// ===================== assemble =====================
// Builds the SWMS from the selection, and binds crew sign-offs to the exact content signed.


const LEVEL_ORDER: ControlLevel[] = ["elimination", "substitution", "isolation", "engineering", "administrative", "ppe"];

export const DISCLAIMER =
  "This SWMS was prepared from the job details provided and content reviewed by a WHS-qualified professional. " +
  "It is not a certification of compliance. The business doing the work is responsible for checking it against the site, " +
  "consulting workers, putting the controls in place and monitoring them. If the work changes or the SWMS is not followed, stop work and review it.";

function orderControls(h: Hazard): Hazard {
  return { ...h, controls: [...h.controls].sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level)) };
}

// Stable JSON so the same content always gives the same hash.
function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (v && typeof v === "object")
    return `{${Object.keys(v as object).sort().map((k) => `${JSON.stringify(k)}:${canonical((v as any)[k])}`).join(",")}}`;
  return JSON.stringify(v);
}

export function hashContent(d: Pick<SwmsDraft, "brief" | "hrcwActivities" | "modules" | "hazards" | "notCovered" | "version">): string {
  return sha256Hex(canonical({ brief: d.brief, hrcw: d.hrcwActivities, modules: d.modules, hazards: d.hazards, notCovered: d.notCovered, version: d.version }));
}

export function assemble(brief: JobBrief, sel: Selection, company: SwmsDraft["company"]): SwmsDraft {
  // De-duplicate hazards shared across modules.
  const seen = new Set<string>();
  const hazards: Hazard[] = [];
  for (const m of sel.modules)
    for (const h of m.hazards)
      if (!seen.has(h.id)) {
        seen.add(h.id);
        hazards.push(orderControls({ ...h, source: "reviewed-module" }));
      }

  const base = {
    id: newId(),
    version: 1,
    company,
    brief,
    hrcwActivities: sel.hrcw,
    modules: sel.modules.map((m) => ({ id: m.id, title: m.title, version: m.version })),
    hazards,
    notCovered: sel.notCovered,
    notices: sel.notices,
    disclaimer: DISCLAIMER,
    createdAt: new Date().toISOString(),
  };
  return { ...base, contentHash: hashContent(base) };
}

// Any edit creates a new version with a new hash — existing signatures no longer count.
export function applyEdit(d: SwmsDraft, change: Partial<Pick<SwmsDraft, "hazards" | "notCovered" | "brief">>): SwmsDraft {
  const next = { ...d, ...change, version: d.version + 1 };
  return { ...next, contentHash: hashContent(next) };
}

// The crew resolves a "not covered" flag by adding their own hazard and controls on site.
// It is labelled as added on site, not as reviewed content.
export function resolveFlag(d: SwmsDraft, item: string, hazard: Omit<Hazard, "source">, keptAsIs = false): SwmsDraft {
  if (hazard.controls.length === 0) throw new Error("Add at least one control.");
  for (const c of hazard.controls) {
    const problem = checkControl(c.text, keptAsIs);
    if (problem) throw new Error(problem);
  }
  return applyEdit(d, {
    hazards: [...d.hazards, orderControls({ ...hazard, source: "added-on-site" })],
    notCovered: d.notCovered.filter((f) => f.item !== item),
  });
}

// Crew sign-off uses each person's own saved signature (see signature.ts).
export function signOff(d: SwmsDraft, stamp: SignatureStamp): SignOff {
  if (d.notCovered.length > 0) throw new Error("There's still a hazard without a control. Once that's sorted the crew can sign.");
  if (stamp.documentHash !== d.contentHash) throw new Error("This signature was applied to a different version of the SWMS.");
  return {
    name: stamp.ownerName,
    role: stamp.role,
    signedAt: stamp.appliedAt,
    contentHash: d.contentHash,
    signatureId: stamp.signatureId,
    signatureVersion: stamp.signatureVersion,
  };
}

export function validSignatures(d: SwmsDraft, sigs: SignOff[]): SignOff[] {
  return sigs.filter((s) => s.contentHash === d.contentHash);
}

// ===================== gate =====================
// Launch gate: real site recordings, scored automatically. 9 out of 10 or no launch.


export interface GateCase {
  name: string;
  brief: JobBrief; // what the voice pipeline produced from the recording
  expect: {
    task: boolean; // task captured
    equipment: string[]; // must all appear
    crewSize: number | null;
    hrcw: string[]; // HRCW category ids that must be detected
  };
}

export interface GateResult {
  name: string;
  pass: boolean;
  problems: string[];
}

export function scoreCase(c: GateCase, library: Module[]): GateResult {
  const problems: string[] = [];
  const b = c.brief;
  if (c.expect.task && !b.task) problems.push("task missing");
  const eq = b.equipment.map((e) => e.toLowerCase());
  for (const e of c.expect.equipment) if (!eq.some((x) => x.includes(e.toLowerCase()))) problems.push(`equipment missed: ${e}`);
  if (c.expect.crewSize !== b.crewSize) problems.push(`crew size ${b.crewSize} ≠ ${c.expect.crewSize}`);
  const got = select(b, library).hrcw.map((h) => h.id);
  for (const id of c.expect.hrcw) if (!got.includes(id)) problems.push(`high-risk activity missed: ${id}`);
  return { name: c.name, pass: problems.length === 0, problems };
}

export function runGate(cases: GateCase[], library: Module[], threshold = 0.9) {
  const results = cases.map((c) => scoreCase(c, library));
  const passed = results.filter((r) => r.pass).length;
  const rate = cases.length ? passed / cases.length : 0;
  return { results, passed, total: cases.length, rate, launch: cases.length >= 10 && rate >= threshold };
}

// ===================== reuse =====================
// Drafts, typing mode, and reusing old reports.
//  - Fill any form entirely by keyboard. Typed words go in exactly as typed; "Tidy wording" is an
//    optional button (same faithfulness check as voice), never automatic.
//  - Open an old report (ours, or an uploaded PDF from another system), keep what still applies,
//    clear what doesn't, then carry on by voice or keyboard. Switch any time.
//  - Every change can be undone, and every field remembers where its content came from.


export type FieldSource = "voice" | "typed" | "copied" | "suggested" | "prefilled" | "tidied";
export type Mode = "voice" | "text";

export interface DraftDoc {
  id: string;
  formId: string;
  name: string; // e.g. "Re-roof, 12 Main St Bowen"
  values: Values;
  sources: Record<string, FieldSource>;
  history: { fieldId: string; previous: unknown; previousSource?: FieldSource }[];
  mode: Mode;
  basedOn?: string; // id of the report it was copied from
  createdAt: string;
}

export function newDraft(form: FormTemplate, name: string, mode: Mode = "voice"): DraftDoc {
  return { id: newId(), formId: form.id, name, values: {}, sources: {}, history: [], mode, createdAt: new Date().toISOString() };
}

export function setValue(d: DraftDoc, fieldId: string, value: unknown, source: FieldSource): DraftDoc {
  return {
    ...d,
    values: { ...d.values, [fieldId]: value },
    sources: { ...d.sources, [fieldId]: source },
    history: [...d.history, { fieldId, previous: d.values[fieldId], previousSource: d.sources[fieldId] }],
  };
}

export function undo(d: DraftDoc): { draft: DraftDoc; fieldId: string | null; previous: unknown } {
  const last = d.history[d.history.length - 1];
  if (!last) return { draft: d, fieldId: null, previous: undefined };
  const values = { ...d.values };
  const sources = { ...d.sources };
  if (last.previous === undefined) { delete values[last.fieldId]; delete sources[last.fieldId]; }
  else { values[last.fieldId] = last.previous; if (last.previousSource) sources[last.fieldId] = last.previousSource; }
  return { draft: { ...d, values, sources, history: d.history.slice(0, -1) }, fieldId: last.fieldId, previous: last.previous };
}

export function clearFields(d: DraftDoc, fieldIds: string[]): DraftDoc {
  let out = d;
  for (const id of fieldIds) out = setValue(out, id, "", "typed");
  return out;
}

export function continueWith(d: DraftDoc, mode: Mode): DraftDoc {
  return { ...d, mode };
}

// Copy an old report into a fresh draft.
// Never copied: signatures (everyone signs the new one), the date (set to today), and the
// high-risk work and hazards, which are rebuilt from the current reviewed content.
export function copyFromOld(old: DraftDoc, form: FormTemplate, opts: { name: string; today: string; keep?: string[] }) {
  const never = new Set(form.fields.filter((f) => f.kind === "signature" || f.kind === "hazards" || f.kind === "hrcw" || f.key === "datePrepared").map((f) => f.id));
  let d = { ...newDraft(form, opts.name, old.mode), basedOn: old.id };
  const carried: string[] = [];
  for (const f of form.fields) {
    const v = old.values[f.id];
    if (never.has(f.id) || v === undefined || v === "") continue;
    if (opts.keep && !opts.keep.includes(f.id)) continue;
    d = { ...d, values: { ...d.values, [f.id]: v }, sources: { ...d.sources, [f.id]: "copied" as FieldSource } };
    carried.push(f.id);
  }
  const date = form.fields.find((f) => f.key === "datePrepared");
  if (date) d = { ...d, values: { ...d.values, [date.id]: opts.today }, sources: { ...d.sources, [date.id]: "prefilled" as FieldSource } };
  return { draft: d, carried, rebuilt: [...never].filter((id) => form.fields.find((f) => f.id === id)?.kind !== "signature") };
}

// Fields still to do, in form order — what the voice works through after "continue by voice".
export function remainingFields(form: FormTemplate, d: DraftDoc, ctx: CheckContext = {}) {
  return form.fields.filter((f) => {
    const issue = checkField(f, d.values[f.id], ctx);
    return issue && (issue.problem === "missing" || issue.problem === "unsigned" || issue.problem === "not-covered");
  });
}

// An old report from another system (uploaded PDF): field names and their filled-in text.
export function importPreviousReport(form: FormTemplate, found: { name: string; value: string }[], name: string) {
  let d = newDraft(form, name, "text");
  const unmatched: { name: string; value: string }[] = [];
  for (const item of found) {
    const key = guessKey(item.name);
    const field = form.fields.find((f) => f.key === key && f.kind !== "signature" && f.kind !== "hazards" && f.kind !== "hrcw");
    if (!field || !item.value.trim()) { if (item.value.trim()) unmatched.push(item); continue; }
    d = { ...d, values: { ...d.values, [field.id]: item.value.trim() }, sources: { ...d.sources, [field.id]: "copied" as FieldSource } };
  }
  return { draft: d, unmatched };
}

// ===================== suggest =====================
// The ℹ️ button: a suggestion for the field, based on the rest of the form and past jobs.
// It's an offer, shown with where it came from. It never fills the field by itself:
// the person taps "Use this" (or says "use that"), edits it, or ignores it.
// Safety content is never guessed: control suggestions come only from reviewed modules.


export interface SuggestContext {
  today: string;
  profile?: Partial<Record<StandardKey, string>>;
  pastJobs?: DraftDoc[]; // newest first, same form
  brief?: JobBrief;
  library?: Module[];
  notCoveredItem?: string; // the hazard/condition needing a control
}

export interface Suggestion { text: string; basis: string }

const REVIEW_STANDARD = "Review if the scope of work, crew, equipment or site conditions change, or if a control isn't working";

export function suggestFor(form: FormTemplate, values: Values, fieldId: string, ctx: SuggestContext): Suggestion | null {
  const field = form.fields.find((f) => f.id === fieldId);
  if (!field || !field.key) return null;
  const key = field.key;
  const past = (ctx.pastJobs ?? []).map((j) => j.values);
  const fromPast = (k: string) => past.map((v) => v[k]).find((x) => typeof x === "string" && x.trim()) as string | undefined;

  switch (key) {
    case "businessName": case "abn": case "businessAddress": {
      const v = ctx.profile?.[key];
      return v ? { text: v, basis: "From your saved details" } : null;
    }
    case "siteAddress": {
      const v = fromPast(fieldId);
      return v ? { text: v, basis: "From your last job" } : null;
    }
    case "principalContractor": case "responsiblePerson": {
      const site = values[form.fields.find((f) => f.key === "siteAddress")?.id ?? ""];
      const sameSite = past.find((v) => site && v[form.fields.find((f) => f.key === "siteAddress")!.id] === site);
      const v = (sameSite?.[fieldId] as string | undefined) || fromPast(fieldId);
      return v ? { text: v, basis: sameSite ? "Same as last time at this site" : "Same as your last job" } : null;
    }
    case "workDescription": {
      const b = ctx.brief;
      if (b?.task) {
        const parts = [
          b.task,
          b.location ? ` at ${b.location}` : "",
          b.maxHeightMetres !== null ? `, working up to ${b.maxHeightMetres} m` : "",
          b.equipment.length ? `, using ${b.equipment.join(", ")}` : "",
          b.crewSize !== null ? `. Crew of ${b.crewSize}` : "",
        ];
        return { text: parts.join(""), basis: "Pulled together from what you've said" };
      }
      return { text: "The task, where it is, the gear you're using and how many of you", basis: "A layout that works well" };
    }
    case "reviewTrigger":
      return { text: REVIEW_STANDARD, basis: "What most SWMS use" };
    case "datePrepared":
      return { text: ctx.today, basis: "Today's date" };
    case "hazards": {
      if (!ctx.notCoveredItem || !ctx.library) return null;
      const item = ctx.notCoveredItem.toLowerCase();
      for (const m of ctx.library.filter(isPublishable)) {
        const hit = m.triggers.some((t) => item.includes(t.toLowerCase())) ||
          m.hazards.some((h) => h.description.toLowerCase().includes(item));
        if (hit) {
          const h = m.hazards.find((x) => x.description.toLowerCase().includes(item)) ?? m.hazards[0];
          if (h?.controls[0]) return { text: h.controls[0].text, basis: "From our reviewed content" };
        }
      }
      return null; // never guess a safety control
    }
    default:
      return null;
  }
}

// ===================== terms =====================
// First-run terms: smooth, barely noticeable, but properly agreed.
// The only first-run screen is "Let's get your signature on file". Under the signature pad sit three
// short lines and a Terms link, right next to the button. Saving the signature = agreeing to the terms.
// No "waiver" or "disclaimer" wording, no scroll box, no tick-box, no extra screen.
// Asked once, ever. Only asked again (once) if the terms materially change.
// Crew signing by link get a single line beside their first signature instead.


export const TERMS = {
  version: 1,
  url: "/terms/", // plain-English terms page, written by a lawyer
  founderSummaryEmail: "venture-lab-8grv@agentmail.to", // weekly summary, no signature images
};

export const FIRST_RUN_COPY = {
  heading: "Let's get your signature on file",
  lines: [
    "Safe Word helps you build your SWMS. You check it fits the site.",
    "Your details stay in Australia and your signature is only ever used by you.",
  ],
  agreeLine: "By saving your signature, you agree to our Terms.", // "Terms" links to TERMS.url
  button: "Save signature",
  next: "What's the job?", // the first thing they hear afterwards
};

export const CREW_FIRST_SIGN_LINE = "By signing, you agree to our Terms.";

// Changed terms: one quiet line on next open, same signature, one tap.
export const TERMS_UPDATED_COPY = {
  line: "We've updated our Terms. Tap to agree and carry on.",
  button: "Agree",
};

export interface Acceptance {
  userId: string;
  name: string;
  termsVersion: number;
  acceptedAt: string;
  signatureId: string;
  device: string; // e.g. "iPhone, Safari"
  via: "first-run" | "crew-link" | "terms-update";
}

export class TermsLedger {
  private records: Acceptance[] = [];
  constructor(existing: Acceptance[] = []) { this.records = [...existing]; }

  hasCurrent(userId: string): boolean {
    return this.records.some((r) => r.userId === userId && r.termsVersion === TERMS.version);
  }

  // Everything else in the app stays locked until this is true.
  appUnlocked(userId: string): boolean { return this.hasCurrent(userId); }

  latest(userId: string): Acceptance | undefined {
    return this.records.filter((r) => r.userId === userId).sort((a, b) => b.termsVersion - a.termsVersion)[0];
  }

  record(a: Acceptance): Acceptance {
    if (!this.hasCurrent(a.userId)) this.records.push(a);
    return this.latest(a.userId)!;
  }

  since(iso: string): Acceptance[] { return this.records.filter((r) => r.acceptedAt >= iso); }
  all(): Acceptance[] { return [...this.records]; }
}

// First run: the signature they draw is saved for everyday use AND records their agreement.
export function firstRunSave(
  vault: SignatureVault, ledger: TermsLedger,
  opts: { userId: string; name: string; svgPath: string; device: string; at: string; via?: Acceptance["via"] }
): { signature: SavedSignature; acceptance: Acceptance } {
  const existing = vault.current(opts.userId);
  const signature = existing ?? vault.save(opts.userId, opts.name, opts.svgPath);
  const acceptance = ledger.record({
    userId: opts.userId, name: opts.name, termsVersion: TERMS.version, acceptedAt: opts.at,
    signatureId: signature.id, device: opts.device, via: opts.via ?? "first-run",
  });
  return { signature, acceptance };
}

// What the app shows on open: nothing, the first-run screen, or the one-line update.
export function termsPrompt(ledger: TermsLedger, userId: string): "none" | "first-run" | "updated" {
  if (ledger.hasCurrent(userId)) return "none";
  return ledger.latest(userId) ? "updated" : "first-run";
}

// The user's own copy, emailed once.
export function userCopyEmail(a: Acceptance, baseUrl: string) {
  return {
    subject: "Welcome to Safe Word",
    text: `G'day ${a.name.split(" ")[0]},\n\nYou're all set up. For your records, you agreed to our Terms (version ${a.termsVersion}) on ${a.acceptedAt.slice(0, 10)}. You can read them any time at ${baseUrl}${TERMS.url}\n\nSafe Word`,
  };
}

// Weekly summary for the founder. Names, dates and versions only — never signature images.
export function founderSummary(records: Acceptance[], weekOf: string) {
  const lines = records.map((r) => `${r.acceptedAt.slice(0, 10)}  ${r.name}  v${r.termsVersion}  ${r.via}`);
  return {
    to: TERMS.founderSummaryEmail,
    subject: `Safe Word: ${records.length} new sign-up${records.length === 1 ? "" : "s"} (week of ${weekOf})`,
    text: records.length ? lines.join("\n") : "No new sign-ups this week.",
  };
}

// ===================== membership =====================
// Company paperwork access: who can use a company's forms, the confidentiality notice they accept,
// and removing access when someone leaves.
//
//  - Company paperwork is only available to people the company currently authorises
//    (employees and contractors). Safe Word's own template stays free for everyone.
//  - First time someone opens a company's paperwork, they accept the company's notice.
//    If the company changes the notice, it's accepted again.
//  - The owner can remove anyone's access at any time. It takes effect immediately:
//    company forms, drafts and the company's sent folder disappear for that person.
//  - Their drafts in progress move to the owner (or a supervisor) so no work is lost.
//  - Signed SWMS stay with the company as safety records. A person's signature on a past SWMS
//    is never removed — it's part of the record.
//  - Workers can't download blank company forms; only finished, signed documents leave the app.
//  - Offline copies of company forms expire if the phone hasn't checked in for 7 days, so access
//    removal reaches phones that were offline.
//  - Every grant, acceptance and removal is logged.


export type Role = "owner" | "supervisor" | "worker";

export interface Membership {
  userId: string;
  companyId: string;
  role: Role;
  status: "active" | "removed";
  noticeVersionAccepted?: number;
  removedAt?: string;
  removedBy?: string;
  privateNote?: string; // optional, owner-only; never shown to the person, never required
}

export interface CompanyNotice { companyName: string; version: number; text: string }

export function defaultNotice(companyName: string, version = 1): CompanyNotice {
  return {
    companyName,
    version,
    text:
      `These forms and documents are confidential and belong to ${companyName}. ` +
      `They're provided only for use on ${companyName} work while ${companyName} authorises you to use them. ` +
      `They're not to be copied, shared or used for any other business. ` +
      `${companyName} can remove access at any time, and completed SWMS stay with ${companyName} as safety records.`,
  };
}

export interface AuditEntry { at: string; companyId: string; userId: string; by: string; event: "granted" | "accepted-notice" | "removed" | "restored" | "drafts-transferred" }

export class CompanyAccess {
  private members: Membership[] = [];
  readonly log: AuditEntry[] = [];

  constructor(private notice: CompanyNotice, private companyId: string) {}

  grant(userId: string, role: Role, by: string, at: string): Membership {
    const existing = this.members.find((m) => m.userId === userId);
    if (existing) {
      Object.assign(existing, { role, status: "active", removedAt: undefined, removedBy: undefined });
      this.log.push({ at, companyId: this.companyId, userId, by, event: "restored" });
      return existing;
    }
    const m: Membership = { userId, companyId: this.companyId, role, status: "active" };
    this.members.push(m);
    this.log.push({ at, companyId: this.companyId, userId, by, event: "granted" });
    return m;
  }

  acceptNotice(userId: string, at: string): void {
    const m = this.get(userId);
    if (!m || m.status !== "active") throw new Error("No access to this company's paperwork.");
    m.noticeVersionAccepted = this.notice.version;
    this.log.push({ at, companyId: this.companyId, userId, by: userId, event: "accepted-notice" });
  }

  updateNotice(n: CompanyNotice): void {
    if (n.version <= this.notice.version) throw new Error("A changed notice needs a new version number.");
    this.notice = n;
  }

  currentNotice(): CompanyNotice { return this.notice; }

  get(userId: string): Membership | undefined { return this.members.find((m) => m.userId === userId); }

  // Can this person open this company form right now?
  canUseForm(userId: string, form: FormTemplate): { ok: boolean; reason?: "removed" | "not-member" | "accept-notice" } {
    if (form.kind === "generic") return { ok: true };
    if (form.companyId !== this.companyId) return { ok: false, reason: "not-member" };
    const m = this.get(userId);
    if (!m) return { ok: false, reason: "not-member" };
    if (m.status === "removed") return { ok: false, reason: "removed" };
    if (m.noticeVersionAccepted !== this.notice.version) return { ok: false, reason: "accept-notice" };
    return { ok: true };
  }

  canDownloadBlank(userId: string): boolean {
    const m = this.get(userId);
    return !!m && m.status === "active" && m.role === "owner";
  }

  // Remove access. Owner-only. Drafts move to `transferTo` so nothing in progress is lost.
  remove(userId: string, by: string, at: string, drafts: DraftDoc[], transferTo: string, privateNote?: string) {
    const actor = this.get(by);
    if (!actor || actor.role !== "owner" || actor.status !== "active") throw new Error("Only the owner can remove access.");
    if (userId === by) throw new Error("An owner can't remove their own access.");
    const m = this.get(userId);
    if (!m) throw new Error("That person isn't on this company's account.");
    Object.assign(m, { status: "removed", removedAt: at, removedBy: by, privateNote });
    this.log.push({ at, companyId: this.companyId, userId, by, event: "removed" });
    const moved = drafts.filter((d) => (d as DraftDoc & { ownerId?: string }).ownerId === userId);
    if (moved.length) this.log.push({ at, companyId: this.companyId, userId: transferTo, by, event: "drafts-transferred" });
    return {
      membership: m,
      transferred: moved.map((d) => ({ ...d, ownerId: transferTo })),
      messageForPerson: `Your access to ${this.notice.companyName}'s paperwork has ended. Your own saved signature and the Safe Word template are still yours to use.`,
      messageForOwner: `Done. They no longer have access to ${this.notice.companyName}'s paperwork.${moved.length ? ` ${moved.length} draft${moved.length === 1 ? "" : "s"} moved to you.` : ""}`,
    };
  }
}

export const OFFLINE_CHECK_IN_DAYS = 7;

// Offline copies of company forms stop working if the phone hasn't checked in recently.
export function offlineCopyValid(lastCheckInIso: string, nowIso: string): boolean {
  return Date.parse(nowIso) - Date.parse(lastCheckInIso) <= OFFLINE_CHECK_IN_DAYS * 86400000;
}

// Footer on every PDF made from company paperwork.
export function companyFooter(companyName: string): string {
  return `Prepared on ${companyName} paperwork. Confidential to ${companyName}.`;
}

// ---------- Worker uploads: advisory, never a block ----------
// Anyone can upload any document into their own account. If it looks like another business's
// paperwork, they get a one-line heads-up and choose. Their answer stays in their own account;
// nobody is told. Shown once per document.

const ABN_RE = /\b(?:abn[:\s]*)?(\d{2}\s?\d{3}\s?\d{3}\s?\d{3})\b/i;

export function otherCompanyIn(docText: string, own: { businessName?: string; abn?: string }): string | null {
  const m = docText.match(ABN_RE);
  const docAbn = m ? m[1].replace(/\s/g, "") : null;
  const ownAbn = own.abn?.replace(/\s/g, "");
  if (docAbn && ownAbn && docAbn === ownAbn) return null;
  const named = docText.match(/(?:company|business|pcbu|contractor)(?: name)?[:\s]+([A-Z][\w&'. -]{2,60}?(?:Pty Ltd|Ltd|Group|Services|Constructions?|Builders?|Roofing|Electrical|Plumbing)?)\s*(?:\n|ABN|$)/i);
  const name = named?.[1]?.trim();
  if (name && own.businessName && name.toLowerCase().includes(own.businessName.toLowerCase())) return null;
  if (docAbn && docAbn !== ownAbn) return name || "another company";
  return null;
}

export function uploadAdvisory(companyName: string): { text: string; options: ["Continue", "Cancel"] } {
  const who = companyName === "another company" ? "another company's" : companyName.endsWith("s") ? `${companyName}'` : `${companyName}'s`;
  return { text: `Heads up: this looks like ${who} paperwork. Using it may need their OK. Continue?`, options: ["Continue", "Cancel"] };
}

// ===================== swmscheck =====================
// The free SWMS Check (lead magnet): someone uploads their existing SWMS and describes a job.
// We report, in a friendly way, what looks covered and what we couldn't find.
// It's a quick automated read, not a compliance assessment, and it says so.


export interface CheckItem { label: string; status: "covered" | "missing" | "worth-a-look"; note: string }
export interface CheckReport { items: CheckItem[]; covered: number; total: number; summary: string; disclaimer: string }

// What a SWMS should include (WHS Regulations; WorkSafe Queensland and Safe Work Australia guidance).
const ELEMENTS: { label: string; any: RegExp; note: string }[] = [
  { label: "Business name and ABN", any: /\babn\b|a\.b\.n|australian business number/i, note: "The business doing the work and its ABN." },
  { label: "Business address", any: /\baddress\b/i, note: "The business's address." },
  { label: "Principal contractor", any: /principal contractor|head contractor|\bbuilder\b/i, note: "Who's running the site, for construction projects." },
  { label: "Site address", any: /site address|work location|job address|location of work|project address/i, note: "Where the work is happening." },
  { label: "High-risk construction work identified", any: /high[ -]risk|hrcw/i, note: "Which of the high-risk activities apply." },
  { label: "Hazards and risks", any: /hazard/i, note: "What could hurt someone, and how." },
  { label: "Control measures", any: /control/i, note: "What's being done about each hazard." },
  { label: "How controls are put in place and checked", any: /monitor|implement|inspect|check(ed)? (daily|before|at)/i, note: "Who checks the controls, and when." },
  { label: "Review", any: /review/i, note: "When the SWMS gets reviewed, e.g. if the work or conditions change." },
  { label: "Person responsible", any: /responsible|supervisor|leading hand/i, note: "Who makes sure it's followed on site." },
  { label: "Dates", any: /\bdate\b/i, note: "When it was prepared (and given to the builder)." },
  { label: "Worker sign-off", any: /sign(ed|ature)?|acknowledg/i, note: "The crew confirming they've read it." },
];

const GENERIC_SIGNS = /\[insert|insert (name|address|here)|<name>|xx\/xx|lorem|example only|template/i;

export function checkExistingSwms(documentText: string, job: JobBrief | null, library: Module[]): CheckReport {
  const items: CheckItem[] = ELEMENTS.map((e) => ({
    label: e.label,
    status: e.any.test(documentText) ? "covered" : "missing",
    note: e.note,
  }));

  if (GENERIC_SIGNS.test(documentText))
    items.push({ label: "Template text left in", status: "worth-a-look", note: "Looks like some template placeholders are still in there. Builders often knock these back." });

  if (job) {
    const sel = select(job, library);
    const doc = documentText.toLowerCase();
    for (const a of sel.hrcw) {
      const cat = HRCW_CATEGORIES.find((c) => c.id === a.id)!;
      const mentioned = cat.triggers.some((t) => doc.includes(t.toLowerCase()));
      items.push(mentioned
        ? { label: a.title, status: "covered", note: "Your job involves this, and the SWMS mentions it." }
        : { label: a.title, status: "missing", note: "Your job sounds like it involves this, but we couldn't find it in the SWMS." });
    }
    if (job.location && !doc.includes(job.location.toLowerCase()))
      items.push({ label: "Site-specific", status: "worth-a-look", note: `We couldn't see ${job.location} mentioned. A SWMS that doesn't name the site often gets knocked back.` });
  }

  const covered = items.filter((i) => i.status === "covered").length;
  const gaps = items.length - covered;
  return {
    items, covered, total: items.length,
    summary: gaps === 0
      ? "Had a read through. Everything we look for is in there."
      : `Had a read through. ${covered} of ${items.length} look covered. ${gaps === 1 ? "One thing" : `${gaps} things`} worth a look.`,
    disclaimer: "This is a quick automated read of the document, not a compliance assessment. The business doing the work is responsible for its SWMS.",
  };
}

// ===================== content =====================
// Founder's content console logic: what has to be true before a module can be marked reviewed.
// Drafts come from Safe Work Australia and state regulator codes of practice; the founder edits,
// then this check must pass before "Mark reviewed" is allowed.


export function reviewBlockers(m: Module): string[] {
  const out: string[] = [];
  if (m.sources.length === 0) out.push("Add the code of practice or guidance this was drafted from.");
  if (m.hazards.length === 0) out.push("Add at least one hazard.");
  for (const h of m.hazards) {
    if (!h.risk.trim()) out.push(`"${h.description}" needs a risk description.`);
    if (h.controls.length === 0) out.push(`"${h.description}" has no controls.`);
    else if (h.controls.every((c) => c.level === "ppe" || c.level === "administrative"))
      out.push(`"${h.description}" only has admin or PPE controls. Is a higher-order control reasonably practicable?`);
  }
  if (m.triggers.length === 0) out.push("Add trigger words so the module gets picked up from a brief.");
  if (m.seoSummary !== undefined && m.seoSummary.split(/\s+/).filter(Boolean).length < 120)
    out.push("The public page summary needs at least 120 words, or leave it blank to keep the page unpublished.");
  return out;
}

export function markReviewed(m: Module, reviewer: string, date: string): Module {
  const blockers = reviewBlockers(m);
  if (blockers.length) throw new Error(blockers.join(" "));
  return { ...m, status: "reviewed", reviewedBy: reviewer, reviewedAt: date };
}

// Any edit to reviewed content makes a new draft version that needs reviewing again.
export function editModule(m: Module, change: Partial<Pick<Module, "hazards" | "triggers" | "sources" | "seoSummary" | "title">>): Module {
  return { ...m, ...change, version: m.version + 1, status: "draft", reviewedBy: undefined, reviewedAt: undefined, specialistReviewedBy: undefined };
}

// Which states the current content suits. Victoria uses its own list of 19 high-risk activities
// under the OHS Regulations 2017, so Victorian businesses get a clear notice until a Victorian
// list is added and reviewed.
export function jurisdictionNotice(state: string): string | null {
  return state.toUpperCase() === "VIC"
    ? "Heads up: Victoria uses its own list of high-risk construction work. Safe Word's content is built on the national model list, so check your SWMS against the Victorian requirements."
    : null;
}

// ===================== voice =====================
// Voice output: natural Australian female and male voices.
// Primary: Microsoft Azure neural voices en-AU-NatashaNeural (female) and en-AU-WilliamNeural (male).
// Azure's free tier covers 0.5 million characters of neural speech a month — enough for thousands of
// SWMS — so voice costs nothing during pilots. Use ONE provider for every line so the voice never changes
// mid-conversation.
// Optional later upgrade: ElevenLabs (most human-sounding). Only switch once paying customers justify it,
// and switch every line at once.
// Last resort offline: the phone's built-in voice.
// Speech-to-text: Azure's free tier includes 5 hours a month of real-time recognition (set language en-AU
// and add TRADE_VOCABULARY as phrase hints). Deepgram's free credit is a top-up if needed.
//
// Speed and cost: every fixed prompt (field prompts, help, commands) is generated ONCE at build time
// and served as audio files, so it plays instantly and costs nothing per use. Only dynamic lines
// (read-backs, names, addresses) are generated live.
//
// API keys stay on the server. The app calls our own /api/speak endpoint, never the provider directly.


export type VoiceGender = "female" | "male";

export const VOICE_CONFIG = {
  provider: "azure" as "elevenlabs" | "azure",
  elevenlabs: {
    model: "eleven_flash_v2_5",
    voices: { female: "AU_FEMALE_VOICE_ID_IF_UPGRADING", male: "AU_MALE_VOICE_ID_IF_UPGRADING" }, // only needed if switching to ElevenLabs
    settings: { stability: 0.5, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true },
  },
  azure: {
    voices: { female: "en-AU-NatashaNeural", male: "en-AU-WilliamNeural" },
    rate: "+0%",
  },
  // Site-friendly delivery: unhurried, clear, a touch warmer than a call-centre voice.
  style: "Relaxed, friendly Australian. Clear and unhurried. Like an experienced leading hand, not a robot.",
};

// Server-side request builders (run inside /api/speak).
export function elevenLabsRequest(text: string, gender: VoiceGender, apiKey: string) {
  const c = VOICE_CONFIG.elevenlabs;
  return {
    url: `https://api.elevenlabs.io/v1/text-to-speech/${c.voices[gender]}/stream?output_format=mp3_44100_128`,
    init: {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: c.model, voice_settings: c.settings }),
    },
  };
}

const xml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function azureSsml(text: string, gender: VoiceGender): string {
  const v = VOICE_CONFIG.azure;
  return `<speak version="1.0" xml:lang="en-AU"><voice name="${v.voices[gender]}"><prosody rate="${v.rate}">${xml(text)}</prosody></voice></speak>`;
}

// Fixed lines to pre-generate as audio for both voices.
// Kept deliberately small. Confirmations ("got it", "signature's on") are a soft tone and a
// haptic tap, not words.
export const SYSTEM_LINES = [
  "Didn't catch that.",
  "Typing it is.",
  "Sent.",
  "Saved.",
  "Printing.",
  "Had a read through. Looks good to me. Ready to send.",
];

export function promptLibrary(forms: FormTemplate[] = [GENERIC_SWMS]): string[] {
  const lines = new Set(SYSTEM_LINES);
  for (const f of forms) for (const fld of f.fields) {
    lines.add(fld.voicePrompt);
    lines.add(fld.helpPrompt);
  }
  return [...lines];
}

// Stable file name for a pre-generated line, e.g. /voice/female/3f2a9c1b.mp3
export function audioKey(text: string, gender: VoiceGender): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return `/voice/${gender}/${(h >>> 0).toString(16)}.mp3`;
}

// How the voice behaves (helpful, never annoying):
// - Ask, don't explain. One short question; help is spoken only when asked ("help", "what?") or after a second miss.
// - Never narrate what the app is doing. Confirmations are a soft tone plus haptic.
// - Never ask for what we already know: saved business details and today's date fill silently.
// - Second ask is shorter, not a repeat. After 5 completed SWMS, prompts shrink to the bare question.
// - One read-back at the end, not after every answer.
// - Barge-in: the moment the user speaks, the voice stops and listens.
// - Every spoken line also shows on screen (noisy sites, hearing protection).
// - Female or male voice chosen once in settings; voice can be muted for text-and-tap only.

// ===================== logo =====================
// Company logo: three ways in, all optional.
//  1. Photo: snap the logo off the ute door, a business card or letterhead. We crop and clean it.
//  2. Upload: pick an image file.
//  3. Find it: type the company website and we fetch the logo (via Logo.dev).
// The user confirms it's their own business's logo before it's used on documents.

export const LOGO_DEV = {
  publishableKey: "PASTE_LOGO_DEV_PK_KEY", // pk_ keys are safe in the browser
  // Free plans may require a visible "Logos provided by Logo.dev" link — check their attribution terms.
};

export function domainFrom(input: string): string | null {
  const s = input.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0];
  return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(s) ? s : null;
}

export function logoLookupUrl(website: string, size = 256): string | null {
  const d = domainFrom(website);
  return d ? `https://img.logo.dev/${d}?token=${LOGO_DEV.publishableKey}&size=${size}&format=png` : null;
}

// Browser: crop to the logo and make a plain white or near-white background transparent.
// Works well on photos of signage and printed logos; the user can still adjust the crop.
export function cleanLogo(img: HTMLImageElement | HTMLCanvasElement, threshold = 235): HTMLCanvasElement {
  const w = img.width, h = img.height;
  const src = document.createElement("canvas");
  src.width = w; src.height = h;
  const ctx = src.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4;
    const light = px[i] > threshold && px[i + 1] > threshold && px[i + 2] > threshold;
    if (light) px[i + 3] = 0;
    else if (px[i + 3] > 0) {
      if (x < minX) minX = x; if (y < minY) minY = y;
      if (x > maxX) maxX = x; if (y > maxY) maxY = y;
    }
  }
  ctx.putImageData(data, 0, 0);
  if (maxX < 0) return src; // nothing found; leave as-is for manual crop
  const pad = Math.round(Math.max(w, h) * 0.02);
  const cx = Math.max(0, minX - pad), cy = Math.max(0, minY - pad);
  const cw = Math.min(w, maxX + pad) - cx, ch = Math.min(h, maxY + pad) - cy;
  const out = document.createElement("canvas");
  out.width = cw; out.height = ch;
  out.getContext("2d")!.drawImage(src, cx, cy, cw, ch, 0, 0, cw, ch);
  return out;
}

// ===================== output =====================
// Getting the finished document out: email, print (AirPrint or any printer), save to phone,
// and a record of everything sent in the dashboard.


export type Channel = "email" | "print" | "device" | "share";

export interface SentRecord {
  id: string;
  documentId: string;
  documentName: string;
  contentHash: string; // proves which version went out
  channel: Channel;
  to?: string[];
  at: string;
}

export class SentLog {
  private items: SentRecord[] = [];
  record(r: Omit<SentRecord, "id" | "at">): SentRecord {
    const rec = { ...r, id: newId(), at: new Date().toISOString() };
    this.items.unshift(rec);
    return rec;
  }
  list(documentId?: string) {
    return documentId ? this.items.filter((i) => i.documentId === documentId) : [...this.items];
  }
}

export function validEmails(list: string[]): { ok: string[]; bad: string[] } {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const ok: string[] = [], bad: string[] = [];
  for (const e of list.map((x) => x.trim()).filter(Boolean)) (re.test(e) ? ok : bad).push(e);
  return { ok, bad };
}

// Email is sent from our server (e.g. Resend) with the PDF attached, so it arrives looking
// professional and doesn't depend on the phone's mail app. This builds the payload.
// Every PDF footer and email carries this. It's the cheapest marketing we have: every SWMS a subbie
// sends lands on a builder's desk with a link to us.
export function referralFooter(baseUrl: string): string {
  return `Made with Safe Word · ${baseUrl.replace(/^https?:\/\//, "")}/start`;
}

export function emailPayload(opts: { to: string[]; fromName: string; documentName: string; siteAddress: string; pdfBase64: string; baseUrl: string }) {
  return {
    to: opts.to,
    subject: `SWMS: ${opts.documentName} – ${opts.siteAddress}`,
    text: `Hi,\n\nAttached is the signed SWMS for ${opts.siteAddress}.\n\n${opts.fromName}\n\n${referralFooter(opts.baseUrl)}`,
    attachments: [{ filename: `${opts.documentName}.pdf`, content: opts.pdfBase64 }],
  };
}

// Browser: save to phone. On iPhone this opens the share sheet (Save to Files, AirDrop, Messages…).
export async function saveToDevice(pdf: Blob, filename: string): Promise<"shared" | "downloaded"> {
  const file = new File([pdf], filename, { type: "application/pdf" });
  const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
  if (nav.canShare && nav.canShare({ files: [file] })) {
    await navigator.share({ files: [file], title: filename });
    return "shared";
  }
  const url = URL.createObjectURL(pdf);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return "downloaded";
}

// Browser: print. Opens the system print dialog — AirPrint on iPhone/iPad, any installed printer elsewhere.
export function printPdf(pdf: Blob): void {
  const url = URL.createObjectURL(pdf);
  const frame = document.createElement("iframe");
  frame.style.position = "fixed"; frame.style.width = "0"; frame.style.height = "0"; frame.style.border = "0";
  frame.src = url;
  frame.onload = () => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(() => { frame.remove(); URL.revokeObjectURL(url); }, 60000);
  };
  document.body.appendChild(frame);
}

// When the SWMS is emailed to the principal contractor, record the date it was provided.
export function markProvided(values: Record<string, unknown>, providedFieldId: string, today: string): Record<string, unknown> {
  return values[providedFieldId] ? values : { ...values, [providedFieldId]: today };
}

// Record keeping. A SWMS must be kept until the high-risk work is finished, and for at least
// 2 years after a notifiable incident. Signed versions are never deleted by users, only archived.
export const RETENTION = {
  signedVersionsDeletable: false,
  defaultYears: 7, // comfortably beyond the legal minimums; set with legal advice
  notifiableIncidentMinYears: 2,
};

// ===================== seo =====================
// SEO site generator for Safe Word.
//
// Strategy: win the searches tradies and builders actually make ("working at heights SWMS",
// "SWMS for roofers", "what is a SWMS") with fast, genuinely useful pages that Google trusts.
//  - Hub page:      /swms/                    what a SWMS is, the 18 activities, every trade
//  - Activity pages: /swms/<activity>/         one per high-risk activity with a reviewed module
//  - Trade pages:    /swms-for/<trade>/        one per trade, once its intro is reviewed
//  - sitemap.xml, robots.txt, llms.txt (for AI search engines)
// Quality gates (what keeps rankings long-term):
//  - No page without founder-reviewed, unique content. Thin or duplicate pages hurt the whole site.
//  - Every page shows who reviewed it and when (WebPage.reviewedBy / lastReviewed) — expertise signals.
//  - Zero JavaScript, inline CSS, system fonts: near-instant loads and top Core Web Vitals on phones.
//  - lintPages() fails the build on any SEO fault: title/description length, duplicate titles,
//    missing canonical, broken internal links, placeholders, thin content, invalid structured data.
// Note: Google stopped showing FAQ rich results in May 2026. FAQ markup is still included because
// Google uses it to understand pages and other search engines may still display it.


export interface SiteConfig {
  brand: string;
  baseUrl: string; // e.g. https://www.safeword.com.au — no trailing slash
  checkPath: string; // free SWMS Check
  signupPath: string;
  ogImage: string; // 1200x630 share image path
  reviewer: { name: string; credential: string };
  // Trade photos that exist (slug -> true). Pages without one simply show no photo.
  tradePhotos?: Record<string, boolean>;
}

export const SITE_DEFAULTS: SiteConfig = {
  brand: "Safe Word",
  baseUrl: "https://PASTE_DOMAIN",
  checkPath: "/swms-check/",
  signupPath: "/start/",
  ogImage: "/og/safe-word-share.png",
  reviewer: { name: "PASTE_REVIEWER_NAME", credential: "Diploma of Work Health and Safety" },
};

export const ACTIVITY_SEO: Record<string, { slug: string; name: string; plain?: string }> = {
  "falls": { slug: "working-at-heights", name: "Working at Heights" , plain: "a risk of someone falling more than 2 metres (the height can differ by state)" },
  "telco-tower": { slug: "telecommunication-tower", name: "Telecommunication Tower" , plain: "work on a telecommunication tower" },
  "demolition": { slug: "demolition", name: "Demolition" , plain: "demolishing a load-bearing or structural element" },
  "asbestos": { slug: "asbestos", name: "Asbestos" , plain: "work likely to disturb asbestos" },
  "temp-support": { slug: "structural-alterations-propping", name: "Structural Alterations and Propping" , plain: "structural alterations that need temporary support" },
  "confined-space": { slug: "confined-space", name: "Confined Space" , plain: "work in or near a confined space" },
  "trench-tunnel": { slug: "trenching-excavation", name: "Trenching and Excavation" , plain: "a trench or shaft deeper than 1.5 metres, or a tunnel" },
  "explosives": { slug: "explosives", name: "Explosives" , plain: "the use of explosives" },
  "gas-mains": { slug: "gas-mains", name: "Gas Mains and Piping" , plain: "work on or near pressurised gas mains or piping" },
  "chem-fuel-refrig": { slug: "fuel-refrigerant-lines", name: "Chemical, Fuel and Refrigerant Lines" , plain: "work on or near chemical, fuel or refrigerant lines" },
  "energised-electrical": { slug: "electrical", name: "Electrical" , plain: "work on or near energised electrical installations" },
  "contaminated-atmosphere": { slug: "flammable-atmosphere", name: "Contaminated and Flammable Atmospheres" , plain: "an area that may have a contaminated or flammable atmosphere" },
  "tilt-up-precast": { slug: "tilt-up-precast", name: "Tilt-up and Precast" , plain: "tilt-up or precast concrete elements" },
  "traffic-corridor": { slug: "traffic-roadworks", name: "Traffic and Roadworks" , plain: "work on or next to a road, railway or other traffic corridor in use" },
  "mobile-plant": { slug: "mobile-plant", name: "Mobile Plant" , plain: "movement of powered mobile plant" },
  "temp-extremes": { slug: "extreme-temperatures", name: "Extreme Temperatures" , plain: "areas with artificial extremes of temperature" },
  "drowning": { slug: "work-near-water", name: "Work Near Water" , plain: "work in or near water with a risk of drowning" },
  "diving": { slug: "diving", name: "Diving" , plain: "diving work" },
};

// Trade pages. Intros are DRAFTS for the founder to check; set reviewed: true to publish.
export interface TradeContent { slug: string; name: string; plural: string; activities: string[]; intro: string; reviewed: boolean; photoAlt?: string }

export const TRADES: TradeContent[] = [
  { slug: "roofers", name: "Roofer", plural: "Roofers", activities: ["falls", "asbestos", "energised-electrical", "mobile-plant"], reviewed: false, photoAlt: "A roofer in a harness clipped to an anchor, fixing Colorbond sheets beside scaffold edge protection",
    intro: "Most roofing jobs involve high-risk construction work, usually the risk of a fall from height. Older roofs can also mean disturbing asbestos, and overhead power lines are a common hazard near the eaves. A roofing SWMS needs to reflect the actual roof: its pitch, edges, fragile areas such as skylights, and how materials get up and down. Principal contractors will usually ask for it before you start. Safe Word builds it from what you say on site, then flags anything the reviewed content doesn't cover so you can add your own control before the crew signs." },
  { slug: "electricians", name: "Electrician", plural: "Electricians", activities: ["energised-electrical", "falls", "confined-space", "asbestos"], reviewed: false, photoAlt: "A residential switchboard isolated with a lockout padlock and danger tag on the main switch",
    intro: "Electrical work near energised installations is high-risk construction work, and a lot of sparky jobs add work at height, ceiling spaces or older switchboards that may contain asbestos. An electrical SWMS needs to show how the work will be isolated and tested, who is doing it and what happens if isolation isn't possible. Safe Word turns your spoken job brief into a site-specific SWMS, using electrical content that has had a specialist review, and won't let anyone sign while a hazard is left uncovered." },
  { slug: "plumbers", name: "Plumber", plural: "Plumbers", activities: ["trench-tunnel", "confined-space", "gas-mains", "falls", "asbestos"], reviewed: false, photoAlt: "A plumber laying PVC pipe inside trench shields, spoil set well back and barricade mesh along both sides",
    intro: "Plumbing and drainage work often crosses into high-risk construction work: trenches deeper than 1.5 metres, pits and tanks, gas lines, roof work and old fibro. A plumbing SWMS has to match the job on the day, not a template from last year. Talk Safe Word through the job and it pulls in the right sections, asks for anything it needs, and gives you a signed, time-stamped SWMS to send to the builder." },
  { slug: "carpenters", name: "Carpenter", plural: "Carpenters", activities: ["falls", "temp-support", "demolition", "mobile-plant"], reviewed: false, photoAlt: "Carpenters standing up a timber wall frame on a slab, nail gun on the floor",
    intro: "Framing, fit-outs and renovations regularly involve work at height, structural alterations that need temporary support, and partial demolition. A carpentry SWMS needs to cover the stages of the job that are genuinely high risk and how each one will be controlled. Safe Word builds it from your description, puts it on your own paperwork or our template, and gets the whole crew signed off on their phones." },
  { slug: "concreters", name: "Concreter", plural: "Concreters", activities: ["mobile-plant", "trench-tunnel", "tilt-up-precast", "traffic-corridor"], reviewed: false, photoAlt: "Concreters screeding a fresh slab with a bull float as the pump hose pours",
    intro: "Concreting jobs commonly involve powered mobile plant such as pumps, trucks and bobcats, as well as excavations, precast elements and work next to roads. A concreting SWMS needs to deal with plant movement, exclusion zones and pour-day pressure. Safe Word gets the details from a quick spoken brief and builds a SWMS that fits the site, with every gap flagged before anyone signs." },
  { slug: "scaffolders", name: "Scaffolder", plural: "Scaffolders", activities: ["falls", "energised-electrical", "traffic-corridor", "mobile-plant"], reviewed: false, photoAlt: "A scaffolder in a harness on a scaffold deck with guardrails, shot from below",
    intro: "Erecting, altering and dismantling scaffold is work at height by definition, and it often happens near power lines, public footpaths and live traffic. A scaffolding SWMS needs to cover the sequence of work and the controls at each stage. Safe Word builds a site-specific version from your voice brief and keeps a signed copy with the job, ready for the principal contractor or an inspector." },
  { slug: "painters", name: "Painter", plural: "Painters", activities: ["falls", "contaminated-atmosphere", "asbestos"], reviewed: false, photoAlt: "A painter rolling weatherboards from a mobile scaffold with guardrails",
    intro: "Not every painting job needs a SWMS, but work at height, spraying in enclosed areas and preparing surfaces that may contain asbestos all count as high-risk construction work. Safe Word tells you when the job you've described doesn't involve high-risk work, and when it does, builds a SWMS that matches the site in minutes." },
  { slug: "demolition-contractors", name: "Demolition Contractor", plural: "Demolition Contractors", activities: ["demolition", "asbestos", "mobile-plant", "temp-support", "falls"], reviewed: false, photoAlt: "A worker hosing down brick demolition rubble to keep dust down while an excavator works behind temporary fencing",
    intro: "Demolition of load-bearing elements is high-risk construction work and rarely comes alone: asbestos, plant, propping and falls usually feature too. A demolition SWMS has to reflect the structure, the sequence and the exclusion zones. Safe Word turns your spoken plan into a structured SWMS from reviewed content and flags anything it can't cover so it's dealt with before work starts." },
];

const FAQ_ACTIVITY = (name: string) => [
  { q: `Do I need a SWMS for ${name.toLowerCase()} work?`, a: `Yes, if the work falls within one of the 18 high-risk construction work activities in the model WHS Regulations. A SWMS must be prepared before the work starts.` },
  { q: "Does the principal contractor need a copy?", a: "Yes. A principal contractor must take all reasonable steps to obtain the SWMS before high-risk construction work begins." },
  { q: "Can one SWMS cover more than one high-risk activity?", a: "Yes. One SWMS can cover several high-risk activities on the same job, for example work at height next to moving plant." },
  { q: "What happens if the SWMS isn't followed?", a: "The work must stop immediately, or as soon as it is safe to do so, and the SWMS must be reviewed before work continues." },
];

const tradeFaq = (t: TradeContent) => [
  { q: `Do ${t.plural.toLowerCase()} need a SWMS for every job?`, a: "Only for jobs that involve high-risk construction work. If none of the 18 activities apply, a SWMS isn't legally required, though the risks still need managing." },
  { q: "Can I use my company's own SWMS form?", a: "Yes. Upload your form once and it's saved in your paperwork dashboard, ready to be filled by voice on every job." },
  { q: "Who signs the SWMS?", a: "The workers doing the high-risk work sign to confirm they've read it and will follow it. Each person signs with their own saved signature." },
];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const clip = (s: string, n: number) => (s.length <= n ? s : s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…");

export interface Page { path: string; url: string; type: "hub" | "activity" | "trade" | "file"; body: string }

const CSS = `:root{--ink:#0e1726;--muted:#4a5568;--line:#e5e7eb;--brand:#0b5fff;--bg:#fff;--soft:#f6f8fb}
@media (prefers-color-scheme:dark){:root{--ink:#e8edf5;--muted:#a0aec0;--line:#243041;--brand:#5b8cff;--bg:#0b111b;--soft:#121a27}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.65 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
main{max-width:760px;margin:0 auto;padding:24px 16px 64px}header,footer{max-width:760px;margin:0 auto;padding:16px}
a{color:var(--brand)}nav.crumbs{font-size:14px;color:var(--muted)}nav.crumbs a{color:inherit}
h1{font-size:clamp(30px,6vw,44px);line-height:1.1;letter-spacing:-.02em;margin:12px 0 16px}h2{font-size:24px;margin:40px 0 12px;letter-spacing:-.01em}h3{font-size:18px;margin:24px 0 6px}
.lede{font-size:19px;color:var(--muted)}.cta{display:inline-block;background:var(--brand);color:#fff;padding:14px 22px;border-radius:12px;text-decoration:none;font-weight:600;margin:8px 0}
.card{background:var(--soft);border:1px solid var(--line);border-radius:14px;padding:18px 20px;margin:16px 0}
ul.grid{list-style:none;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}ul.grid li{border:1px solid var(--line);border-radius:12px;padding:12px 14px}
.reviewed{font-size:14px;color:var(--muted)}small{color:var(--muted)}
.tape{height:14px;position:relative;background:#e3ff00}.tape::after{content:"";position:absolute;left:0;right:0;top:4px;height:6px;background:linear-gradient(100deg,rgba(255,255,255,0) 30%,rgba(255,255,255,.75) 45%,rgba(255,255,255,0) 60%),repeating-linear-gradient(45deg,rgba(0,0,0,.07) 0 1px,transparent 1px 3px),repeating-linear-gradient(-45deg,rgba(0,0,0,.07) 0 1px,transparent 1px 3px),linear-gradient(#d9dde3,#aeb4bd)}
.tape.thin{height:8px;margin:40px 0 0}.tape.thin::after{top:2px;height:4px}
.photo{width:100%;height:auto;border-radius:14px;margin:8px 0 16px;display:block;background:var(--soft)}`;

function shell(cfg: SiteConfig, p: { url: string; title: string; desc: string; h1: string; crumbs: { name: string; url: string }[]; content: string; jsonLd: object[]; ogImage?: string }): string {
  const og = cfg.baseUrl + (p.ogImage ?? cfg.ogImage);
  const crumbLd = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: p.crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })),
  };
  return `<!doctype html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.desc)}">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1">
<link rel="canonical" href="${p.url}">
<link rel="alternate" hreflang="en-AU" href="${p.url}">
<link rel="alternate" hreflang="x-default" href="${p.url}">
<meta name="theme-color" content="#0b5fff">
<meta property="og:site_name" content="${esc(cfg.brand)}">
<meta property="og:locale" content="en_AU">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(p.title)}">
<meta property="og:description" content="${esc(p.desc)}">
<meta property="og:url" content="${p.url}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<style>${CSS}</style>
${[...p.jsonLd, crumbLd].map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join("\n")}
</head>
<body>
<div class="tape" aria-hidden="true"></div>
<header><a href="/" style="font-weight:700;text-decoration:none;color:inherit">${esc(cfg.brand)}</a></header>
<main>
<nav class="crumbs" aria-label="Breadcrumb">${p.crumbs.map((c, i) => (i < p.crumbs.length - 1 ? `<a href="${c.url}">${esc(c.name)}</a> › ` : esc(c.name))).join("")}</nav>
<h1>${esc(p.h1)}</h1>
${p.content}
</main>
<div class="tape" aria-hidden="true"></div>
<footer><small>${esc(cfg.brand)} SWMS are not a certification of compliance. The business doing the work remains responsible for checking the SWMS against the site, consulting workers, putting the controls in place and monitoring them.</small></footer>
</body>
</html>
`;
}

function webPageLd(cfg: SiteConfig, url: string, name: string, desc: string, reviewedAt: string) {
  return {
    "@context": "https://schema.org", "@type": "WebPage", url, name, description: desc, inLanguage: "en-AU",
    isPartOf: { "@type": "WebSite", name: cfg.brand, url: cfg.baseUrl },
    reviewedBy: { "@type": "Person", name: cfg.reviewer.name, hasCredential: { "@type": "EducationalOccupationalCredential", name: cfg.reviewer.credential } },
    lastReviewed: reviewedAt, dateModified: reviewedAt,
    publisher: { "@type": "Organization", name: cfg.brand, url: cfg.baseUrl },
  };
}

const faqLd = (faq: { q: string; a: string }[]) => ({
  "@context": "https://schema.org", "@type": "FAQPage",
  mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
});

const reviewedLine = (cfg: SiteConfig, date: string) =>
  `<p class="reviewed">Content reviewed by ${esc(cfg.reviewer.name)}, ${esc(cfg.reviewer.credential)}. Last reviewed ${date}.</p>`;

const LEVEL_LABEL: Record<string, string> = {
  elimination: "Eliminate", substitution: "Substitute", isolation: "Isolate", engineering: "Engineering", administrative: "Admin", ppe: "PPE",
};

export function buildSite(library: Module[], cfg: SiteConfig = SITE_DEFAULTS): Page[] {
  const reviewed = library.filter((m) => isPublishable(m) && m.hrcwCategoryId && m.seoSummary && wordCount(m.seoSummary) >= 120);
  const liveActs = HRCW_CATEGORIES.filter((c) => ACTIVITY_SEO[c.id] && reviewed.some((m) => m.hrcwCategoryId === c.id));
  const liveTrades = TRADES.filter((t) => t.reviewed);
  const actUrl = (id: string) => `${cfg.baseUrl}/swms/${ACTIVITY_SEO[id].slug}/`;
  const tradeUrl = (t: TradeContent) => `${cfg.baseUrl}/swms-for/${t.slug}/`;
  const hubUrl = `${cfg.baseUrl}/swms/`;
  const isLive = (id: string) => liveActs.some((c) => c.id === id);
  const pages: Page[] = [];
  const today = new Date().toISOString().slice(0, 10);

  // ---- Hub ----
  {
    const title = `SWMS: Site-Specific Safe Work Method Statements | ${cfg.brand}`;
    const desc = "What a SWMS is, when you need one, and the 18 high-risk construction activities. Speak the job, get a site-specific SWMS your crew signs on their phones.";
    const faq = [
      { q: "What is a SWMS?", a: "A Safe Work Method Statement sets out the high-risk construction work being done, the hazards and risks it creates, and how those risks will be controlled, monitored and reviewed." },
      { q: "When is a SWMS legally required?", a: "Before any of the 18 high-risk construction work activities in the model WHS Regulations starts. Victoria uses its own list of 19 activities under its OHS Regulations." },
      ...FAQ_ACTIVITY("high-risk construction").slice(1),
    ];
    const content = `<p class="lede">A SWMS has to match the job in front of the crew. ${esc(cfg.brand)} turns a spoken job brief into a site-specific SWMS in minutes, on our template or your own paperwork, then gets everyone signed on their phones.</p>
<p><a class="cta" href="${cfg.checkPath}">Run a free SWMS Check</a></p>
<h2>What a SWMS must cover</h2>
<p>A SWMS identifies the high-risk construction work being done, the hazards and risks to health and safety that come with it, and the measures that will control those risks. It also sets out how the controls will be put in place, monitored and reviewed. It has to be prepared before the work starts, in consultation with the workers doing it, and kept where they can get to it until the work is finished.</p>
<h2>The 18 high-risk construction work activities</h2>
<p>Under the model WHS Regulations a SWMS is required for these activities. One SWMS can cover several of them on the same job. Victoria has its own list of 19.</p>
<ul class="grid">${HRCW_CATEGORIES.map((c) => `<li>${isLive(c.id) ? `<a href="${actUrl(c.id)}">${esc(c.title)}</a>` : esc(c.title)}</li>`).join("")}</ul>
${liveTrades.length ? `<h2>SWMS by trade</h2><ul class="grid">${liveTrades.map((t) => `<li><a href="${tradeUrl(t)}">SWMS for ${esc(t.plural.toLowerCase())}</a></li>`).join("")}</ul>` : ""}
<h2>How ${esc(cfg.brand)} builds your SWMS</h2>
<div class="card"><strong>1. Say the job.</strong> Task, site, gear and crew in your own words. We ask for anything missing, out loud.</div>
<div class="card"><strong>2. Check the draft.</strong> Hazards and controls come only from reviewed content. Anything not covered is flagged for you to add.</div>
<div class="card"><strong>3. Sign and send.</strong> Each person signs with their own saved signature. Email, print or save the PDF, and every copy is logged.</div>
<div class="tape thin" aria-hidden="true"></div>
<h2>Common questions</h2>
${faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("\n")}
${reviewedLine(cfg, today)}`;
    pages.push({
      path: "swms/index.html", url: hubUrl, type: "hub",
      body: shell(cfg, {
        url: hubUrl, title, desc, h1: "Site-specific SWMS, built from what you say on site",
        crumbs: [{ name: cfg.brand, url: cfg.baseUrl + "/" }, { name: "SWMS", url: hubUrl }], content,
        jsonLd: [
          webPageLd(cfg, hubUrl, title, desc, today),
          faqLd(faq),
          { "@context": "https://schema.org", "@type": "SoftwareApplication", name: cfg.brand, applicationCategory: "BusinessApplication", operatingSystem: "iOS, Android, Web", description: desc, url: cfg.baseUrl },
          { "@context": "https://schema.org", "@type": "Organization", name: cfg.brand, url: cfg.baseUrl, logo: `${cfg.baseUrl}/apple-touch-icon.png` },
        ],
      }),
    });
  }

  // ---- Activity pages ----
  for (const c of liveActs) {
    const s = ACTIVITY_SEO[c.id];
    const mods = reviewed.filter((m) => m.hrcwCategoryId === c.id);
    const lastReviewed = mods.map((m) => m.reviewedAt!).sort().pop()!;
    const url = actUrl(c.id);
    const title = clip(`${s.name} SWMS | Site-Specific in Minutes | ${cfg.brand}`, 60);
    const desc = clip(`${s.name} SWMS for Australian tradies. Say the job and get a site-specific SWMS from reviewed WHS content, signed by your crew on their phones.`, 158);
    const faq = FAQ_ACTIVITY(s.name);
    const hazards = mods.flatMap((m) => m.hazards);
    const trades = liveTrades.filter((t) => t.activities.includes(c.id));
    const related = liveActs.filter((o) => o.id !== c.id).slice(0, 6);
    const content = `<p class="lede">Jobs that involve ${esc(s.plain ?? c.title.toLowerCase())} are high-risk construction work, so a SWMS has to be in place before work starts. Here's what it needs to cover, and how ${esc(cfg.brand)} builds one for your actual site.</p>
<p><a class="cta" href="${cfg.checkPath}">Run a free SWMS Check</a></p>
<h2>About ${esc(s.name.toLowerCase())} work</h2>
${mods.map((m) => m.seoSummary!.split(/\n{2,}/).map((para) => `<p>${esc(para.trim())}</p>`).join("\n")).join("\n")}
<h2>Hazards a ${esc(s.name.toLowerCase())} SWMS needs to address</h2>
${hazards.map((h) => `<div class="card"><h3>${esc(h.description)}</h3><p>${esc(h.risk)}</p><ul>${h.controls.map((ct) => `<li><strong>${LEVEL_LABEL[ct.level]}:</strong> ${esc(ct.text)}</li>`).join("")}</ul></div>`).join("\n")}
<p>Controls are listed most effective first, following the hierarchy of control. Your SWMS will reflect the conditions on your site, and anything our reviewed content doesn't cover is flagged for you to add before the crew signs.</p>
<div class="tape thin" aria-hidden="true"></div>
<h2>Common questions</h2>
${faq.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("\n")}
${trades.length ? `<h2>Trades that often need this SWMS</h2><ul class="grid">${trades.map((t) => `<li><a href="${tradeUrl(t)}">${esc(t.plural)}</a></li>`).join("")}</ul>` : ""}
${related.length ? `<h2>Other high-risk work</h2><ul class="grid">${related.map((o) => `<li><a href="${actUrl(o.id)}">${esc(ACTIVITY_SEO[o.id].name)} SWMS</a></li>`).join("")}</ul>` : ""}
<p><a href="${hubUrl}">All about SWMS and the 18 high-risk activities</a></p>
${reviewedLine(cfg, lastReviewed)}`;
    pages.push({
      path: `swms/${s.slug}/index.html`, url, type: "activity",
      body: shell(cfg, {
        url, title, desc, h1: `${s.name} SWMS`,
        crumbs: [{ name: cfg.brand, url: cfg.baseUrl + "/" }, { name: "SWMS", url: hubUrl }, { name: `${s.name} SWMS`, url }],
        content, jsonLd: [webPageLd(cfg, url, title, desc, lastReviewed), faqLd(faq)],
      }),
    });
  }

  // ---- Trade pages ----
  for (const t of liveTrades) {
    const url = tradeUrl(t);
    const title = clip(`SWMS for ${t.plural} | Site-Specific SWMS | ${cfg.brand}`, 60);
    const desc = clip(`SWMS for ${t.plural.toLowerCase()}: the high-risk work your jobs usually involve, and a fast way to build a site-specific SWMS your crew signs on site.`, 158);
    const photo = cfg.tradePhotos?.[t.slug] && t.photoAlt
      ? `<img class="photo" src="/img/trades/${t.slug}.webp" width="1200" height="800" alt="${esc(t.photoAlt)}" fetchpriority="high" decoding="async">\n`
      : "";
    const content = `${photo}<p class="lede">${esc(t.intro)}</p>
<p><a class="cta" href="${cfg.checkPath}">Run a free SWMS Check</a></p>
<h2>High-risk work ${esc(t.plural.toLowerCase())} commonly do</h2>
<ul class="grid">${t.activities.map((id) => {
      const cat = HRCW_CATEGORIES.find((x) => x.id === id)!;
      return `<li>${isLive(id) ? `<a href="${actUrl(id)}">${esc(ACTIVITY_SEO[id].name)} SWMS</a>` : esc(cat.title)}</li>`;
    }).join("")}</ul>
<h2>What a SWMS for ${esc(t.plural.toLowerCase())} should include</h2>
<p>Every SWMS needs to name the high-risk construction work being done, the hazards and risks that come with it, and the control measures that will be used, with how they'll be put in place, monitored and reviewed. For ${esc(t.plural.toLowerCase())}, that means writing it around the actual job: the site, the access, the plant and tools on the day, the crew doing the work and anything unusual about the conditions. A generic template that doesn't mention the site is the most common reason a SWMS gets knocked back.</p>
<div class="tape thin" aria-hidden="true"></div>
<h2>Common questions</h2>
${tradeFaq(t).map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join("\n")}
<h2>How it works on site</h2>
<div class="card"><strong>Talk it through.</strong> Describe the job the way you'd brief your offsider. ${esc(cfg.brand)} asks for anything it needs, out loud.</div>
<div class="card"><strong>Your paperwork or ours.</strong> Use our template with your logo, or upload your company's own SWMS form once and fill it every time.</div>
<div class="card"><strong>Signed before you start.</strong> Saved signatures go on with a tap. Email the PDF to the builder, print it, or save it to your phone.</div>
<p><a href="${hubUrl}">What every SWMS must include</a></p>
${reviewedLine(cfg, today)}`;
    pages.push({
      path: `swms-for/${t.slug}/index.html`, url, type: "trade",
      body: shell(cfg, {
        url, title, desc, h1: `SWMS for ${t.plural}`,
        crumbs: [{ name: cfg.brand, url: cfg.baseUrl + "/" }, { name: "SWMS", url: hubUrl }, { name: `SWMS for ${t.plural}`, url }],
        content, jsonLd: [webPageLd(cfg, url, title, desc, today), faqLd(tradeFaq(t))],
        ogImage: cfg.tradePhotos?.[t.slug] ? `/img/trades/${t.slug}-share.jpg` : undefined,
      }),
    });
  }

  // ---- Files ----
  const urls = [cfg.baseUrl + "/", ...pages.map((p) => p.url)];
  pages.push({ path: "sitemap.xml", url: `${cfg.baseUrl}/sitemap.xml`, type: "file",
    body: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n` });
  pages.push({ path: "robots.txt", url: `${cfg.baseUrl}/robots.txt`, type: "file",
    body: `User-agent: *\nAllow: /\nDisallow: /app/\nDisallow: /api/\nSitemap: ${cfg.baseUrl}/sitemap.xml\n` });
  pages.push({ path: "llms.txt", url: `${cfg.baseUrl}/llms.txt`, type: "file",
    body: `# ${cfg.brand}\n\n> ${cfg.brand} builds site-specific Safe Work Method Statements (SWMS) for Australian trades from a spoken job description. Hazards and controls come only from content reviewed by a WHS-qualified professional, and crews sign on their phones.\n\n## Guides\n${pages.filter((p) => p.type !== "file").map((p) => `- [${p.url.replace(cfg.baseUrl, "")}](${p.url})`).join("\n")}\n` });
  return pages;
}

// ---------- Build gate ----------

export function wordCount(s: string): number {
  return s.replace(/<[^>]+>/g, " ").split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length;
}

export function lintPages(pages: Page[], cfg: SiteConfig = SITE_DEFAULTS, banned: string[] = []): string[] {
  const errors: string[] = [];
  const htmlPages = pages.filter((p) => p.type !== "file");
  const known = new Set([cfg.baseUrl + "/", ...pages.map((p) => p.url)]);
  const titles = new Map<string, string>();
  for (const p of pages) {
    for (const b of ["PASTE_", "PLACEHOLDER", ...banned]) if (p.body.toLowerCase().includes(b.toLowerCase())) errors.push(`${p.path}: contains "${b}"`);
  }
  for (const p of htmlPages) {
    const b = p.body;
    const title = b.match(/<title>(.*?)<\/title>/)?.[1] ?? "";
    const desc = b.match(/<meta name="description" content="(.*?)">/)?.[1] ?? "";
    if (!title) errors.push(`${p.path}: no title`);
    if (title.length > 60) errors.push(`${p.path}: title over 60 characters (${title.length})`);
    if (titles.has(title)) errors.push(`${p.path}: duplicate title with ${titles.get(title)}`);
    titles.set(title, p.path);
    if (desc.length < 70 || desc.length > 160) errors.push(`${p.path}: description length ${desc.length} (want 70–160)`);
    if ((b.match(/<h1>/g) || []).length !== 1) errors.push(`${p.path}: must have exactly one h1`);
    if (!b.includes(`<link rel="canonical" href="${p.url}">`)) errors.push(`${p.path}: canonical missing or wrong`);
    if (!b.includes('<html lang="en-AU">')) errors.push(`${p.path}: lang must be en-AU`);
    const main = b.split("<main>")[1]?.split("</main>")[0] ?? "";
    if (wordCount(main) < 300) errors.push(`${p.path}: thin content (${wordCount(main)} words, want 300+)`);
    for (const m of b.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) {
      try { JSON.parse(m[1]); } catch { errors.push(`${p.path}: invalid structured data`); }
    }
    for (const m of main.matchAll(/<img\b[^>]*>/g)) {
      const tag = m[0];
      if (!/\balt="[^"]{10,}"/.test(tag)) errors.push(`${p.path}: image missing a proper alt description`);
      if (!/\bwidth="\d+"/.test(tag) || !/\bheight="\d+"/.test(tag)) errors.push(`${p.path}: image missing width/height`);
    }
    for (const m of main.matchAll(/href="([^"]+)"/g)) {
      const href = m[1];
      if (href === cfg.checkPath || href === cfg.signupPath || href === "/") continue;
      if (href.startsWith(cfg.baseUrl) && !known.has(href)) errors.push(`${p.path}: broken internal link ${href}`);
    }
  }
  return errors;
}

// ===================== demo =====================
// Self-test. Module text here is PLACEHOLDER-style test data only — real content comes from the founder's review.


const SUMMARY = Array(14).fill("Test summary sentence used only to exercise the page builder and its checks.").join(" ");

const library: Module[] = [
  {
    id: "falls-v1", title: "Working at height", hrcwCategoryId: "falls",
    triggers: ["roof", "ladder", "scaffold", "harness", "height"],
    hazards: [{ id: "fall-edge", description: "Test hazard: fall from an unprotected edge", risk: "Test risk text", controls: [
      { id: "c1", text: "Test control: wear harness", level: "ppe" },
      { id: "c2", text: "Test control: fit edge protection", level: "engineering" },
    ] }],
    sources: ["Code of Practice: Managing the risk of falls"], version: 1,
    status: "reviewed", reviewedBy: "Founder", reviewedAt: "2026-10-22", seoSummary: SUMMARY,
  },
  {
    id: "power-tools-v1", title: "Power tools", hrcwCategoryId: null,
    triggers: ["grinder", "angle grinder", "drill", "saw"],
    hazards: [{ id: "grinder-cut", description: "Test cut hazard", risk: "Test", controls: [
      { id: "c3", text: "Test control: guard fitted", level: "engineering" },
    ] }],
    sources: [], version: 1, status: "reviewed", reviewedBy: "Founder", reviewedAt: "2026-10-22",
  },
  {
    id: "electrical-v1", title: "Energised electrical", hrcwCategoryId: "energised-electrical",
    triggers: ["switchboard"], hazards: [], sources: [], version: 1,
    status: "reviewed", reviewedBy: "Founder", reviewedAt: "2026-10-22", seoSummary: SUMMARY,
    specialistReviewRequired: true, // no specialist sign-off yet → must NOT be used or published
  },
];

const SIG = "M10 40 L40 10 L70 40 L100 10 L130 40 L160 12";

export function selfTest(): void {
  // ---- Extraction & selection ----
  const t = "Re-roofing a two storey house in Proserpine, angle grinder, two of us, it's windy";
  const brief = parseBrief(t, JSON.stringify({ task: "Re-roof two-storey house", location: "Proserpine", maxHeightMetres: null, equipment: ["angle grinder"], crewSize: 2, siteConditions: ["windy"] }));
  assert.equal(brief.maxHeightMetres, null);
  let sel = select(brief, library);
  assert.equal(nextFollowUp(brief, sel.needsHeight), "Roughly how high off the ground will you be working, in metres?");
  assert.ok(readBack(brief).endsWith("Correct?"));

  const brief2 = { ...brief, maxHeightMetres: 7 };
  sel = select(brief2, library);
  assert.deepEqual(sel.hrcw.map((h) => h.id), ["falls"]);
  assert.deepEqual(sel.modules.map((m) => m.id), ["falls-v1", "power-tools-v1"]);
  assert.ok(sel.notCovered.some((f) => f.item === "windy"));

  // ---- Assembly, controls, signatures ----
  let swms = assemble(brief2, sel, { name: "Test Roofing Pty Ltd" });
  assert.equal(swms.hazards[0].controls[0].level, "engineering");

  const vault = new SignatureVault();
  assert.throws(() => vault.save("dave", "Dave", "M1 1 L2 2")); // stray tap rejected
  const v1 = vault.save("dave", "Dave", SIG);
  vault.save("mia", "Mia", SIG);

  // Vague control rejected; proper one accepted.
  assert.throws(() => resolveFlag(swms, "windy", { id: "w", description: "Wind", risk: "Fall", controls: [{ id: "w0", text: "be careful", level: "administrative" }] }));
  const preResolve = swms;
  assert.throws(() => signOff(preResolve, applySignature(vault, { actingUserId: "dave", fieldId: "crew", role: "Roofer", documentHash: preResolve.contentHash, confirmedTap: true })));
  swms = resolveFlag(swms, "windy", { id: "wind", description: "Wind on roof", risk: "Loss of balance", controls: [{ id: "w1", text: "Stop roof work if wind exceeds the agreed limit", level: "administrative" }] });

  // Must tap; can't apply someone else's signature.
  assert.throws(() => applySignature(vault, { actingUserId: "dave", fieldId: "crew", role: "Roofer", documentHash: swms.contentHash, confirmedTap: false }));
  assert.throws(() => applySignature(vault, { actingUserId: "nobody", fieldId: "crew", role: "Roofer", documentHash: swms.contentHash, confirmedTap: true }));

  const stampDave = applySignature(vault, { actingUserId: "dave", fieldId: "crew", role: "Roofer", documentHash: swms.contentHash, confirmedTap: true });
  const stampMia = applySignature(vault, { actingUserId: "mia", fieldId: "crew", role: "Labourer", documentHash: swms.contentHash, confirmedTap: true });
  const sigs = [signOff(swms, stampDave), signOff(swms, stampMia)];
  assert.equal(validSignatures(swms, sigs).length, 2);

  // Same saved signature reused on another document, unlimited times.
  const other = applySignature(vault, { actingUserId: "dave", fieldId: "author", role: "Roofer", documentHash: "another-doc", confirmedTap: true });
  assert.equal(other.signatureId, v1.id);

  // Redo signature: new version current, old documents still verify.
  const v2 = vault.save("dave", "Dave", SIG + " L190 40");
  assert.equal(v2.version, 2);
  assert.ok(verifyStamp(vault, stampDave, swms.contentHash));
  assert.equal(applySignature(vault, { actingUserId: "dave", fieldId: "x", role: "Roofer", documentHash: "d", confirmedTap: true }).signatureVersion, 2);

  // Edit after signing voids signatures.
  const edited = applyEdit(swms, { brief: { ...swms.brief, crewSize: 3 } });
  assert.equal(validSignatures(edited, sigs).length, 0);

  // Unreviewed specialist module never used; no-HRCW notice.
  const elec = select(parseBrief("swapping a switchboard", JSON.stringify({ task: "Swap switchboard", equipment: [], siteConditions: [] })), library);
  assert.equal(elec.modules.length, 0);
  assert.ok(elec.notCovered.some((f) => f.item.includes("energised")));
  const plain = select(parseBrief("painting a fence", JSON.stringify({ task: "Paint fence", equipment: ["brush"], siteConditions: [] })), library);
  assert.equal(plain.hrcw.length, 0);
  assert.ok(plain.notices[0].startsWith("No high-risk"));
  assert.ok(select(parseBrief("re-roofing", JSON.stringify({ task: "re-roofing", equipment: [], siteConditions: [] })), library).hrcw.some((h) => h.id === "falls"));

  // ---- Smart phrasing faithfulness ----
  assert.deepEqual(numbersIn("forty five k's and 7 m"), [7, 45]);
  const good = faithfulnessCheck("re-roofing a two storey house seven metres up, angle grinder, two of us", "Re-roofing a two-storey house at a height of 7 m using an angle grinder. Crew of 2.");
  assert.ok(good.ok, good.problems.join("; "));
  const addedControl = faithfulnessCheck("re-roofing seven metres up", "Re-roofing at 7 m. Workers will wear a harness.");
  assert.ok(!addedControl.ok && addedControl.text === "re-roofing seven metres up");
  const addedNumber = faithfulnessCheck("re-roofing up high", "Re-roofing at 9 m.");
  assert.ok(!addedNumber.ok);
  assert.ok(!faithfulnessCheck("roof", "NEEDS_MORE_DETAIL").ok);

  // ---- Voice guide & troubleshooting ----
  const f = GENERIC_SWMS;
  assert.equal(nextPrompt(f, {}).fieldId, "businessName"); // logo optional
  assert.equal(checkField(f.fields.find((x) => x.id === "abn")!, "123")?.problem, "missing");
  assert.equal(checkField(f.fields.find((x) => x.id === "workDescription")!, "roof job")?.problem, "too-brief");
  const values: Record<string, unknown> = {
    businessName: "Test Roofing", abn: "51 824 753 556", businessAddress: "4 Industrial Ave Proserpine", siteAddress: "12 Main Street Proserpine",
    workDescription: "Re-roofing a two-storey house at 7 m using an angle grinder, crew of 2.",
    hrcw: ["falls"], hazards: swms.hazards, responsiblePerson: "Dave",
    reviewTrigger: "Review if the scope, crew or conditions change.", controlMonitoring: "Leading hand checks edge protection every morning.", datePrepared: "2026-10-25",
    authorSignature: stampDave, crewSignatures: [stampDave, stampMia],
  };
  assert.deepEqual(troubleshoot(f, values, { notCoveredCount: 0 }), []);
  const missingSig = troubleshoot(f, { ...values, crewSignatures: [] });
  assert.equal(missingSig[0].problem, "unsigned");
  assert.equal(troubleshoot(f, values, { notCoveredCount: 2 })[0].problem, "not-covered");
  // Talking style: short first ask, shorter second, help only on a third miss or when asked.
  const abnField = f.fields.find((x) => x.id === "abn")!;
  const talk = { attempts: {} as Record<string, number>, completedSwms: 0, muted: false };
  assert.equal(whatToSay(abnField, talk), "And the ABN?");
  assert.equal(whatToSay(abnField, { ...talk, attempts: { abn: 1 } }), "ABN?");
  assert.equal(whatToSay(abnField, { ...talk, attempts: { abn: 2 } }), abnField.helpPrompt);
  assert.equal(whatToSay(abnField, talk, true), abnField.helpPrompt);
  assert.equal(whatToSay(abnField, { ...talk, muted: true }), null);
  for (const fld of f.fields) assert.ok(fld.voicePrompt.split(/\s+/).length <= 10, `prompt too long: ${fld.voicePrompt}`);
  const pre = prefill(f, { businessName: "Test Roofing", abn: "51 824 753 556", businessAddress: "4 Industrial Ave Proserpine" }, "2026-10-25");
  assert.equal(nextPrompt(f, pre).fieldId, "siteAddress"); // known details never asked
  assert.ok(troubleshootSummary([]).startsWith("Had a read through"));
  assert.equal(troubleshoot(f, { ...values, siteAddress: "" })[0].spoken, "Looks like the site address hasn't gone in yet.");
  // "That's all" keeps a light answer and stops the nudging — but can't wave through empty fields.
  for (const u of ["That's all", "that'll do", "leave it", "keep it as is", "That's all I've got"]) assert.equal(parseCommand(u).type, "keep", u);
  const light = { ...values, workDescription: "Fixing a roof" };
  assert.equal(troubleshoot(f, light)[0].problem, "too-brief");
  assert.deepEqual(troubleshoot(f, light, { accepted: ["workDescription"] }), []);
  assert.equal(troubleshoot(f, { ...values, siteAddress: "" }, { accepted: ["siteAddress"] })[0].problem, "missing");
  assert.equal(checkControl("stop if windy"), "That's a bit light. What'll you do, and how?");
  assert.equal(checkControl("stop if windy", true), null);
  assert.notEqual(checkControl("be careful", true), null); // still has to be an actual action
  assert.equal(parseCommand("Read it back").type, "readBack");
  assert.equal(parseCommand("yep").type, "yes");
  assert.equal(parseCommand("I'll type").type, "typeMode");
  const ch = parseCommand("change site address to 14 Main Street");
  assert.ok(ch.type === "change" && matchField(f, ch.field)?.id === "siteAddress");
  assert.equal(parseCommand("fixing gutters on a shed").type, "answer");

  // ---- More ways to say things ----
  const said = (u: string) => parseCommand(u);
  assert.equal(said("Yeah nah").type, "no");
  assert.equal(said("nah yeah").type, "yes");
  assert.equal(said("She'll be right").type, "keep");
  assert.equal(said("scratch that").type, "undo");
  assert.equal(said("who's left to sign").type, "whoSigned");
  assert.equal(said("redo my signature").type, "redoSignature");
  assert.equal(said("same as last job").type, "sameAsLast");
  assert.equal(said("new job").type, "newSwms");
  assert.equal(said("use my paperwork").type, "usePaperwork");
  assert.equal(said("open an old report").type, "openOld");
  assert.equal(said("give me a sec").type, "pause");
  assert.equal(said("shush").type, "quiet");
  assert.equal(said("any ideas").type, "suggest");
  assert.equal(said("use that").type, "useSuggestion");
  assert.equal(said("what's missing").type, "check");
  assert.equal(said("what's left").type, "whatsLeft");
  const em = said("email it to Tom");
  assert.ok(em.type === "emailTo" && em.name === "tom");
  const cl = said("clear the address");
  assert.ok(cl.type === "clear" && matchField(f, cl.field)?.id === "siteAddress");
  const gt = said("go to the hazards bit");
  assert.ok(gt.type === "goTo" && matchField(f, gt.field)?.id === "hazards");
  const rf = said("what's the builder");
  assert.ok(rf.type === "readField" && matchField(f, rf.field)?.id === "principalContractor");
  const vg = said("use the bloke's voice");
  assert.ok(vg.type === "voice" && vg.gender === "male");

  // ---- Specific replies ----
  assert.equal(Replies.whoSigned(["Dave", "Mia"], ["Jack"]), "Dave and Mia have signed. Just Jack to go.");
  assert.equal(Replies.whoSigned(["Dave", "Mia", "Jack"], []), "Everyone's signed: Dave, Mia and Jack.");
  assert.equal(Replies.emailTo({ name: "Tom", company: "Hutchinson Builders", email: "t@h.com" }, "tom"), "Sending to Tom at Hutchinson Builders.");
  assert.equal(Replies.emailTo(null, "Tom"), "I haven't got an email for Tom yet. What's their email?");
  const fSite = f.fields.find((x) => x.id === "siteAddress")!;
  const fRev = f.fields.find((x) => x.id === "reviewTrigger")!;
  assert.equal(Replies.whatsLeft([fSite, fRev]), "Two to go: the site address, then the review bit.");
  assert.equal(Replies.undone(fSite, "12 Main St"), "Put the site address back to 12 Main St.");
  assert.equal(Replies.notHeard(2), "Still not catching it, it might be the noise. Want to type that one?");

  // ---- Tone check across everything the app can say ----
  const everything = [
    ...f.fields.flatMap((x) => [x.voicePrompt, x.helpPrompt, x.nudge ?? ""]),
    ...SYSTEM_LINES, OFFER_LINE,
    ...troubleshoot(f, {}, { notCoveredCount: 2 }).map((i) => i.spoken),
    troubleshootSummary([]), checkControl("x") ?? "", checkControl("be careful lads ok") ?? "",
    Replies.whoSigned([], ["Jack"]), Replies.whoSigned([], []), Replies.crewLinkSent(3), Replies.crewMemberSigned("Mia", 1),
    Replies.redoSignature(), Replies.emailTo({ name: "Tom" }, "Tom"), Replies.emailed({ name: "Tom" }), Replies.sendOptions(),
    Replies.saved("SWMS"), Replies.printing(), Replies.whatsLeft([]), Replies.whatsLeft([fSite]), Replies.whatsLeft([fSite, fRev, fSite]),
    Replies.readField(fSite, ""), Replies.readField(fSite, "12 Main St"), Replies.goTo(fSite), Replies.cleared(fSite),
    Replies.changed(fSite, "x"), Replies.undone(fSite, ""), Replies.undone(fSite, "x"), Replies.noField("thing"),
    Replies.newSwms(null), Replies.newSwms("Acme form"), Replies.sameAsLast("the Bowen job", ["Site address"]),
    Replies.reused("the Bowen job", 6, 0), Replies.reused("the Bowen job", 6, 3), Replies.hazardsRebuilt(),
    Replies.suggestion("x", "From your last job"), Replies.noSuggestion(), Replies.notHeard(1), Replies.notHeard(2),
    Replies.typeMode(), Replies.voiceMode(0), Replies.voiceMode(3), Replies.quiet(), Replies.paused(), Replies.cancelled(),
    Replies.voiceChanged("female"), Replies.voiceChanged("male"),
  ];
  for (const line of everything) for (const b of TONE_BANNED)
    assert.ok(!line.toLowerCase().includes(b), `tone: "${line}" contains "${b}"`);

  // ---- Pacing ----
  const pace = new Pacer();
  pace.on({ type: "fieldChanged", at: 0, fieldId: "workDescription" });
  pace.on({ type: "speechStart", at: 100 });
  assert.equal(pace.canSpeak(500), false); // never over the top of them
  pace.on({ type: "speechEnd", at: 1000, longAnswerField: true });
  assert.equal(pace.canSpeak(1000 + 1500), false); // thinking pause on a long answer
  assert.equal(pace.canSpeak(1000 + PACING.endOfTurnLongMs), true);
  pace.on({ type: "touch", at: 4000 });
  assert.equal(pace.canSpeak(6000), false); // they're doing it themselves
  assert.equal(pace.canSpeak(9100), true);
  assert.equal(pace.showInfoGlow(9100), false);
  assert.equal(pace.showInfoGlow(16100), true); // glow only, never a voice prompt
  assert.equal(pace.shouldOfferSuggestion("workDescription"), false);
  pace.on({ type: "missed", fieldId: "workDescription" });
  pace.on({ type: "missed", fieldId: "workDescription" });
  assert.equal(pace.shouldOfferSuggestion("workDescription"), true);
  pace.on({ type: "offerMade", fieldId: "workDescription" });
  assert.equal(pace.shouldOfferSuggestion("workDescription"), false); // once, ever
  pace.on({ type: "quiet" });
  assert.equal(pace.canSpeak(99999), false);

  // ---- Typing mode, undo, reuse ----
  let draft = newDraft(f, "Re-roof, Bowen", "text");
  draft = setValue(draft, "siteAddress", "12 Main Street Bowen", "typed");
  draft = setValue(draft, "siteAddress", "14 Main Street Bowen", "typed");
  const u1 = undo(draft);
  assert.equal(u1.draft.values.siteAddress, "12 Main Street Bowen");
  assert.equal(undo(u1.draft).draft.values.siteAddress, undefined);
  const oldJob = { ...newDraft(f, "Old job", "voice"), values: { ...values } };
  const copy = copyFromOld(oldJob, f, { name: "New job", today: "2026-11-01" });
  assert.equal(copy.draft.values.siteAddress, values.siteAddress);
  assert.equal(copy.draft.values.datePrepared, "2026-11-01");
  assert.equal(copy.draft.values.crewSignatures, undefined); // signatures never copied
  assert.equal(copy.draft.values.hazards, undefined); // rebuilt from current reviewed content
  assert.equal(copy.draft.sources.siteAddress, "copied");
  const wiped = clearFields(copy.draft, ["siteAddress", "workDescription"]);
  const left = remainingFields(f, wiped).map((x) => x.id);
  assert.ok(left.includes("siteAddress") && left.includes("workDescription") && left.includes("crewSignatures"));
  assert.equal(continueWith(wiped, "voice").mode, "voice");
  const imp = importPreviousReport(f, [{ name: "Job Address", value: "3 Shute Harbour Rd" }, { name: "Box 9", value: "something" }], "Imported");
  assert.equal(imp.draft.values.siteAddress, "3 Shute Harbour Rd");
  assert.equal(imp.unmatched.length, 1);

  // ---- ℹ️ suggestions ----
  const ctxS = { today: "2026-11-01", profile: { businessName: "Test Roofing" }, pastJobs: [oldJob], brief: brief2, library };
  assert.equal(suggestFor(f, {}, "businessName", ctxS)?.basis, "From your saved details");
  assert.equal(suggestFor(f, {}, "siteAddress", ctxS)?.text, values.siteAddress);
  assert.ok(suggestFor(f, {}, "workDescription", ctxS)!.text.includes("7 m"));
  assert.equal(suggestFor(f, { siteAddress: values.siteAddress }, "responsiblePerson", ctxS)?.basis, "Same as last time at this site");
  assert.equal(suggestFor(f, {}, "hazards", { ...ctxS, notCoveredItem: "heat stress" }), null); // never guesses safety content
  assert.ok(suggestFor(f, {}, "hazards", { ...ctxS, notCoveredItem: "roof edge" }) !== null);

  // ---- Sign everywhere ----
  const coForm = [{ id: "prep", kind: "signature", signer: "author" as const }, { id: "ack", kind: "signature", signer: "author" as const }, { id: "crew", kind: "signature", signer: "crew" as const }, { id: "addr", kind: "text" }];
  const all = applyToAllMyFields(vault, coForm, { actingUserId: "dave", as: "author", role: "Roofer", documentHash: "h", confirmedTap: true });
  assert.deepEqual(all.map((x) => x.fieldId), ["prep", "ack"]);
  assert.throws(() => applyToAllMyFields(vault, coForm, { actingUserId: "dave", as: "author", role: "Roofer", documentHash: "h", confirmedTap: false }));

  // ---- Required SWMS fields now in the template ----
  for (const k of ["businessAddress", "controlMonitoring", "dateProvided"]) assert.ok(f.fields.some((x) => x.key === k), k);
  assert.equal(markProvided({}, "dateProvided", "2026-11-02").dateProvided, "2026-11-02");
  assert.equal(markProvided({ dateProvided: "2026-11-01" }, "dateProvided", "2026-11-02").dateProvided, "2026-11-01");

  // ---- Free SWMS Check ----
  const generic = "SAFE WORK METHOD STATEMENT. Company: [insert name]. Hazards: slips. Controls: be careful. Date: ____";
  const rep = checkExistingSwms(generic, brief2, library);
  assert.ok(rep.items.some((i) => i.label === "Template text left in"));
  assert.ok(rep.items.some((i) => i.label.startsWith("Risk of a person falling") && i.status === "missing"));
  assert.ok(rep.items.some((i) => i.label === "Site-specific" && i.status === "worth-a-look"));
  assert.ok(rep.summary.startsWith("Had a read through.") && rep.disclaimer.includes("not a compliance assessment"));
  for (const line of [rep.summary, rep.disclaimer, ...rep.items.map((i) => i.note)]) for (const b of TONE_BANNED)
    assert.ok(!line.toLowerCase().includes(b), `tone: "${line}" contains "${b}"`);

  // ---- Content console ----
  const draftMod = { ...library[1], status: "draft" as const, reviewedBy: undefined, reviewedAt: undefined };
  assert.ok(reviewBlockers(draftMod).some((b) => b.includes("code of practice")));
  const ppeOnly = { ...library[0], hazards: [{ ...library[0].hazards[0], controls: [{ id: "p", text: "Wear harness", level: "ppe" as const }] }] };
  assert.ok(reviewBlockers(ppeOnly).some((b) => b.includes("higher-order")));
  assert.equal(markReviewed(library[0], "Founder", "2026-10-25").status, "reviewed");
  const edited2 = editModule(library[0], { triggers: ["roof", "gutter"] });
  assert.ok(edited2.status === "draft" && edited2.version === 2 && select(brief2, [edited2]).modules.length === 0);
  assert.ok(jurisdictionNotice("vic") !== null && jurisdictionNotice("QLD") === null);

  // ---- Portable hashing matches the standard ----
  assert.equal(sha256Hex("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.equal(sha256Hex(""), "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");

  // ---- Company paperwork ----
  assert.equal(guessKey("Principal_Contractor"), "principalContractor");
  assert.equal(guessKey("Worker Signature 3"), "crewSignatures");
  const { form, unmatched } = buildCompanyForm("co1", "Acme SWMS", "https://files/acme.pdf", [
    { name: "Company Name", kind: "text", page: 1, rect: { x: 50, y: 700, w: 200, h: 20 } },
    { name: "Job Address", kind: "text", page: 1, rect: { x: 50, y: 670, w: 200, h: 20 } },
    { name: "Box 17", kind: "text", page: 2, rect: { x: 50, y: 100, w: 200, h: 20 } },
  ]);
  assert.deepEqual(form.fields.map((x) => x.key), ["businessName", "siteAddress"]);
  assert.equal(unmatched.length, 1);
  const labelled = labelField(form, unmatched[0], "responsiblePerson");
  assert.equal(labelled.fields.length, 3);
  const lib = new PaperworkLibrary();
  lib.add(labelled);
  assert.equal(lib.list("co1").length, 2);
  assert.throws(() => lib.remove("generic-swms"));

  // ---- Voice, logo, output ----
  const lines = promptLibrary();
  assert.ok(lines.length > 20 && lines.includes(f.fields[1].voicePrompt));
  assert.match(audioKey("Got it.", "female"), /^\/voice\/female\/[0-9a-f]+\.mp3$/);
  assert.ok(azureSsml("Fish & chips", "male").includes("en-AU-WilliamNeural") && azureSsml("Fish & chips", "male").includes("&amp;"));
  assert.ok(elevenLabsRequest("hi", "female", "k").url.includes("/stream"));
  assert.equal(domainFrom("https://www.Acme-Roofing.com.au/about"), "acme-roofing.com.au");
  assert.equal(logoLookupUrl("not a site"), null);
  const log = new SentLog();
  log.record({ documentId: swms.id, documentName: "SWMS", contentHash: swms.contentHash, channel: "email", to: ["builder@example.com"] });
  assert.equal(log.list(swms.id).length, 1);
  assert.deepEqual(validEmails(["a@b.com", "nope"]).bad, ["nope"]);
  assert.ok(emailPayload({ to: ["a@b.com"], fromName: "Dave", documentName: "SWMS", siteAddress: "12 Main St", pdfBase64: "x", baseUrl: "https://www.example.com.au" }).text.includes("Made with Safe Word · www.example.com.au/start"));

  // ---- Launch gate ----
  const goodCase: GateCase = { name: "roof", brief: brief2, expect: { task: true, equipment: ["grinder"], crewSize: 2, hrcw: ["falls"] } };
  const badCase: GateCase = { ...goodCase, name: "missed crew", brief: { ...brief2, crewSize: null } };
  assert.equal(runGate(Array(9).fill(goodCase).concat([badCase]), library).launch, true);
  assert.equal(runGate(Array(8).fill(goodCase).concat([badCase, badCase]), library).launch, false);

  // ---- SEO ----
  const cfg = { ...SITE_DEFAULTS, baseUrl: "https://www.example-domain.com.au", reviewer: { name: "Test Reviewer", credential: "Diploma of Work Health and Safety" }, tradePhotos: { roofers: true } };
  TRADES[0].reviewed = true; // simulate the founder approving the roofer page
  const pages = buildSite(library, cfg);
  TRADES[0].reviewed = false;
  const paths = pages.map((p) => p.path);
  assert.ok(paths.includes("swms/index.html"));
  assert.ok(paths.includes("swms/working-at-heights/index.html"));
  assert.ok(paths.includes("swms-for/roofers/index.html"));
  assert.ok(!paths.some((p) => p.includes("electrical"))); // specialist review missing
  assert.ok(!paths.includes("swms-for/plumbers/index.html")); // intro not reviewed
  const errors = lintPages(pages, cfg, ["lorem ipsum"]);
  assert.deepEqual(errors, [], errors.join("\n"));
  assert.ok(lintPages(buildSite(library), SITE_DEFAULTS).some((e) => e.includes("PASTE_"))); // placeholders block launch
  const ld = pages.find((p) => p.path === "swms/working-at-heights/index.html")!.body;
  assert.ok(ld.includes('"reviewedBy"') && ld.includes('"FAQPage"') && ld.includes('"BreadcrumbList"'));
  assert.ok(pages.find((p) => p.path === "sitemap.xml")!.body.includes("/swms/working-at-heights/"));
  const roofPage = pages.find((p) => p.path === "swms-for/roofers/index.html")!.body;
  assert.ok(roofPage.includes('src="/img/trades/roofers.webp"') && roofPage.includes("/img/trades/roofers-share.jpg"));
  assert.ok((roofPage.match(/class="tape/g) || []).length >= 3); // hi-vis tape top, divider, bottom
  assert.ok(!pages.find((p) => p.path === "swms/index.html")!.body.includes("<img")); // no photo = nothing broken

  // ---- Company paperwork access ----
  const acc = new CompanyAccess(defaultNotice("Acme Roofing"), "co1");
  acc.grant("owner1", "owner", "owner1", "2026-10-01");
  acc.grant("dave", "worker", "owner1", "2026-10-01");
  assert.equal(acc.canUseForm("dave", labelled).reason, "accept-notice"); // notice first
  acc.acceptNotice("dave", "2026-10-02");
  assert.ok(acc.canUseForm("dave", labelled).ok);
  assert.ok(acc.canUseForm("stranger", GENERIC_SWMS).ok); // our template is free for everyone
  assert.equal(acc.canUseForm("stranger", labelled).reason, "not-member");
  assert.equal(acc.canDownloadBlank("dave"), false);
  assert.equal(acc.canDownloadBlank("owner1"), true);
  acc.updateNotice(defaultNotice("Acme Roofing", 2));
  assert.equal(acc.canUseForm("dave", labelled).reason, "accept-notice"); // changed notice, accept again
  acc.acceptNotice("dave", "2026-10-03");
  assert.throws(() => acc.remove("dave", "dave", "2026-10-20", [], "owner1")); // workers can't remove
  const daveDraft = { ...newDraft(labelled, "Dave's draft"), ownerId: "dave" };
  const out = acc.remove("dave", "owner1", "2026-10-20", [daveDraft], "owner1");
  assert.equal(out.transferred[0].ownerId, "owner1"); // no work lost
  assert.equal(acc.canUseForm("dave", labelled).reason, "removed");
  assert.ok(verifyStamp(vault, stampDave, swms.contentHash)); // past signed records untouched
  assert.ok(acc.log.some((l) => l.event === "removed" && l.userId === "dave"));
  for (const line of [out.messageForPerson, out.messageForOwner]) for (const b of TONE_BANNED) assert.ok(!line.toLowerCase().includes(b), line);
  acc.grant("dave", "worker", "owner1", "2026-11-01");
  assert.ok(acc.canUseForm("dave", labelled).ok); // re-invited: access back
  assert.ok(acc.log.some((l) => l.event === "restored"));
  assert.ok(offlineCopyValid("2026-10-20T00:00:00Z", "2026-10-26T00:00:00Z"));
  assert.ok(!offlineCopyValid("2026-10-20T00:00:00Z", "2026-10-28T00:00:00Z"));
  assert.ok(companyFooter("Acme Roofing").includes("Confidential to Acme Roofing"));

  // ---- Upload advisory (never blocks) ----
  const own = { businessName: "Test Roofing", abn: "51 824 753 556" };
  assert.equal(otherCompanyIn("Company: Test Roofing\nABN 51 824 753 556", own), null);
  const otherCo = otherCompanyIn("Company Name: Big Build Constructions\nABN 12 345 678 901", own);
  assert.equal(otherCo, "Big Build Constructions");
  assert.equal(uploadAdvisory(otherCo!).text, "Heads up: this looks like Big Build Constructions' paperwork. Using it may need their OK. Continue?");
  assert.ok(uploadAdvisory("Acme Roofing").text.includes("Acme Roofing's paperwork"));
  assert.deepEqual(uploadAdvisory("another company").options, ["Continue", "Cancel"]);
  assert.equal(otherCompanyIn("A blank SWMS with no business details", own), null);

  // ---- First-run terms: once, smooth, recorded ----
  const ledger = new TermsLedger();
  const v2vault = new SignatureVault();
  assert.equal(termsPrompt(ledger, "sam"), "first-run");
  assert.equal(ledger.appUnlocked("sam"), false); // locked until signed
  const fr = firstRunSave(v2vault, ledger, { userId: "sam", name: "Sam Taylor", svgPath: SIG, device: "iPhone, Safari", at: "2026-10-25T06:40:00Z" });
  assert.equal(v2vault.current("sam")!.id, fr.signature.id); // same signature saved for everyday use
  assert.ok(ledger.appUnlocked("sam"));
  assert.equal(termsPrompt(ledger, "sam"), "none"); // never again
  firstRunSave(v2vault, ledger, { userId: "sam", name: "Sam Taylor", svgPath: SIG, device: "iPhone", at: "2026-10-26T00:00:00Z" });
  assert.equal(ledger.all().length, 1); // no duplicate records
  const uc = userCopyEmail(fr.acceptance, "https://www.example.com.au");
  assert.ok(uc.text.includes("G'day Sam") && uc.text.includes("version 1"));
  const fs = founderSummary(ledger.since("2026-10-20"), "2026-10-20");
  assert.equal(fs.to, "venture-lab-8grv@agentmail.to");
  assert.ok(fs.subject.includes("1 new sign-up ") && fs.text.includes("Sam Taylor") && !fs.text.includes("M10"));
  // Terms change: one quiet line, once.
  (TERMS as { version: number }).version = 2;
  assert.equal(termsPrompt(ledger, "sam"), "updated");
  firstRunSave(v2vault, ledger, { userId: "sam", name: "Sam Taylor", svgPath: SIG, device: "iPhone", at: "2026-12-01T00:00:00Z", via: "terms-update" });
  assert.equal(termsPrompt(ledger, "sam"), "none");
  (TERMS as { version: number }).version = 1;
  // Light, friendly copy only.
  const firstRunWords = [FIRST_RUN_COPY.heading, ...FIRST_RUN_COPY.lines, FIRST_RUN_COPY.agreeLine, FIRST_RUN_COPY.button, CREW_FIRST_SIGN_LINE, TERMS_UPDATED_COPY.line].join(" ").toLowerCase();
  for (const w of ["waiver", "disclaimer", "liability", "indemn", "hereby", "legal", ...TONE_BANNED]) assert.ok(!firstRunWords.includes(w), w);
  assert.ok(FIRST_RUN_COPY.lines.length <= 2 && FIRST_RUN_COPY.agreeLine.split(" ").length <= 10);

  console.log("All checks passed.");
}
