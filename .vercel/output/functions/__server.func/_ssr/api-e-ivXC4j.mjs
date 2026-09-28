import { i as validatePacked } from "./files-C7P5IyM5.mjs";
import { a as aspectLabel, d as parseDuty, f as readSpec, i as applyGrantedPatch, l as filesForRoles, n as DEFAULT_SPEC, p as specWithWrites, s as cleanEmail, t as ASPECTS, u as isAspect } from "./model-Drbfu5LE.mjs";
import { i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { r as getSql } from "./db-CfOhnaEv.mjs";
import { t as authMiddleware } from "./middleware-X_sruB8u.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/api-e-ivXC4j.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
function fail(error) {
	return {
		ok: false,
		error
	};
}
function isUnique(err) {
	const message = err instanceof Error ? err.message : String(err);
	return /duplicate|unique|23505/i.test(message);
}
var ADMIN_EMAIL = "apollo.liuboudourakis@gmail.com";
async function callerEmail(sql, userId) {
	return ((await sql`
    select "email" from "user" where "id" = ${userId}
  `)[0]?.email ?? "").trim().toLowerCase();
}
async function callerIsAdmin(sql, userId) {
	return await callerEmail(sql, userId) === ADMIN_EMAIL;
}
function readAllowed(value) {
	let raw = value;
	if (typeof raw === "string") try {
		raw = JSON.parse(raw);
	} catch {
		return [];
	}
	if (!Array.isArray(raw)) return [];
	const picked = new Set(raw.filter(isAspect));
	return ASPECTS.map((aspect) => aspect.id).filter((id) => picked.has(id));
}
async function loadDuty(sql, email) {
	if (!email) return null;
	const row = (await sql`
    select email, brief, allowed from account_duties where email = ${email}
  `)[0];
	if (!row) return null;
	return {
		email: row.email,
		brief: row.brief,
		allowed: readAllowed(row.allowed)
	};
}
async function accountReach(sql, userId, seat) {
	const email = await callerEmail(sql, userId);
	if (email === ADMIN_EMAIL) return {
		reach: ASPECTS.map((aspect) => aspect.id),
		brief: null
	};
	const duty = await loadDuty(sql, email);
	if (!duty) return {
		reach: [seat],
		brief: null
	};
	return {
		reach: duty.allowed,
		brief: duty.brief
	};
}
async function listDuties(sql) {
	return (await sql`
    select email, brief, allowed from account_duties order by email
  `).map((row) => ({
		email: row.email,
		brief: row.brief,
		allowed: readAllowed(row.allowed)
	}));
}
function asBool(value) {
	return value === true || value === "t" || value === "true" || value === 1;
}
function normalizeCode(input) {
	if (typeof input !== "string") return null;
	const code = input.trim().toUpperCase();
	return /^[A-Z0-9]{6}$/.test(code) ? code : null;
}
function cleanLine(input, max, fallback = "") {
	if (typeof input !== "string") return fallback;
	return input.replace(/[\u0000-\u001f]/g, " ").trim().replace(/\s+/g, " ").slice(0, max) || fallback;
}
function makeCode() {
	const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	const bytes = crypto.getRandomValues(/* @__PURE__ */ new Uint8Array(6));
	let code = "";
	for (const byte of bytes) code += alphabet[byte % 32];
	return code;
}
async function displayName(sql, userId) {
	const row = (await sql`
    select "name", "email" from "user" where "id" = ${userId}
  `)[0];
	return cleanLine(row?.name, 32) || cleanLine(row?.email?.split("@")[0], 32) || "Member";
}
async function loadMember(sql, code, userId) {
	return (await sql`
    select r.id as room_id, r.code, r.name, r.spec, r.revision, r.owner_id,
           r.bundle_revision, r.bundle_label, m.aspect, m.display_name
    from rooms r
    join room_members m on m.room_id = r.id and m.user_id = ${userId}
    where r.code = ${code}
  `)[0] ?? null;
}
async function peekRoom(sql, code) {
	const room = (await sql`
    select id, name from rooms where code = ${code}
  `)[0];
	if (!room) return null;
	const takenRows = await sql`
    select aspect from room_members where room_id = ${room.id}
  `;
	return {
		name: room.name,
		taken: takenRows.map((row) => row.aspect).filter(isAspect)
	};
}
function mapMessage(row) {
	if (row.kind !== "human" && row.kind !== "bot" && row.kind !== "note" && row.kind !== "system") return null;
	return {
		id: Number(row.id),
		kind: row.kind,
		aspect: isAspect(row.aspect) ? row.aspect : null,
		displayName: row.display_name,
		body: row.body,
		mine: asBool(row.mine),
		createdMs: Number(row.created_ms) || 0
	};
}
async function snapshot(sql, member, userId, afterId) {
	await sql`
    update room_members set last_seen = now()
    where room_id = ${member.room_id} and user_id = ${userId}
  `;
	const fresh = await loadMember(sql, member.code, userId);
	if (!fresh || !isAspect(fresh.aspect)) return null;
	const seatRows = await sql`
    select aspect, display_name,
           (last_seen > now() - interval '12 seconds') as online,
           (user_id = ${userId}) as mine
    from room_members
    where room_id = ${fresh.room_id}
  `;
	const seats = ASPECTS.flatMap((aspect) => {
		const row = seatRows.find((seat) => seat.aspect === aspect.id);
		if (!row || !isAspect(row.aspect)) return [];
		return [{
			aspect: row.aspect,
			displayName: row.display_name,
			online: asBool(row.online),
			mine: asBool(row.mine)
		}];
	});
	const messageRows = await sql`
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
		canDelete: fresh.owner_id === userId || admin
	};
}
async function note(sql, member, userId, kind, body) {
	await sql`
    insert into room_messages (room_id, user_id, display_name, kind, aspect, body)
    values (${member.room_id}, ${userId}, ${member.display_name}, ${kind}, ${member.aspect}, ${body})
  `;
}
var aiGate = globalThis;
var listRooms_createServerFn_handler = createServerRpc({
	id: "c1b4ea2e83ce749ba861782871dd99f0cabe4bb15a2313b241f73a8ed4b561b4",
	name: "listRooms",
	filename: "src/lib/bench/api.ts"
}, (opts) => listRooms.__executeServer(opts));
var listRooms = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(listRooms_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	const admin = await callerIsAdmin(sql, context.userId);
	return {
		ok: true,
		rooms: (await sql`
      select r.code, r.name, r.blurb, m.aspect, r.revision,
             (r.owner_id = ${context.userId}) as owner
      from room_members m
      join rooms r on r.id = m.room_id
      where m.user_id = ${context.userId}
      order by r.created_at desc
    `).flatMap((row) => isAspect(row.aspect) ? [{
			code: row.code,
			name: row.name,
			blurb: row.blurb ?? "",
			aspect: row.aspect,
			revision: Number(row.revision) || 1,
			canDelete: asBool(row.owner) || admin
		}] : [])
	};
});
var deleteRoom_createServerFn_handler = createServerRpc({
	id: "1178b373cc0ec5886b272ca96e974dc208b9c80753b140da92691afa23c422e2",
	name: "deleteRoom",
	filename: "src/lib/bench/api.ts"
}, (opts) => deleteRoom.__executeServer(opts));
var deleteRoom = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(deleteRoom_createServerFn_handler, async ({ context, data }) => {
	const code = normalizeCode(data.code);
	if (!code) return fail("Missing project.");
	const sql = await getSql();
	const room = (await sql`
      select id, owner_id from rooms where code = ${code}
    `)[0];
	if (!room) return fail("That project is already gone.");
	if (room.owner_id !== context.userId && !await callerIsAdmin(sql, context.userId)) return fail("Only the owner can delete this project.");
	await sql`delete from rooms where id = ${room.id}`;
	return { ok: true };
});
var createRoom_createServerFn_handler = createServerRpc({
	id: "614050903d32a4e12de47f1b890e8c707a39c9903d7899b164de09c68eb0309a",
	name: "createRoom",
	filename: "src/lib/bench/api.ts"
}, (opts) => createRoom.__executeServer(opts));
var createRoom = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createRoom_createServerFn_handler, async ({ context, data }) => {
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
			return {
				ok: true,
				code
			};
		} catch (err) {
			if (isUnique(err) && attempt < 3) continue;
			throw err;
		}
	}
	return fail("Could not create the project. Try again.");
});
async function askApp(input) {
	const empty = {
		say: "",
		name: "",
		html: "",
		css: "",
		js: ""
	};
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		...empty,
		say: "Grok is not available, so no app was written."
	};
	const map = aiGate.__splitbenchAi ??= /* @__PURE__ */ new Map();
	const now = Date.now();
	if (now - (map.get(input.userId) ?? 0) < 2500) return {
		...empty,
		say: "Give Grok a moment, then try again."
	};
	map.set(input.userId, now);
	const clip = (value) => value.slice(0, 6e3);
	const payload = {
		model: "grok-4.5",
		temperature: .4,
		max_tokens: 3200,
		response_format: { type: "json_object" },
		messages: [{
			role: "system",
			content: `You write a small real web app that runs alone in a sandboxed iframe.
Vanilla HTML, CSS, and JavaScript only. No npm, no build step, no external scripts or stylesheets.
Build the thing the person asked for. A list must add and remove items. A timer must start and stop. A calculator must compute.
Do not make a canvas of falling tiles, or a page that only changes colors, unless they asked for that.
You may write only these JSON keys: ${input.allowed.map((file) => file === "index.html" ? "html" : file === "styles.css" ? "css" : "js").join(", ")}.
html is index.html, css is styles.css, js is app.js.
Return JSON only: {"name":"2 to 4 words","say":"one short sentence","html":"","css":"","js":""}
When you write html, link styles.css and app.js with relative paths. Keep the page usable on a phone.`
		}, {
			role: "user",
			content: `Request:\n${input.prompt}\n\nCurrent index.html:\n${clip(input.current.get("index.html") ?? "")}\n\nCurrent styles.css:\n${clip(input.current.get("styles.css") ?? "")}\n\nCurrent app.js:\n${clip(input.current.get("app.js") ?? "")}`
		}]
	};
	const call = (body) => fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(25e3)
	});
	try {
		let response = await call(payload);
		if (response.status === 400 || response.status === 422) {
			delete payload.response_format;
			response = await call(payload);
		}
		if (!response.ok) return {
			...empty,
			say: `Grok could not build that (${response.status}).`
		};
		const text = (await response.json()).choices?.[0]?.message?.content ?? "";
		const start = text.indexOf("{");
		const end = text.lastIndexOf("}");
		if (start < 0 || end <= start) return {
			...empty,
			say: "I couldn't read an app from that. Name what it should do."
		};
		const parsed = JSON.parse(text.slice(start, end + 1));
		const take = (value) => typeof value === "string" ? value.replace(/\u0000/g, "").slice(0, 5e4) : "";
		return {
			say: cleanLine(parsed.say, 360, "Built."),
			name: cleanLine(parsed.name, 48, ""),
			html: input.allowed.includes("index.html") ? take(parsed.html) : "",
			css: input.allowed.includes("styles.css") ? take(parsed.css) : "",
			js: input.allowed.includes("app.js") ? take(parsed.js) : ""
		};
	} catch {
		return {
			...empty,
			say: "Grok could not be reached. Nothing was written."
		};
	}
}
function readAppFiles(raw) {
	const files = /* @__PURE__ */ new Map();
	if (typeof raw !== "string" || !raw) return files;
	try {
		const checked = validatePacked(JSON.parse(raw));
		if ("error" in checked) return files;
		for (const file of checked.files) if (file.encoding === "utf8") files.set(file.path, file.data);
	} catch {
		return files;
	}
	return files;
}
function linkedHtml(html) {
	let next = html.trim();
	if (!/<html[\s>]/i.test(next)) return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>App</title><link rel="stylesheet" href="styles.css"></head><body>${next}<script src="app.js" defer><\/script></body></html>`;
	if (!/styles\.css/i.test(next) && /<head[^>]*>/i.test(next)) next = next.replace(/<head[^>]*>/i, (open) => `${open}<link rel="stylesheet" href="styles.css">`);
	if (!/app\.js/i.test(next) && /<\/body>/i.test(next)) next = next.replace(/<\/body>/i, `<script src="app.js" defer><\/script></body>`);
	return next;
}
function packApp(current, next) {
	const html = linkedHtml(next.html || current.get("index.html") || "");
	const css = next.css || current.get("styles.css") || "body{margin:0;font-family:Georgia,serif;background:#f3efe6;color:#1c1b19}";
	const js = next.js || current.get("app.js") || "";
	return [
		{
			path: "index.html",
			mime: "text/html",
			encoding: "utf8",
			data: html
		},
		{
			path: "styles.css",
			mime: "text/css",
			encoding: "utf8",
			data: css
		},
		{
			path: "app.js",
			mime: "text/javascript",
			encoding: "utf8",
			data: js
		}
	];
}
var buildPiece_createServerFn_handler = createServerRpc({
	id: "a47a538f64229ffa978a5c4ed0e963ab878b31fb84c3a4cfb096d933ee2eff88",
	name: "buildPiece",
	filename: "src/lib/bench/api.ts"
}, (opts) => buildPiece.__executeServer(opts));
var buildPiece = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(buildPiece_createServerFn_handler, async ({ context, data }) => {
	const code = normalizeCode(data.code);
	const prompt = cleanLine(data.prompt, 800);
	if (!code || !prompt) return fail("Type what to build.");
	const sql = await getSql();
	const member = await loadMember(sql, code, context.userId);
	if (!member || !isAspect(member.aspect)) return fail("You are not seated in this project.");
	const owners = await sql`
      select owner_id, bundle from rooms where id = ${member.room_id}
    `;
	const broad = owners[0]?.owner_id === context.userId || await callerIsAdmin(sql, context.userId);
	const access = await accountReach(sql, context.userId, member.aspect);
	const allowed = filesForRoles(broad ? ASPECTS.map((aspect) => aspect.id) : access.reach);
	if (allowed.length === 0) return fail("This account cannot change the app.");
	const current = readAppFiles(owners[0]?.bundle);
	if (!current.has("index.html") && !allowed.includes("index.html")) return fail("The app is still blank. Someone who can write the page has to build it first.");
	await note(sql, member, context.userId, "human", prompt);
	const answer = await askApp({
		userId: context.userId,
		prompt,
		allowed,
		current
	});
	const wrote = [
		answer.html ? "index.html" : "",
		answer.css ? "styles.css" : "",
		answer.js ? "app.js" : ""
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
	return {
		ok: true,
		room
	};
});
var openRoom_createServerFn_handler = createServerRpc({
	id: "954ba4ec906ef457c20c9eb6db4a43d7290479a265b0c6d36ebd54f2b33b18e9",
	name: "openRoom",
	filename: "src/lib/bench/api.ts"
}, (opts) => openRoom.__executeServer(opts));
var openRoom = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(openRoom_createServerFn_handler, async ({ context, data }) => {
	const code = normalizeCode(data.code);
	if (!code) return {
		ok: true,
		status: "missing"
	};
	const sql = await getSql();
	const member = await loadMember(sql, code, context.userId);
	if (!member) {
		const peek = await peekRoom(sql, code);
		if (!peek) return {
			ok: true,
			status: "missing"
		};
		return {
			ok: true,
			status: "join",
			name: peek.name,
			taken: peek.taken
		};
	}
	const room = await snapshot(sql, member, context.userId, Math.max(0, Math.floor(Number(data.afterId) || 0)));
	if (!room) return fail("Your seat could not be read.");
	return {
		ok: true,
		status: "room",
		room
	};
});
var joinRoom_createServerFn_handler = createServerRpc({
	id: "f17cbff57057ef20bf8d10da13ee78854c22c50c284080d6b4a4984ab1278159",
	name: "joinRoom",
	filename: "src/lib/bench/api.ts"
}, (opts) => joinRoom.__executeServer(opts));
var joinRoom = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(joinRoom_createServerFn_handler, async ({ context, data }) => {
	const code = normalizeCode(data.code);
	if (!code || !isAspect(data.aspect)) return fail("Choose a craft and a six-letter code.");
	const sql = await getSql();
	const existing = await loadMember(sql, code, context.userId);
	if (existing) {
		const room = await snapshot(sql, existing, context.userId, 0);
		if (!room) return fail("Your seat could not be read.");
		return {
			ok: true,
			status: "room",
			room
		};
	}
	const roomRow = (await sql`select id from rooms where code = ${code}`)[0];
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
	return {
		ok: true,
		status: "room",
		room
	};
});
var moveSeat_createServerFn_handler = createServerRpc({
	id: "3fd5adc848606d3ed5633932d5e719c3b4a7535d4d9950ae11b9d09847f18f35",
	name: "moveSeat",
	filename: "src/lib/bench/api.ts"
}, (opts) => moveSeat.__executeServer(opts));
var moveSeat = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(moveSeat_createServerFn_handler, async ({ context, data }) => {
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
	return {
		ok: true,
		room
	};
});
var patchAspect_createServerFn_handler = createServerRpc({
	id: "c7faedac15c8d5503193d88bf795033a2c71471d4a58278ef24c7eac23161fdf",
	name: "patchAspect",
	filename: "src/lib/bench/api.ts"
}, (opts) => patchAspect.__executeServer(opts));
var patchAspect = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(patchAspect_createServerFn_handler, async ({ context, data }) => {
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
	return {
		ok: true,
		room
	};
});
var sendChat_createServerFn_handler = createServerRpc({
	id: "917df3c869fe0f0007a1067d713605aae969521dffd629c585fef9db3bc3d148",
	name: "sendChat",
	filename: "src/lib/bench/api.ts"
}, (opts) => sendChat.__executeServer(opts));
var sendChat = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(sendChat_createServerFn_handler, async ({ context, data }) => {
	const code = normalizeCode(data.code);
	const body = cleanLine(data.body, 800);
	if (!code || !body) return fail("Write a message first.");
	const sql = await getSql();
	const member = await loadMember(sql, code, context.userId);
	if (!member || !isAspect(member.aspect)) return fail("You are not seated in this room.");
	await note(sql, member, context.userId, "human", body);
	const access = await accountReach(sql, context.userId, member.aspect);
	const allowed = filesForRoles(access.reach);
	const current = readAppFiles((await sql`select bundle from rooms where id = ${member.room_id}`)[0]?.bundle);
	if (!current.has("index.html")) await sql`
        insert into room_messages (room_id, user_id, display_name, kind, aspect, body)
        values (
          ${member.room_id}, ${context.userId}, ${"Grok"},
          'bot', ${member.aspect}, ${"The app is still blank. Type what to build first."}
        )
      `;
	else if (allowed.length === 0) await sql`
        insert into room_messages (room_id, user_id, display_name, kind, aspect, body)
        values (
          ${member.room_id}, ${context.userId}, ${"Grok"},
          'bot', ${member.aspect}, ${"This account cannot change the app."}
        )
      `;
	else {
		const answer = await askApp({
			userId: context.userId,
			prompt: access.brief ? `${body}\nStay inside this note: ${access.brief}` : body,
			allowed,
			current
		});
		const wrote = [
			answer.html ? "index.html" : "",
			answer.css ? "styles.css" : "",
			answer.js ? "app.js" : ""
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
	return {
		ok: true,
		room
	};
});
var saveBundle_createServerFn_handler = createServerRpc({
	id: "077e33d15b73b03e8d7da3fce405f8bea79bbd358f6c39fa73f0d1f95de9dbac",
	name: "saveBundle",
	filename: "src/lib/bench/api.ts"
}, (opts) => saveBundle.__executeServer(opts));
var saveBundle = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(saveBundle_createServerFn_handler, async ({ context, data }) => {
	const code = normalizeCode(data.code);
	if (!code) return fail("Missing room.");
	const checked = validatePacked(data.files);
	if ("error" in checked) return fail(checked.error);
	const payload = JSON.stringify(checked.files);
	if (payload.length > 12e5) return fail("That zip is too large to share in the room.");
	const label = cleanLine(data.label, 80, "site.zip");
	const sql = await getSql();
	const member = await loadMember(sql, code, context.userId);
	if (!member) return fail("You are not seated in this room.");
	const rows = await sql`
      update rooms
      set bundle = ${payload},
          bundle_label = ${label},
          bundle_revision = bundle_revision + 1
      where id = ${member.room_id}
      returning bundle_revision
    `;
	await note(sql, member, context.userId, "system", `${member.display_name} dropped ${label}. The site preview updated for everyone here.`);
	return {
		ok: true,
		bundleRevision: Number(rows[0]?.bundle_revision) || 0,
		label
	};
});
var clearBundle_createServerFn_handler = createServerRpc({
	id: "6ef24dfb3e6f3fa4c03af78b1f87e3909815e3d78129c4c46ba1b6f00af75765",
	name: "clearBundle",
	filename: "src/lib/bench/api.ts"
}, (opts) => clearBundle.__executeServer(opts));
var clearBundle = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(clearBundle_createServerFn_handler, async ({ context, data }) => {
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
	return { ok: true };
});
var getBundle_createServerFn_handler = createServerRpc({
	id: "c677054243bde15ac0820f0180d240bc49063dcbf6938030f3e3a6702fb9e871",
	name: "getBundle",
	filename: "src/lib/bench/api.ts"
}, (opts) => getBundle.__executeServer(opts));
var getBundle = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(getBundle_createServerFn_handler, async ({ context, data }) => {
	const code = normalizeCode(data.code);
	if (!code) return fail("Missing room.");
	const row = (await (await getSql())`
      select r.bundle, r.bundle_revision, r.bundle_label
      from rooms r
      join room_members m on m.room_id = r.id and m.user_id = ${context.userId}
      where r.code = ${code}
    `)[0];
	if (!row) return fail("You are not seated in this room.");
	if (!row.bundle) return {
		ok: true,
		bundleRevision: Number(row.bundle_revision) || 0,
		label: null,
		files: null
	};
	try {
		const checked = validatePacked(JSON.parse(row.bundle));
		if ("error" in checked) return fail(checked.error);
		return {
			ok: true,
			bundleRevision: Number(row.bundle_revision) || 0,
			label: row.bundle_label,
			files: checked.files
		};
	} catch {
		return fail("The saved site could not be read.");
	}
});
var listAccountDuties_createServerFn_handler = createServerRpc({
	id: "c3d72cfb9c29ca851620897bb9f224f1a118fa2a11dd940f6eec905cbd66a268",
	name: "listAccountDuties",
	filename: "src/lib/bench/api.ts"
}, (opts) => listAccountDuties.__executeServer(opts));
var listAccountDuties = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(listAccountDuties_createServerFn_handler, async ({ context }) => {
	const sql = await getSql();
	if (!await callerIsAdmin(sql, context.userId)) return {
		ok: true,
		admin: false,
		duties: []
	};
	return {
		ok: true,
		admin: true,
		duties: await listDuties(sql)
	};
});
var saveAccountDuty_createServerFn_handler = createServerRpc({
	id: "a0438e8ea77d0b25ea31f09738b4014c4ae274a6083f347fac1f4c7a17dc5dc1",
	name: "saveAccountDuty",
	filename: "src/lib/bench/api.ts"
}, (opts) => saveAccountDuty.__executeServer(opts));
var saveAccountDuty = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(saveAccountDuty_createServerFn_handler, async ({ context, data }) => {
	const email = cleanEmail(data.email);
	if (!email) return fail("Type a real email for the account.");
	const explicit = [...new Set((data.roles ?? []).filter(isAspect))];
	const typed = typeof data.brief === "string" ? data.brief.trim() : "";
	const parsed = typed ? parseDuty(typed) : null;
	let allowed = explicit;
	if (parsed && !("error" in parsed)) allowed = ASPECTS.map((aspect) => aspect.id).filter((id) => explicit.includes(id) || parsed.allowed.includes(id));
	else if (explicit.length === 0) return fail(parsed && "error" in parsed ? parsed.error : "Pick at least one role.");
	const brief = cleanLine(typed, 400, allowed.map((id) => aspectLabel(id)).join(", "));
	const sql = await getSql();
	if (!await callerIsAdmin(sql, context.userId)) return fail("Only the admin can say what an account can do.");
	await sql`
      insert into account_duties (email, brief, allowed)
      values (${email}, ${brief}, ${JSON.stringify(allowed)}::jsonb)
      on conflict (email) do update
      set brief = excluded.brief, allowed = excluded.allowed, updated_at = now()
    `;
	return {
		ok: true,
		duties: await listDuties(sql)
	};
});
var removeAccountDuty_createServerFn_handler = createServerRpc({
	id: "71ef476f7b81f07712670fccb920d0040aa506e12bf2147ea6ddba2b41901db7",
	name: "removeAccountDuty",
	filename: "src/lib/bench/api.ts"
}, (opts) => removeAccountDuty.__executeServer(opts));
var removeAccountDuty = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(removeAccountDuty_createServerFn_handler, async ({ context, data }) => {
	const email = cleanEmail(data.email);
	if (!email) return fail("Missing account.");
	const sql = await getSql();
	if (!await callerIsAdmin(sql, context.userId)) return fail("Only the admin can say what an account can do.");
	await sql`delete from account_duties where email = ${email}`;
	return {
		ok: true,
		duties: await listDuties(sql)
	};
});
//#endregion
export { buildPiece_createServerFn_handler, clearBundle_createServerFn_handler, createRoom_createServerFn_handler, deleteRoom_createServerFn_handler, getBundle_createServerFn_handler, joinRoom_createServerFn_handler, listAccountDuties_createServerFn_handler, listRooms_createServerFn_handler, moveSeat_createServerFn_handler, openRoom_createServerFn_handler, patchAspect_createServerFn_handler, removeAccountDuty_createServerFn_handler, saveAccountDuty_createServerFn_handler, saveBundle_createServerFn_handler, sendChat_createServerFn_handler };
