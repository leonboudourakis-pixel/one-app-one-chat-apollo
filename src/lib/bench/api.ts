import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";
import { authMiddleware } from "@/lib/auth/middleware";
import { validatePacked } from "@/lib/bench/files";
import {
  ASPECTS,
  DEFAULT_SPEC,
  applyGrantedPatch,
  aspectGuide,
  aspectLabel,
  cleanEmail,
  describeGrant,
  filesForRoles,
  isAspect,
  parseDuty,
  readSpec,
  specWithWrites,
  type AccountDuty,
  type AspectId,
  type ChatMessage,
  type GrantedWrite,
  type RoomListItem,
  type RoomSnapshot,
  type Seat,
} from "@/lib/bench/model";

type Sql = Awaited<ReturnType<typeof getSql>>;

function fail(error: string) {
  return { ok: false as const, error };
}

function isUnique(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /duplicate|unique|23505/i.test(message);
}

const ADMIN_EMAIL = "apollo.liuboudourakis@gmail.com";

async function callerEmail(sql: Sql, userId: string): Promise<string> {
  const rows = await sql<{ email: string | null }>`
    select "email" from "user" where "id" = ${userId}
  `;
  return (rows[0]?.email ?? "").trim().toLowerCase();
}

async function callerIsAdmin(sql: Sql, userId: string): Promise<boolean> {
  return (await callerEmail(sql, userId)) === ADMIN_EMAIL;
}

function readAllowed(value: unknown): AspectId[] {
  let raw = value;
  if (typeof raw === "string") {
    try {
      raw = JSON.parse(raw) as unknown;
    } catch {
      return [];
    }
  }
  if (!Array.isArray(raw)) return [];
  const picked = new Set(raw.filter(isAspect));
  return ASPECTS.map((aspect) => aspect.id).filter((id) => picked.has(id));
}

async function loadDuty(sql: Sql, email: string): Promise<AccountDuty | null> {
  if (!email) return null;
  const rows = await sql<{ email: string; brief: string; allowed: unknown }>`
    select email, brief, allowed from account_duties where email = ${email}
  `;
  const row = rows[0];
  if (!row) return null;
  return { email: row.email, brief: row.brief, allowed: readAllowed(row.allowed) };
}

async function accountReach(
  sql: Sql,
  userId: string,
  seat: AspectId,
): Promise<{ reach: AspectId[]; brief: string | null }> {
  const email = await callerEmail(sql, userId);
  if (email === ADMIN_EMAIL) {
    return { reach: ASPECTS.map((aspect) => aspect.id), brief: null };
  }
  const duty = await loadDuty(sql, email);
  if (!duty) return { reach: [seat], brief: null };
  return { reach: duty.allowed, brief: duty.brief };
}

async function listDuties(sql: Sql): Promise<AccountDuty[]> {
  const rows = await sql<{ email: string; brief: string; allowed: unknown }>`
    select email, brief, allowed from account_duties order by email
  `;
  return rows.map((row) => ({ email: row.email, brief: row.brief, allowed: readAllowed(row.allowed) }));
}

function asBool(value: unknown): boolean {
  return value === true || value === "t" || value === "true" || value === 1;
}

function normalizeCode(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const code = input.trim().toUpperCase();
  return /^[A-Z0-9]{6}$/.test(code) ? code : null;
}

function cleanLine(input: unknown, max: number, fallback = ""): string {
  if (typeof input !== "string") return fallback;
  const cleaned = input.replace(/[\u0000-\u001f]/g, " ").trim().replace(/\s+/g, " ").slice(0, max);
  return cleaned || fallback;
}

function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  let code = "";
  for (const byte of bytes) code += alphabet[byte % alphabet.length];
  return code;
}

async function displayName(sql: Sql, userId: string): Promise<string> {
  const rows = await sql<{ name: string | null; email: string | null }>`
    select "name", "email" from "user" where "id" = ${userId}
  `;
  const row = rows[0];
  const base = cleanLine(row?.name, 32) || cleanLine(row?.email?.split("@")[0], 32);
  return base || "Member";
}

type Member = {
  room_id: string;
  code: string;
  name: string;
  spec: unknown;
  revision: number;
  bundle_revision: number;
  bundle_label: string | null;
  aspect: string;
  display_name: string;
  owner_id: string;
};

async function loadMember(sql: Sql, code: string, userId: string): Promise<Member | null> {
  const rows = await sql<Member>`
    select r.id as room_id, r.code, r.name, r.spec, r.revision, r.owner_id,
           r.bundle_revision, r.bundle_label, m.aspect, m.display_name
    from rooms r
    join room_members m on m.room_id = r.id and m.user_id = ${userId}
    where r.code = ${code}
  `;
  return rows[0] ?? null;
}

async function peekRoom(sql: Sql, code: string): Promise<{ name: string; taken: AspectId[] } | null> {
  const rooms = await sql<{ id: string; name: string }>`
    select id, name from rooms where code = ${code}
  `;
  const room = rooms[0];
  if (!room) return null;
  const takenRows = await sql<{ aspect: string }>`
    select aspect from room_members where room_id = ${room.id}
  `;
  return { name: room.name, taken: takenRows.map((row) => row.aspect).filter(isAspect) };
}

function mapMessage(row: {
  id: unknown;
  kind: string;
  aspect: string | null;
  display_name: string;
  body: string;
  mine: unknown;
  created_ms: unknown;
}): ChatMessage | null {
  if (row.kind !== "human" && row.kind !== "bot" && row.kind !== "note" && row.kind !== "system") {
    return null;
  }
  return {
    id: Number(row.id),
    kind: row.kind,
    aspect: isAspect(row.aspect) ? row.aspect : null,
    displayName: row.display_name,
    body: row.body,
    mine: asBool(row.mine),
    createdMs: Number(row.created_ms) || 0,
  };
}

async function snapshot(sql: Sql, member: Member, userId: string, afterId: number): Promise<RoomSnapshot | null> {
  await sql`
    update room_members set last_seen = now()
    where room_id = ${member.room_id} and user_id = ${userId}
  `;
  const fresh = await loadMember(sql, member.code, userId);
  if (!fresh || !isAspect(fresh.aspect)) return null;
  const seatRows = await sql<{
    aspect: string;
    display_name: string;
    online: unknown;
    mine: unknown;
  }>`
    select aspect, display_name,
           (last_seen > now() - interval '12 seconds') as online,
           (user_id = ${userId}) as mine
    from room_members
    where room_id = ${fresh.room_id}
  `;
  const seats: Seat[] = ASPECTS.flatMap((aspect) => {
    const row = seatRows.find((seat) => seat.aspect === aspect.id);
    if (!row || !isAspect(row.aspect)) return [];
    return [{
      aspect: row.aspect,
      displayName: row.display_name,
      online: asBool(row.online),
      mine: asBool(row.mine),
    }];
  });
  const messageRows = await sql<{
    id: unknown;
    kind: string;
    aspect: string | null;
    display_name: string;
    body: string;
    mine: unknown;
    created_ms: unknown;
  }>`
    select id::int as id, kind, aspect, display_name, body, mine, created_ms
    from (
      select id, kind, aspect, display_name, body,
             (user_id = ${userId}) as mine,
             (extract(epoch from created_at) * 1000)::bigint as created_ms
      from room_messages
      where room_id = ${fresh.room_id} and id > ${afterId}
      order by id desc
      limit 80
    ) recent
    order by id asc
  `;
  const seated = fresh.aspect;
  const access = await accountReach(sql, userId, seated);
  const admin = await callerIsAdmin(sql, userId);
  return {
    code: fresh.code,
    name: fresh.name,
    revision: Number(fresh.revision) || 1,
    bundleRevision: Number(fresh.bundle_revision) || 0,
    bundleLabel: fresh.bundle_label,
    spec: readSpec(fresh.spec),
    you: seated,
    seats,
    messages: messageRows.flatMap((row) => {
      const message = mapMessage(row);
      return message ? [message] : [];
    }),
    reach: access.reach,
    dutyBrief: access.brief,
    admin,
    canDelete: fresh.owner_id === userId || admin,
  };
}

async function note(sql: Sql, member: Member, userId: string, kind: string, body: string) {
  await sql`
    insert into room_messages (room_id, user_id, display_name, kind, aspect, body)
    values (${member.room_id}, ${userId}, ${member.display_name}, ${kind}, ${member.aspect}, ${body})
  `;
}

const aiGate = globalThis as typeof globalThis & { __splitbenchAi?: Map<string, number> };

async function askCraft(input: {
  userId: string;
  aspect: AspectId;
  allowed: AspectId[];
  brief: string | null;
  spec: ReturnType<typeof readSpec>;
  seats: Seat[];
  body: string;
}): Promise<{ say: string; writes: GrantedWrite[] }> {
  const label = aspectLabel(input.aspect);
  const reach = describeGrant(input.allowed);
  const written = input.brief ? ` The admin wrote: “${input.brief}”.` : "";
  if (input.allowed.length === 0) {
    return {
      say: `This account cannot change the piece.${written}`,
      writes: [],
    };
  }
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    return {
      say: `Grok is not available right now. Your ${label} bench still works, and this bot can change ${reach}.`,
      writes: [],
    };
  }
  const map = (aiGate.__splitbenchAi ??= new Map());
  const now = Date.now();
  if (now - (map.get(input.userId) ?? 0) < 2500) {
    return { say: "Give your Grok a moment, then ask again.", writes: [] };
  }
  map.set(input.userId, now);
  const roster = input.seats.map((seat) => `${aspectLabel(seat.aspect)}: ${seat.displayName}`).join("; ");
  const guide = input.allowed.map((aspect) => `${aspectLabel(aspect)}\n${aspectGuide(aspect)}`).join("\n");
  const current = Object.fromEntries(input.allowed.map((aspect) => [aspect, input.spec[aspect]]));
  const payload: Record<string, unknown> = {
    model: "grok-4.5",
    temperature: 0.3,
    max_tokens: 500,
    reasoning_effort: "high",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are the ${label} craft bot in Splitbench, a shared room building one small live piece.
${input.brief ? `The admin typed this for the signed-in account. Obey it: ${input.brief}` : "No extra note was typed for this account. Stay inside the fields below."}
You may change ONLY these fields:
${guide}
Do not change anything else. Other seats: ${roster}.
If the request is outside that, refuse in say and set patch to null.
Reply with JSON only: {"say":"one or two short sentences","patch":{"${input.allowed[0]}":{field:value}} or null}
Include only crafts you are changing, keyed by craft id.`,
      },
      {
        role: "user",
        content: `Values you may change:\n${JSON.stringify(current)}\nPiece for context, read only:\n${JSON.stringify(input.spec)}\nRequest:\n${input.body}`,
      },
    ],
  };
  const call = (body: Record<string, unknown>) =>
    fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });
  try {
    let response = await call(payload);
    if (response.status === 400 || response.status === 422) {
      delete payload.response_format;
      response = await call(payload);
    }
    if (!response.ok) {
      return { say: `Grok could not answer (${response.status}). Your bench controls still work.`, writes: [] };
    }
    const json = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content ?? "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) {
      return { say: "I couldn't read a change from that. Name one control you were assigned.", writes: [] };
    }
    const parsed = JSON.parse(text.slice(start, end + 1)) as { say?: unknown; patch?: unknown };
    const applied = applyGrantedPatch(input.spec, input.allowed, parsed.patch ?? null);
    const say = cleanLine(parsed.say, 360, "Done.");
    if (!applied.writes.length && applied.refused.length) {
      return {
        say: `That sits outside what I was assigned. I can change ${reach}.`,
        writes: [],
      };
    }
    return { say, writes: applied.writes };
  } catch {
    return { say: "Grok could not be reached. Your bench controls still work.", writes: [] };
  }
}

export const listRooms = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }): Promise<{ ok: true; rooms: RoomListItem[] } | { ok: false; error: string }> => {
    const sql = await getSql();
    const admin = await callerIsAdmin(sql, context.userId);
    const rows = await sql<{ code: string; name: string; blurb: string | null; aspect: string; revision: number; owner: unknown }>`
      select r.code, r.name, r.blurb, m.aspect, r.revision,
             (r.owner_id = ${context.userId}) as owner
      from room_members m
      join rooms r on r.id = m.room_id
      where m.user_id = ${context.userId}
      order by r.created_at desc
    `;
    return {
      ok: true,
      rooms: rows.flatMap((row) =>
        isAspect(row.aspect)
          ? [{
              code: row.code,
              name: row.name,
              blurb: row.blurb ?? "",
              aspect: row.aspect,
              revision: Number(row.revision) || 1,
              canDelete: asBool(row.owner) || admin,
            }]
          : [],
      ),
    };
  });

export const deleteRoom = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { code?: string }) => data)
  .handler(async ({ context, data }) => {
    const code = normalizeCode(data.code);
    if (!code) return fail("Missing project.");
    const sql = await getSql();
    const rows = await sql<{ id: string; owner_id: string }>`
      select id, owner_id from rooms where code = ${code}
    `;
    const room = rows[0];
    if (!room) return fail("That project is already gone.");
    if (room.owner_id !== context.userId && !(await callerIsAdmin(sql, context.userId))) {
      return fail("Only the owner can delete this project.");
    }
    await sql`delete from rooms where id = ${room.id}`;
    return { ok: true as const };
  });

export const createRoom = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { name?: string; aspect?: string; blurb?: string }) => data)
  .handler(async ({ context, data }) => {
    if (!isAspect(data.aspect) && data.aspect) return fail("Pick a craft before creating a project.");
    const aspect = isAspect(data.aspect) ? data.aspect : "graphics";
    const name = cleanLine(data.name, 48, "Untitled");
    const blurb = cleanLine(data.blurb, 160, "");
    const sql = await getSql();
    const who = await displayName(sql, context.userId);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const code = makeCode();
      const id = crypto.randomUUID();
      try {
        await sql`
          with new_room as (
            insert into rooms (id, code, name, blurb, owner_id, spec)
            values (${id}, ${code}, ${name}, ${blurb}, ${context.userId}, ${JSON.stringify(DEFAULT_SPEC)}::jsonb)
            returning id
          ),
          new_member as (
            insert into room_members (room_id, user_id, display_name, aspect)
            select id, ${context.userId}, ${who}, ${aspect} from new_room
            returning room_id
          )
          insert into room_messages (room_id, user_id, display_name, kind, aspect, body)
          select room_id, ${context.userId}, ${who}, 'system', ${aspect},
                 ${"Blank project. Type what to build, or share the code."}
          from new_member
        `;
        return { ok: true as const, code };
      } catch (err) {
        if (isUnique(err) && attempt < 3) continue;
        throw err;
      }
    }
    return fail("Could not create the project. Try again.");
  });

async function askApp(input: {
  userId: string;
  prompt: string;
  allowed: Array<"index.html" | "styles.css" | "app.js">;
  current: Map<string, string>;
}): Promise<{ say: string; name: string; html: string; css: string; js: string } | { say: string; name: string; html: ""; css: ""; js: "" }> {
  const empty = { say: "", name: "", html: "" as const, css: "" as const, js: "" as const };
  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) return { ...empty, say: "Grok is not available, so no app was written." };
  const map = (aiGate.__splitbenchAi ??= new Map());
  const now = Date.now();
  if (now - (map.get(input.userId) ?? 0) < 2500) {
    return { ...empty, say: "Give Grok a moment, then try again." };
  }
  map.set(input.userId, now);
  const clip = (value: string) => value.slice(0, 6000);
  const keys = input.allowed.map((file) => (file === "index.html" ? "html" : file === "styles.css" ? "css" : "js")).join(", ");
  const payload: Record<string, unknown> = {
    model: "grok-4.5",
    temperature: 0.4,
    reasoning_effort: "high",
    max_tokens: 16000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You write a small real web app that runs alone in a sandboxed iframe.
Vanilla HTML, CSS, and JavaScript only. No npm, no build step, no external scripts or stylesheets.
Build the thing the person asked for. A list must add and remove items. A timer must start and stop. A calculator must compute.
Do not make a canvas of falling tiles, or a page that only changes colors, unless they asked for that.
You may write only these JSON keys: ${keys}.
html is index.html, css is styles.css, js is app.js.
Return JSON only: {"name":"2 to 4 words","say":"one short sentence","html":"","css":"","js":""}
When you write html, link styles.css and app.js with relative paths. Keep the page usable on a phone.`,
      },
      {
        role: "user",
        content: `Request:\n${input.prompt}\n\nCurrent index.html:\n${clip(input.current.get("index.html") ?? "")}\n\nCurrent styles.css:\n${clip(input.current.get("styles.css") ?? "")}\n\nCurrent app.js:\n${clip(input.current.get("app.js") ?? "")}`,
      },
    ],
  };
  const call = (body: Record<string, unknown>) =>
    fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });
  try {
    let response = await call(payload);
    if (response.status === 400 || response.status === 422) {
      delete payload.response_format;
      response = await call(payload);
    }
    if (!response.ok) return { ...empty, say: `Grok could not build that (${response.status}).` };
    const json = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = json.choices?.[0]?.message?.content ?? "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end <= start) return { ...empty, say: "I couldn't read an app from that. Name what it should do." };
    const parsed = JSON.parse(text.slice(start, end + 1)) as { say?: unknown; name?: unknown; html?: unknown; css?: unknown; js?: unknown };
    const take = (value: unknown) => (typeof value === "string" ? value.replace(/\u0000/g, "").slice(0, 50000) : "");
    return {
      say: cleanLine(parsed.say, 360, "Built."),
      name: cleanLine(parsed.name, 48, ""),
      html: input.allowed.includes("index.html") ? take(parsed.html) : "",
      css: input.allowed.includes("styles.css") ? take(parsed.css) : "",
      js: input.allowed.includes("app.js") ? take(parsed.js) : "",
    };
  } catch {
    return { ...empty, say: "Grok could not be reached. Nothing was written." };
  }
}

function readAppFiles(raw: unknown): Map<string, string> {
  const files = new Map<string, string>();
  if (typeof raw !== "string" || !raw) return files;
  try {
    const checked = validatePacked(JSON.parse(raw) as unknown);
    if ("error" in checked) return files;
    for (const file of checked.files) {
      if (file.encoding === "utf8") files.set(file.path, file.data);
    }
  } catch {
    return files;
  }
  return files;
}

function linkedHtml(html: string): string {
  let next = html.trim();
  if (!/<html[\s>]/i.test(next)) {
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>App</title><link rel="stylesheet" href="styles.css"></head><body>${next}<script src="app.js" defer></script></body></html>`;
  }
  if (!/styles\.css/i.test(next) && /<head[^>]*>/i.test(next)) {
    next = next.replace(/<head[^>]*>/i, (open) => `${open}<link rel="stylesheet" href="styles.css">`);
  }
  if (!/app\.js/i.test(next) && /<\/body>/i.test(next)) {
    next = next.replace(/<\/body>/i, `<script src="app.js" defer></script></body>`);
  }
  return next;
}

function packApp(current: Map<string, string>, next: { html: string; css: string; js: string }) {
  const html = linkedHtml(next.html || current.get("index.html") || "");
  const css = next.css || current.get("styles.css") || "body{margin:0;font-family:Georgia,serif;background:#f3efe6;color:#1c1b19}";
  const js = next.js || current.get("app.js") || "";
  return [
    { path: "index.html", mime: "text/html", encoding: "utf8" as const, data: html },
    { path: "styles.css", mime: "text/css", encoding: "utf8" as const, data: css },
    { path: "app.js", mime: "text/javascript", encoding: "utf8" as const, data: js },
  ];
}

export const buildPiece = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { code?: string; prompt?: string }) => data)
  .handler(async ({ context, data }) => {
    const code = normalizeCode(data.code);
    const prompt = cleanLine(data.prompt, 800);
    if (!code || !prompt) return fail("Type what to build.");
    const sql = await getSql();
    const member = await loadMember(sql, code, context.userId);
    if (!member || !isAspect(member.aspect)) return fail("You are not seated in this project.");
    const owners = await sql<{ owner_id: string; bundle: string | null }>`
      select owner_id, bundle from rooms where id = ${member.room_id}
    `;
    const broad = owners[0]?.owner_id === context.userId || (await callerIsAdmin(sql, context.userId));
    const access = await accountReach(sql, context.userId, member.aspect);
    const allowed = filesForRoles(broad ? ASPECTS.map((aspect) => aspect.id) : access.reach);
    if (allowed.length === 0) return fail("This account cannot change the app.");
    const current = readAppFiles(owners[0]?.bundle);
    if (!current.has("index.html") && !allowed.includes("index.html")) {
      return fail("The app is still blank. Someone who can write the page has to build it first.");
    }
    await note(sql, member, context.userId, "human", prompt);
    const answer = await askApp({ userId: context.userId, prompt, allowed, current });
    const wrote = [
      answer.html ? "index.html" : "",
      answer.css ? "styles.css" : "",
      answer.js ? "app.js" : "",
    ].filter(Boolean);
    const say = wrote.length ? answer.say : answer.say || "Nothing in that fit the roles on this account.";
    if (wrote.length) {
      const packed = packApp(current, answer);
      const checked = validatePacked(packed);
      if ("error" in checked) return fail(checked.error);
      await sql`
        update rooms
        set bundle = ${JSON.stringify(checked.files)},
            bundle_label = ${answer.name || "App"},
            bundle_revision = bundle_revision + 1,
            revision = revision + 1,
            name = case when ${answer.name} = '' then name else ${answer.name} end,
            blurb = ${cleanLine(prompt, 160)}
        where id = ${member.room_id}
      `;
      await sql`
        insert into room_messages (room_id, user_id, display_name, kind, aspect, body)
        values (
          ${member.room_id}, ${context.userId}, ${"Build"},
          'note', ${member.aspect}, ${`Wrote ${wrote.join(", ")}.`}
        )
      `;
    }
    await sql`
      insert into room_messages (room_id, user_id, display_name, kind, aspect, body)
      values (
        ${member.room_id}, ${context.userId}, ${"Build"},
        'bot', ${member.aspect}, ${say}
      )
    `;
    const room = await snapshot(sql, member, context.userId, 0);
    if (!room) return fail("The build could not be saved.");
    return { ok: true as const, room };
  });

export const openRoom = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { code?: string; afterId?: number }) => data)
  .handler(async ({ context, data }) => {
    const code = normalizeCode(data.code);
    if (!code) return { ok: true as const, status: "missing" as const };
    const sql = await getSql();
    const member = await loadMember(sql, code, context.userId);
    if (!member) {
      const peek = await peekRoom(sql, code);
      if (!peek) return { ok: true as const, status: "missing" as const };
      return { ok: true as const, status: "join" as const, name: peek.name, taken: peek.taken };
    }
    const room = await snapshot(sql, member, context.userId, Math.max(0, Math.floor(Number(data.afterId) || 0)));
    if (!room) return fail("Your seat could not be read.");
    return { ok: true as const, status: "room" as const, room };
  });

export const joinRoom = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { code?: string; aspect?: string }) => data)
  .handler(async ({ context, data }) => {
    const code = normalizeCode(data.code);
    if (!code || !isAspect(data.aspect)) return fail("Choose a craft and a six-letter code.");
    const sql = await getSql();
    const existing = await loadMember(sql, code, context.userId);
    if (existing) {
      const room = await snapshot(sql, existing, context.userId, 0);
      if (!room) return fail("Your seat could not be read.");
      return { ok: true as const, status: "room" as const, room };
    }
    const found = await sql<{ id: string }>`select id from rooms where code = ${code}`;
    const roomRow = found[0];
    if (!roomRow) return fail("No room uses that code.");
    const who = await displayName(sql, context.userId);
    try {
      await sql`
        insert into room_members (room_id, user_id, display_name, aspect)
        values (${roomRow.id}, ${context.userId}, ${who}, ${data.aspect})
      `;
    } catch (err) {
      if (isUnique(err)) return fail("That craft is already taken.");
      throw err;
    }
    await sql`
      insert into room_messages (room_id, user_id, display_name, kind, aspect, body)
      values (
        ${roomRow.id}, ${context.userId}, ${who}, 'system', ${data.aspect},
        ${`${who} sat down at ${aspectLabel(data.aspect)}.`}
      )
    `;
    const member = await loadMember(sql, code, context.userId);
    if (!member) return fail("Could not join that room.");
    const room = await snapshot(sql, member, context.userId, 0);
    if (!room) return fail("Could not join that room.");
    return { ok: true as const, status: "room" as const, room };
  });

export const moveSeat = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { code?: string; aspect?: string; afterId?: number }) => data)
  .handler(async ({ context, data }) => {
    const code = normalizeCode(data.code);
    if (!code || !isAspect(data.aspect)) return fail("Pick an open craft.");
    const sql = await getSql();
    const member = await loadMember(sql, code, context.userId);
    if (!member) return fail("You are not seated in this room.");
    if (member.aspect !== data.aspect) {
      try {
        await sql`
          update room_members set aspect = ${data.aspect}
          where room_id = ${member.room_id} and user_id = ${context.userId}
        `;
      } catch (err) {
        if (isUnique(err)) return fail("That craft is taken.");
        throw err;
      }
      member.aspect = data.aspect;
      await note(sql, member, context.userId, "system", `${member.display_name} moved to ${aspectLabel(data.aspect)}.`);
    }
    const room = await snapshot(sql, member, context.userId, Math.max(0, Math.floor(Number(data.afterId) || 0)));
    if (!room) return fail("Your seat could not be read.");
    return { ok: true as const, room };
  });

export const patchAspect = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { code?: string; patch?: unknown; afterId?: number }) => data)
  .handler(async ({ context, data }) => {
    const code = normalizeCode(data.code);
    if (!code) return fail("Missing room.");
    const sql = await getSql();
    const member = await loadMember(sql, code, context.userId);
    if (!member || !isAspect(member.aspect)) return fail("You are not seated in this room.");
    const spec = readSpec(member.spec);
    const access = await accountReach(sql, context.userId, member.aspect);
    const applied = applyGrantedPatch(spec, access.reach, data.patch ?? null);
    if (applied.writes.length) {
      const next = specWithWrites(spec, applied.writes);
      const summary = applied.writes.map((write) => `${aspectLabel(write.aspect)}: ${write.summary}`).join(" · ");
      await sql`
        update rooms
        set spec = ${JSON.stringify(next)}::jsonb,
            revision = revision + 1
        where id = ${member.room_id}
      `;
      await note(sql, member, context.userId, "note", summary);
    }
    const room = await snapshot(sql, member, context.userId, Math.max(0, Math.floor(Number(data.afterId) || 0)));
    if (!room) return fail("The piece could not be saved.");
    return { ok: true as const, room };
  });

export const sendChat = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { code?: string; body?: string; afterId?: number }) => data)
  .handler(async ({ context, data }) => {
    const code = normalizeCode(data.code);
    const body = cleanLine(data.body, 800);
    if (!code || !body) return fail("Write a message first.");
    const sql = await getSql();
    const member = await loadMember(sql, code, context.userId);
    if (!member || !isAspect(member.aspect)) return fail("You are not seated in this room.");
    await note(sql, member, context.userId, "human", body);
    const access = await accountReach(sql, context.userId, member.aspect);
    const allowed = filesForRoles(access.reach);
    const stored = await sql<{ bundle: string | null }>`select bundle from rooms where id = ${member.room_id}`;
    const current = readAppFiles(stored[0]?.bundle);
    if (!current.has("index.html")) {
      await sql`
        insert into room_messages (room_id, user_id, display_name, kind, aspect, body)
        values (
          ${member.room_id}, ${context.userId}, ${"Grok"},
          'bot', ${member.aspect}, ${"The app is still blank. Type what to build first."}
        )
      `;
    } else if (allowed.length === 0) {
      await sql`
        insert into room_messages (room_id, user_id, display_name, kind, aspect, body)
        values (
          ${member.room_id}, ${context.userId}, ${"Grok"},
          'bot', ${member.aspect}, ${"This account cannot change the app."}
        )
      `;
    } else {
      const answer = await askApp({
        userId: context.userId,
        prompt: access.brief ? `${body}\nStay inside this note: ${access.brief}` : body,
        allowed,
        current,
      });
      const wrote = [
        answer.html ? "index.html" : "",
        answer.css ? "styles.css" : "",
        answer.js ? "app.js" : "",
      ].filter(Boolean);
      if (wrote.length) {
        const packed = packApp(current, answer);
        const checked = validatePacked(packed);
        if (!("error" in checked)) {
          await sql`
            update rooms
            set bundle = ${JSON.stringify(checked.files)},
                bundle_revision = bundle_revision + 1,
                revision = revision + 1
            where id = ${member.room_id}
          `;
          await sql`
            insert into room_messages (room_id, user_id, display_name, kind, aspect, body)
            values (
              ${member.room_id}, ${context.userId}, ${"Grok"},
              'note', ${member.aspect}, ${`Updated ${wrote.join(", ")}.`}
            )
          `;
        }
      }
      await sql`
        insert into room_messages (room_id, user_id, display_name, kind, aspect, body)
        values (
          ${member.room_id}, ${context.userId}, ${"Grok"},
          'bot', ${member.aspect}, ${answer.say || "I left the app as it was."}
        )
      `;
    }
    const room = await snapshot(sql, member, context.userId, Math.max(0, Math.floor(Number(data.afterId) || 0)));
    if (!room) return fail("The message could not be saved.");
    return { ok: true as const, room };
  });

export const saveBundle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { code?: string; label?: string; files?: unknown }) => data)
  .handler(async ({ context, data }) => {
    const code = normalizeCode(data.code);
    if (!code) return fail("Missing room.");
    const checked = validatePacked(data.files);
    if ("error" in checked) return fail(checked.error);
    const payload = JSON.stringify(checked.files);
    if (payload.length > 1_200_000) return fail("That zip is too large to share in the room.");
    const label = cleanLine(data.label, 80, "site.zip");
    const sql = await getSql();
    const member = await loadMember(sql, code, context.userId);
    if (!member) return fail("You are not seated in this room.");
    const rows = await sql<{ bundle_revision: number }>`
      update rooms
      set bundle = ${payload},
          bundle_label = ${label},
          bundle_revision = bundle_revision + 1
      where id = ${member.room_id}
      returning bundle_revision
    `;
    await note(
      sql,
      member,
      context.userId,
      "system",
      `${member.display_name} dropped ${label}. The site preview updated for everyone here.`,
    );
    return { ok: true as const, bundleRevision: Number(rows[0]?.bundle_revision) || 0, label };
  });

export const clearBundle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { code?: string }) => data)
  .handler(async ({ context, data }) => {
    const code = normalizeCode(data.code);
    if (!code) return fail("Missing room.");
    const sql = await getSql();
    const member = await loadMember(sql, code, context.userId);
    if (!member) return fail("You are not seated in this room.");
    await sql`
      update rooms
      set bundle = null, bundle_label = null, bundle_revision = bundle_revision + 1
      where id = ${member.room_id}
    `;
    await note(sql, member, context.userId, "system", `${member.display_name} cleared the site preview.`);
    return { ok: true as const };
  });

export const getBundle = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { code?: string }) => data)
  .handler(async ({ context, data }) => {
    const code = normalizeCode(data.code);
    if (!code) return fail("Missing room.");
    const sql = await getSql();
    const rows = await sql<{ bundle: string | null; bundle_revision: number; bundle_label: string | null }>`
      select r.bundle, r.bundle_revision, r.bundle_label
      from rooms r
      join room_members m on m.room_id = r.id and m.user_id = ${context.userId}
      where r.code = ${code}
    `;
    const row = rows[0];
    if (!row) return fail("You are not seated in this room.");
    if (!row.bundle) {
      return {
        ok: true as const,
        bundleRevision: Number(row.bundle_revision) || 0,
        label: null,
        files: null,
      };
    }
    try {
      const checked = validatePacked(JSON.parse(row.bundle) as unknown);
      if ("error" in checked) return fail(checked.error);
      return {
        ok: true as const,
        bundleRevision: Number(row.bundle_revision) || 0,
        label: row.bundle_label,
        files: checked.files,
      };
    } catch {
      return fail("The saved site could not be read.");
    }
  });

export const listAccountDuties = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const sql = await getSql();
    const admin = await callerIsAdmin(sql, context.userId);
    if (!admin) return { ok: true as const, admin: false, duties: [] as AccountDuty[] };
    return { ok: true as const, admin: true, duties: await listDuties(sql) };
  });

export const saveAccountDuty = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { email?: string; brief?: string; roles?: string[] }) => data)
  .handler(async ({ context, data }) => {
    const email = cleanEmail(data.email);
    if (!email) return fail("Type a real email for the account.");
    const explicit = [...new Set((data.roles ?? []).filter(isAspect))];
    const typed = typeof data.brief === "string" ? data.brief.trim() : "";
    const parsed = typed ? parseDuty(typed) : null;
    let allowed = explicit;
    if (parsed && !("error" in parsed)) {
      allowed = ASPECTS.map((aspect) => aspect.id).filter((id) => explicit.includes(id) || parsed.allowed.includes(id));
    } else if (explicit.length === 0) {
      return fail(parsed && "error" in parsed ? parsed.error : "Pick at least one role.");
    }
    const brief = cleanLine(typed, 400, allowed.map((id) => aspectLabel(id)).join(", "));
    const sql = await getSql();
    if (!(await callerIsAdmin(sql, context.userId))) {
      return fail("Only the admin can say what an account can do.");
    }
    await sql`
      insert into account_duties (email, brief, allowed)
      values (${email}, ${brief}, ${JSON.stringify(allowed)}::jsonb)
      on conflict (email) do update
      set brief = excluded.brief, allowed = excluded.allowed, updated_at = now()
    `;
    return { ok: true as const, duties: await listDuties(sql) };
  });

export const removeAccountDuty = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((data: { email?: string }) => data)
  .handler(async ({ context, data }) => {
    const email = cleanEmail(data.email);
    if (!email) return fail("Missing account.");
    const sql = await getSql();
    if (!(await callerIsAdmin(sql, context.userId))) {
      return fail("Only the admin can say what an account can do.");
    }
    await sql`delete from account_duties where email = ${email}`;
    return { ok: true as const, duties: await listDuties(sql) };
  });
