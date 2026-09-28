export const ASPECTS = [
  {
    id: "graphics",
    label: "Look",
    blurb: "The stylesheet: color, type, and layout.",
  },
  {
    id: "physics",
    label: "Logic",
    blurb: "How the app behaves and what it remembers.",
  },
  {
    id: "motion",
    label: "Interaction",
    blurb: "Clicks, motion, and how controls respond.",
  },
  {
    id: "rules",
    label: "Rules",
    blurb: "What the app allows, counts, and refuses.",
  },
  {
    id: "copy",
    label: "Words",
    blurb: "The page itself: headings, labels, and empty states.",
  },
  {
    id: "sound",
    label: "Sound",
    blurb: "Clicks, tones, and whether the app speaks.",
  },
] as const;

export type AspectId = (typeof ASPECTS)[number]["id"];

export type Field =
  | { key: string; label: string; kind: "range"; min: number; max: number; step: number }
  | { key: string; label: string; kind: "color" }
  | { key: string; label: string; kind: "select"; options: { value: string; label: string }[] }
  | { key: string; label: string; kind: "text"; max: number }
  | { key: string; label: string; kind: "toggle" };

export const FIELDS: Record<AspectId, Field[]> = {
  graphics: [
    { key: "background", label: "Ground", kind: "color" },
    { key: "ink", label: "Ink", kind: "color" },
    { key: "accent", label: "Accent", kind: "color" },
    {
      key: "shape",
      label: "Shape",
      kind: "select",
      options: [
        { value: "orb", label: "Orb" },
        { value: "tile", label: "Tile" },
        { value: "shard", label: "Shard" },
        { value: "ring", label: "Ring" },
      ],
    },
    { key: "glow", label: "Glow", kind: "range", min: 0, max: 1, step: 0.01 },
    { key: "trail", label: "Trail", kind: "range", min: 0, max: 1, step: 0.01 },
  ],
  physics: [
    { key: "gravity", label: "Gravity", kind: "range", min: -800, max: 1600, step: 10 },
    { key: "bounce", label: "Bounce", kind: "range", min: 0, max: 1, step: 0.01 },
    { key: "drag", label: "Drag", kind: "range", min: 0, max: 3, step: 0.01 },
    { key: "wind", label: "Wind", kind: "range", min: -400, max: 400, step: 5 },
  ],
  motion: [
    { key: "count", label: "Count", kind: "range", min: 0, max: 64, step: 1 },
    { key: "size", label: "Size", kind: "range", min: 0.45, max: 2.4, step: 0.01 },
    { key: "spin", label: "Spin", kind: "range", min: 0, max: 6, step: 0.01 },
  ],
  rules: [
    {
      key: "mode",
      label: "Mode",
      kind: "select",
      options: [
        { value: "drift", label: "Drift" },
        { value: "catch", label: "Catch" },
        { value: "dodge", label: "Dodge" },
      ],
    },
    { key: "goal", label: "Goal", kind: "range", min: 3, max: 40, step: 1 },
    { key: "lives", label: "Lives", kind: "range", min: 1, max: 8, step: 1 },
  ],
  copy: [
    { key: "title", label: "Title", kind: "text", max: 42 },
    { key: "hint", label: "Hint", kind: "text", max: 110 },
  ],
  sound: [
    { key: "enabled", label: "Tone", kind: "toggle" },
    { key: "tone", label: "Pitch", kind: "range", min: 80, max: 1200, step: 1 },
    { key: "volume", label: "Volume", kind: "range", min: 0, max: 1, step: 0.01 },
  ],
};

export type GraphicsSpec = {
  background: string;
  ink: string;
  accent: string;
  shape: "orb" | "tile" | "shard" | "ring";
  glow: number;
  trail: number;
};

export type PhysicsSpec = {
  gravity: number;
  bounce: number;
  drag: number;
  wind: number;
};

export type MotionSpec = {
  count: number;
  size: number;
  spin: number;
};

export type RulesSpec = {
  mode: "drift" | "catch" | "dodge";
  goal: number;
  lives: number;
};

export type CopySpec = {
  title: string;
  hint: string;
};

export type SoundSpec = {
  enabled: boolean;
  tone: number;
  volume: number;
};

export type AppSpec = {
  graphics: GraphicsSpec;
  physics: PhysicsSpec;
  motion: MotionSpec;
  rules: RulesSpec;
  copy: CopySpec;
  sound: SoundSpec;
};

export const DEFAULT_SPEC: AppSpec = {
  graphics: {
    background: "#f3efe6",
    ink: "#1c1b19",
    accent: "#3e5160",
    shape: "orb",
    glow: 0,
    trail: 0,
  },
  physics: { gravity: 0, bounce: 0, drag: 0, wind: 0 },
  motion: { count: 0, size: 1, spin: 0 },
  rules: { mode: "drift", goal: 8, lives: 3 },
  copy: { title: "", hint: "" },
  sound: { enabled: false, tone: 220, volume: 0 },
};

export const PROMPTS: Record<AspectId, string[]> = {
  graphics: ["Make the page quieter, more paper, less decoration", "Use a dark ground and pale type"],
  physics: ["Remember this list in the browser", "Add undo for the last action"],
  motion: ["Make the main button respond when pressed", "Animate the item that was just added"],
  rules: ["Refuse empty items", "Cap the list at twenty"],
  copy: ["Rewrite the heading and the empty state", "Make the button say Add"],
  sound: ["Play a soft click when something is added", "Turn sounds off"],
};

const ASPECT_SET = new Set<string>(ASPECTS.map((aspect) => aspect.id));

export function isAspect(value: unknown): value is AspectId {
  return typeof value === "string" && ASPECT_SET.has(value);
}

export function aspectLabel(id: AspectId | null | undefined): string {
  return ASPECTS.find((aspect) => aspect.id === id)?.label ?? "Role";
}

export function filesForRoles(roles: AspectId[]): Array<"index.html" | "styles.css" | "app.js"> {
  const files = new Set<"index.html" | "styles.css" | "app.js">();
  for (const role of roles) {
    if (role === "copy") files.add("index.html");
    else if (role === "graphics") files.add("styles.css");
    else files.add("app.js");
  }
  return (["index.html", "styles.css", "app.js"] as const).filter((file) => files.has(file));
}

export function aspectGuide(aspect: AspectId): string {
  return FIELDS[aspect]
    .map((field) => {
      if (field.kind === "range") return `${field.key}: number from ${field.min} to ${field.max}`;
      if (field.kind === "select") {
        return `${field.key}: one of ${field.options.map((option) => option.value).join(", ")}`;
      }
      if (field.kind === "color") return `${field.key}: #rrggbb color`;
      if (field.kind === "toggle") return `${field.key}: true or false`;
      return `${field.key}: short text, at most ${field.max} characters`;
    })
    .join("\n");
}

function cleanText(value: string, max: number): string {
  return value.replace(/[\u0000-\u001f]/g, "").trim().replace(/\s+/g, " ").slice(0, max);
}

function coerce(field: Field, value: unknown): unknown {
  if (field.kind === "range") {
    const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
    if (!Number.isFinite(number)) return undefined;
    const clamped = Math.min(field.max, Math.max(field.min, number));
    const steps = Math.round((clamped - field.min) / field.step);
    return Math.min(field.max, Math.max(field.min, field.min + steps * field.step));
  }
  if (field.kind === "color") {
    if (typeof value !== "string") return undefined;
    const hex = value.trim().toLowerCase();
    return /^#[0-9a-f]{6}$/.test(hex) ? hex : undefined;
  }
  if (field.kind === "select") {
    return typeof value === "string" && field.options.some((option) => option.value === value)
      ? value
      : undefined;
  }
  if (field.kind === "toggle") {
    if (typeof value === "boolean") return value;
    if (value === "true" || value === 1) return true;
    if (value === "false" || value === 0) return false;
    return undefined;
  }
  if (typeof value !== "string") return undefined;
  return cleanText(value, field.max);
}

function sliceOf<T>(aspect: AspectId, value: unknown): T {
  const base = { ...DEFAULT_SPEC[aspect] } as Record<string, unknown>;
  const raw = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  for (const field of FIELDS[aspect]) {
    if (!(field.key in raw)) continue;
    const next = coerce(field, raw[field.key]);
    if (next !== undefined) base[field.key] = next;
  }
  return base as T;
}

export function readSpec(value: unknown): AppSpec {
  let raw = value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw) as unknown;
    } catch {
      raw = {};
    }
  }
  const src = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    graphics: sliceOf<GraphicsSpec>("graphics", src.graphics),
    physics: sliceOf<PhysicsSpec>("physics", src.physics),
    motion: sliceOf<MotionSpec>("motion", src.motion),
    rules: sliceOf<RulesSpec>("rules", src.rules),
    copy: sliceOf<CopySpec>("copy", src.copy),
    sound: sliceOf<SoundSpec>("sound", src.sound),
  };
}

function formatValue(field: Field, value: unknown): string {
  if (field.kind === "range") {
    const number = Number(value);
    return field.step < 1 ? number.toFixed(2) : String(Math.round(number));
  }
  if (field.kind === "toggle") return value ? "on" : "off";
  if (field.kind === "text") return `“${String(value)}”`;
  return String(value);
}

export function projectSlice(
  spec: AppSpec,
  aspect: AspectId,
  patch: unknown,
): { slice: AppSpec[AspectId]; summary: string } {
  let raw: unknown = patch;
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const record = raw as Record<string, unknown>;
    if (record[aspect] && typeof record[aspect] === "object") raw = record[aspect];
  }
  const merged =
    raw && typeof raw === "object"
      ? { ...(spec[aspect] as object), ...(raw as object) }
      : spec[aspect];
  const next = readSpec({ ...spec, [aspect]: merged })[aspect];
  const before = spec[aspect] as Record<string, unknown>;
  const after = next as Record<string, unknown>;
  const parts: string[] = [];
  for (const field of FIELDS[aspect]) {
    if (before[field.key] !== after[field.key]) {
      parts.push(`${field.label} ${formatValue(field, after[field.key])}`);
    }
  }
  return { slice: next, summary: parts.join(" · ") };
}

export function foreignKeys(aspect: AspectId, patch: unknown): string[] {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return [];
  const found = new Set<string>();
  const visit = (record: Record<string, unknown>) => {
    for (const key of Object.keys(record)) {
      if (isAspect(key) && key !== aspect) {
        found.add(key);
        continue;
      }
      for (const other of ASPECTS) {
        if (other.id === aspect) continue;
        if (FIELDS[other.id].some((field) => field.key === key)) found.add(key);
      }
    }
  };
  const record = patch as Record<string, unknown>;
  visit(record);
  if (record[aspect] && typeof record[aspect] === "object") {
    visit(record[aspect] as Record<string, unknown>);
  }
  return [...found];
}

export function overlay(spec: AppSpec, aspect: AspectId | null, draft: Record<string, unknown> | null): AppSpec {
  if (!aspect || !draft) return spec;
  return readSpec({ ...spec, [aspect]: { ...spec[aspect], ...draft } });
}

export function overlayReach(spec: AppSpec, draft: Record<string, unknown> | null): AppSpec {
  if (!draft) return spec;
  const next: Record<string, unknown> = { ...spec };
  for (const aspect of ASPECTS) {
    const extra: Record<string, unknown> = {};
    let hit = false;
    for (const field of FIELDS[aspect.id]) {
      if (!(field.key in draft)) continue;
      extra[field.key] = draft[field.key];
      hit = true;
    }
    if (hit) next[aspect.id] = { ...(spec[aspect.id] as object), ...extra };
  }
  return readSpec(next);
}

export type Seat = {
  aspect: AspectId;
  displayName: string;
  online: boolean;
  mine: boolean;
};

export type ChatMessage = {
  id: number;
  kind: "human" | "bot" | "note" | "system";
  aspect: AspectId | null;
  displayName: string;
  body: string;
  mine: boolean;
  createdMs: number;
};

export type RoomSnapshot = {
  code: string;
  name: string;
  revision: number;
  bundleRevision: number;
  bundleLabel: string | null;
  spec: AppSpec;
  you: AspectId;
  seats: Seat[];
  messages: ChatMessage[];
  reach: AspectId[];
  dutyBrief: string | null;
  admin: boolean;
  canDelete: boolean;
};

export type RoomListItem = {
  code: string;
  name: string;
  blurb: string;
  aspect: AspectId;
  revision: number;
  canDelete: boolean;
};

export type AccountDuty = {
  email: string;
  brief: string;
  allowed: AspectId[];
};

export type BotGrants = Record<AspectId, AspectId[]>;

export function defaultGrants(): BotGrants {
  const grants = {} as BotGrants;
  for (const aspect of ASPECTS) grants[aspect.id] = [aspect.id];
  return grants;
}

export function normalizeGrants(value: unknown): BotGrants | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const next = {} as BotGrants;
  for (const aspect of ASPECTS) {
    const raw = record[aspect.id];
    if (!Array.isArray(raw)) return null;
    const picked = new Set<AspectId>();
    for (const item of raw) {
      if (!isAspect(item)) return null;
      picked.add(item);
    }
    next[aspect.id] = ASPECTS.map((item) => item.id).filter((id) => picked.has(id));
  }
  return next;
}

export function parseGrants(value: unknown): BotGrants {
  let raw = value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw) as unknown;
    } catch {
      return defaultGrants();
    }
  }
  return normalizeGrants(raw) ?? defaultGrants();
}

export function describeGrant(allowed: AspectId[]): string {
  const labels = allowed.map((id) => aspectLabel(id).toLowerCase());
  if (labels.length === 0) return "nothing";
  if (labels.length === 1) return labels[0] ?? "nothing";
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels.at(-1)}`;
}

export function benchBlurb(seat: AspectId, reach: AspectId[], brief: string | null): string {
  const own = aspectLabel(seat).toLowerCase();
  if (brief) {
    if (reach.length === 0) return `“${brief}” This account cannot change the app.`;
    return `“${brief}”`;
  }
  if (reach.length === 1 && reach[0] === seat) {
    return `Your Grok can change the ${own} role only.`;
  }
  if (reach.length === 0) return "This account cannot change the app.";
  if (reach.length === ASPECTS.length) return "You can change every role in the app.";
  return `Your roles: ${describeGrant(reach)}. Your Grok can edit those parts of the app.`;
}

const DUTY_WORDS: Record<string, AspectId> = {
  graphic: "graphics",
  graphics: "graphics",
  color: "graphics",
  colors: "graphics",
  colour: "graphics",
  colours: "graphics",
  glow: "graphics",
  trail: "graphics",
  shape: "graphics",
  ink: "graphics",
  ground: "graphics",
  look: "graphics",
  visual: "graphics",
  visuals: "graphics",
  physics: "physics",
  gravity: "physics",
  bounce: "physics",
  drag: "physics",
  wind: "physics",
  motion: "motion",
  spin: "motion",
  size: "motion",
  count: "motion",
  bodies: "motion",
  rules: "rules",
  rule: "rules",
  mode: "rules",
  lives: "rules",
  goal: "rules",
  score: "rules",
  catch: "rules",
  dodge: "rules",
  drift: "rules",
  copy: "copy",
  title: "copy",
  hint: "copy",
  wording: "copy",
  words: "copy",
  logic: "physics",
  code: "physics",
  behavior: "physics",
  behaviour: "physics",
  script: "physics",
  javascript: "physics",
  js: "physics",
  style: "graphics",
  styles: "graphics",
  css: "graphics",
  design: "graphics",
  layout: "graphics",
  interaction: "motion",
  animation: "motion",
  click: "motion",
  clicks: "motion",
  text: "copy",
  writing: "copy",
  page: "copy",
  heading: "copy",
  sound: "sound",
  audio: "sound",
  tone: "sound",
  pitch: "sound",
  volume: "sound",
};

export function cleanEmail(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const email = input.trim().toLowerCase();
  if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  return email;
}

export function parseDuty(input: string): { brief: string; allowed: AspectId[] } | { error: string } {
  const brief = input.replace(/[\u0000-\u001f]/g, " ").trim().replace(/\s+/g, " ").slice(0, 400);
  if (!brief) return { error: "Type what this account can do." };
  const lower = brief.toLowerCase();
  const found = new Set<AspectId>();
  for (const word of lower.split(/[^a-z]+/)) {
    const aspect = DUTY_WORDS[word];
    if (aspect) found.add(aspect);
  }
  if (found.size > 0) {
    return { brief, allowed: ASPECTS.map((aspect) => aspect.id).filter((id) => found.has(id)) };
  }
  if (/\b(everything|anything)\b/.test(lower) || /\b(all|every) (crafts?|roles?)\b/.test(lower) || /^(all|every)$/.test(lower)) {
    return { brief, allowed: ASPECTS.map((aspect) => aspect.id) };
  }
  if (/\b(nothing|none)\b/.test(lower) || /\b(can'?t|cannot) change\b/.test(lower)) {
    return { brief, allowed: [] };
  }
  return {
    error: "Name one or more roles: look, logic, interaction, rules, words, sound. Or type everything, or nothing.",
  };
}

export type GrantedWrite = {
  aspect: AspectId;
  slice: AppSpec[AspectId];
  summary: string;
};

function fieldOwner(key: string): AspectId | null {
  for (const aspect of ASPECTS) {
    if (FIELDS[aspect.id].some((field) => field.key === key)) return aspect.id;
  }
  return null;
}

function takeFields(
  aspect: AspectId,
  raw: unknown,
  buckets: Partial<Record<AspectId, Record<string, unknown>>>,
) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return;
  const dest = (buckets[aspect] ??= {});
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (FIELDS[aspect].some((field) => field.key === key)) dest[key] = value;
  }
}

export function applyGrantedPatch(
  spec: AppSpec,
  allowed: AspectId[],
  patch: unknown,
): { writes: GrantedWrite[]; refused: AspectId[] } {
  const allowedSet = new Set(allowed);
  const buckets: Partial<Record<AspectId, Record<string, unknown>>> = {};
  const refused = new Set<AspectId>();

  const claim = (aspect: AspectId, raw: unknown) => {
    if (!allowedSet.has(aspect)) {
      refused.add(aspect);
      return;
    }
    takeFields(aspect, raw, buckets);
  };

  if (patch && typeof patch === "object" && !Array.isArray(patch)) {
    const record = patch as Record<string, unknown>;
    const nested = Object.keys(record).filter(isAspect);
    const flat: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(record)) {
      if (isAspect(key)) claim(key, value);
      else flat[key] = value;
    }
    if (nested.length === 0 || Object.keys(flat).length > 0) {
      for (const [key, value] of Object.entries(flat)) {
        const owner = fieldOwner(key);
        if (!owner) continue;
        claim(owner, { [key]: value });
      }
    }
  }

  const writes: GrantedWrite[] = [];
  for (const aspect of ASPECTS) {
    const raw = buckets[aspect.id];
    if (!raw || Object.keys(raw).length === 0) continue;
    const projected = projectSlice(spec, aspect.id, raw);
    if (!projected.summary) continue;
    writes.push({ aspect: aspect.id, slice: projected.slice, summary: projected.summary });
  }
  return { writes, refused: [...refused] };
}

export function specWithWrites(spec: AppSpec, writes: GrantedWrite[]): AppSpec {
  const next: AppSpec = { ...spec };
  for (const write of writes) {
    if (write.aspect === "graphics") next.graphics = write.slice as GraphicsSpec;
    else if (write.aspect === "physics") next.physics = write.slice as PhysicsSpec;
    else if (write.aspect === "motion") next.motion = write.slice as MotionSpec;
    else if (write.aspect === "rules") next.rules = write.slice as RulesSpec;
    else if (write.aspect === "copy") next.copy = write.slice as CopySpec;
    else next.sound = write.slice as SoundSpec;
  }
  return next;
}

