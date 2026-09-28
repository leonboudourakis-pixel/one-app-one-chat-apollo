//#region node_modules/.nitro/vite/services/ssr/assets/model-Drbfu5LE.js
var ASPECTS = [
	{
		id: "graphics",
		label: "Look",
		blurb: "The stylesheet: color, type, and layout."
	},
	{
		id: "physics",
		label: "Logic",
		blurb: "How the app behaves and what it remembers."
	},
	{
		id: "motion",
		label: "Interaction",
		blurb: "Clicks, motion, and how controls respond."
	},
	{
		id: "rules",
		label: "Rules",
		blurb: "What the app allows, counts, and refuses."
	},
	{
		id: "copy",
		label: "Words",
		blurb: "The page itself: headings, labels, and empty states."
	},
	{
		id: "sound",
		label: "Sound",
		blurb: "Clicks, tones, and whether the app speaks."
	}
];
var FIELDS = {
	graphics: [
		{
			key: "background",
			label: "Ground",
			kind: "color"
		},
		{
			key: "ink",
			label: "Ink",
			kind: "color"
		},
		{
			key: "accent",
			label: "Accent",
			kind: "color"
		},
		{
			key: "shape",
			label: "Shape",
			kind: "select",
			options: [
				{
					value: "orb",
					label: "Orb"
				},
				{
					value: "tile",
					label: "Tile"
				},
				{
					value: "shard",
					label: "Shard"
				},
				{
					value: "ring",
					label: "Ring"
				}
			]
		},
		{
			key: "glow",
			label: "Glow",
			kind: "range",
			min: 0,
			max: 1,
			step: .01
		},
		{
			key: "trail",
			label: "Trail",
			kind: "range",
			min: 0,
			max: 1,
			step: .01
		}
	],
	physics: [
		{
			key: "gravity",
			label: "Gravity",
			kind: "range",
			min: -800,
			max: 1600,
			step: 10
		},
		{
			key: "bounce",
			label: "Bounce",
			kind: "range",
			min: 0,
			max: 1,
			step: .01
		},
		{
			key: "drag",
			label: "Drag",
			kind: "range",
			min: 0,
			max: 3,
			step: .01
		},
		{
			key: "wind",
			label: "Wind",
			kind: "range",
			min: -400,
			max: 400,
			step: 5
		}
	],
	motion: [
		{
			key: "count",
			label: "Count",
			kind: "range",
			min: 0,
			max: 64,
			step: 1
		},
		{
			key: "size",
			label: "Size",
			kind: "range",
			min: .45,
			max: 2.4,
			step: .01
		},
		{
			key: "spin",
			label: "Spin",
			kind: "range",
			min: 0,
			max: 6,
			step: .01
		}
	],
	rules: [
		{
			key: "mode",
			label: "Mode",
			kind: "select",
			options: [
				{
					value: "drift",
					label: "Drift"
				},
				{
					value: "catch",
					label: "Catch"
				},
				{
					value: "dodge",
					label: "Dodge"
				}
			]
		},
		{
			key: "goal",
			label: "Goal",
			kind: "range",
			min: 3,
			max: 40,
			step: 1
		},
		{
			key: "lives",
			label: "Lives",
			kind: "range",
			min: 1,
			max: 8,
			step: 1
		}
	],
	copy: [{
		key: "title",
		label: "Title",
		kind: "text",
		max: 42
	}, {
		key: "hint",
		label: "Hint",
		kind: "text",
		max: 110
	}],
	sound: [
		{
			key: "enabled",
			label: "Tone",
			kind: "toggle"
		},
		{
			key: "tone",
			label: "Pitch",
			kind: "range",
			min: 80,
			max: 1200,
			step: 1
		},
		{
			key: "volume",
			label: "Volume",
			kind: "range",
			min: 0,
			max: 1,
			step: .01
		}
	]
};
var DEFAULT_SPEC = {
	graphics: {
		background: "#f3efe6",
		ink: "#1c1b19",
		accent: "#3e5160",
		shape: "orb",
		glow: 0,
		trail: 0
	},
	physics: {
		gravity: 0,
		bounce: 0,
		drag: 0,
		wind: 0
	},
	motion: {
		count: 0,
		size: 1,
		spin: 0
	},
	rules: {
		mode: "drift",
		goal: 8,
		lives: 3
	},
	copy: {
		title: "",
		hint: ""
	},
	sound: {
		enabled: false,
		tone: 220,
		volume: 0
	}
};
var PROMPTS = {
	graphics: ["Make the page quieter, more paper, less decoration", "Use a dark ground and pale type"],
	physics: ["Remember this list in the browser", "Add undo for the last action"],
	motion: ["Make the main button respond when pressed", "Animate the item that was just added"],
	rules: ["Refuse empty items", "Cap the list at twenty"],
	copy: ["Rewrite the heading and the empty state", "Make the button say Add"],
	sound: ["Play a soft click when something is added", "Turn sounds off"]
};
var ASPECT_SET = new Set(ASPECTS.map((aspect) => aspect.id));
function isAspect(value) {
	return typeof value === "string" && ASPECT_SET.has(value);
}
function aspectLabel(id) {
	return ASPECTS.find((aspect) => aspect.id === id)?.label ?? "Role";
}
function filesForRoles(roles) {
	const files = /* @__PURE__ */ new Set();
	for (const role of roles) if (role === "copy") files.add("index.html");
	else if (role === "graphics") files.add("styles.css");
	else files.add("app.js");
	return [
		"index.html",
		"styles.css",
		"app.js"
	].filter((file) => files.has(file));
}
function cleanText(value, max) {
	return value.replace(/[\u0000-\u001f]/g, "").trim().replace(/\s+/g, " ").slice(0, max);
}
function coerce(field, value) {
	if (field.kind === "range") {
		const number = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
		if (!Number.isFinite(number)) return void 0;
		const clamped = Math.min(field.max, Math.max(field.min, number));
		const steps = Math.round((clamped - field.min) / field.step);
		return Math.min(field.max, Math.max(field.min, field.min + steps * field.step));
	}
	if (field.kind === "color") {
		if (typeof value !== "string") return void 0;
		const hex = value.trim().toLowerCase();
		return /^#[0-9a-f]{6}$/.test(hex) ? hex : void 0;
	}
	if (field.kind === "select") return typeof value === "string" && field.options.some((option) => option.value === value) ? value : void 0;
	if (field.kind === "toggle") {
		if (typeof value === "boolean") return value;
		if (value === "true" || value === 1) return true;
		if (value === "false" || value === 0) return false;
		return;
	}
	if (typeof value !== "string") return void 0;
	return cleanText(value, field.max);
}
function sliceOf(aspect, value) {
	const base = { ...DEFAULT_SPEC[aspect] };
	const raw = value && typeof value === "object" ? value : {};
	for (const field of FIELDS[aspect]) {
		if (!(field.key in raw)) continue;
		const next = coerce(field, raw[field.key]);
		if (next !== void 0) base[field.key] = next;
	}
	return base;
}
function readSpec(value) {
	let raw = value;
	if (typeof raw === "string") try {
		raw = JSON.parse(raw);
	} catch {
		raw = {};
	}
	const src = raw && typeof raw === "object" ? raw : {};
	return {
		graphics: sliceOf("graphics", src.graphics),
		physics: sliceOf("physics", src.physics),
		motion: sliceOf("motion", src.motion),
		rules: sliceOf("rules", src.rules),
		copy: sliceOf("copy", src.copy),
		sound: sliceOf("sound", src.sound)
	};
}
function formatValue(field, value) {
	if (field.kind === "range") {
		const number = Number(value);
		return field.step < 1 ? number.toFixed(2) : String(Math.round(number));
	}
	if (field.kind === "toggle") return value ? "on" : "off";
	if (field.kind === "text") return `“${String(value)}”`;
	return String(value);
}
function projectSlice(spec, aspect, patch) {
	let raw = patch;
	if (raw && typeof raw === "object" && !Array.isArray(raw)) {
		const record = raw;
		if (record[aspect] && typeof record[aspect] === "object") raw = record[aspect];
	}
	const merged = raw && typeof raw === "object" ? {
		...spec[aspect],
		...raw
	} : spec[aspect];
	const next = readSpec({
		...spec,
		[aspect]: merged
	})[aspect];
	const before = spec[aspect];
	const after = next;
	const parts = [];
	for (const field of FIELDS[aspect]) if (before[field.key] !== after[field.key]) parts.push(`${field.label} ${formatValue(field, after[field.key])}`);
	return {
		slice: next,
		summary: parts.join(" · ")
	};
}
function describeGrant(allowed) {
	const labels = allowed.map((id) => aspectLabel(id).toLowerCase());
	if (labels.length === 0) return "nothing";
	if (labels.length === 1) return labels[0] ?? "nothing";
	if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
	return `${labels.slice(0, -1).join(", ")}, and ${labels.at(-1)}`;
}
function benchBlurb(seat, reach, brief) {
	const own = aspectLabel(seat).toLowerCase();
	if (brief) {
		if (reach.length === 0) return `“${brief}” This account cannot change the app.`;
		return `“${brief}”`;
	}
	if (reach.length === 1 && reach[0] === seat) return `Your Grok can change the ${own} role only.`;
	if (reach.length === 0) return "This account cannot change the app.";
	if (reach.length === ASPECTS.length) return "You can change every role in the app.";
	return `Your roles: ${describeGrant(reach)}. Your Grok can edit those parts of the app.`;
}
var DUTY_WORDS = {
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
	volume: "sound"
};
function cleanEmail(input) {
	if (typeof input !== "string") return null;
	const email = input.trim().toLowerCase();
	if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
	return email;
}
function parseDuty(input) {
	const brief = input.replace(/[\u0000-\u001f]/g, " ").trim().replace(/\s+/g, " ").slice(0, 400);
	if (!brief) return { error: "Type what this account can do." };
	const lower = brief.toLowerCase();
	const found = /* @__PURE__ */ new Set();
	for (const word of lower.split(/[^a-z]+/)) {
		const aspect = DUTY_WORDS[word];
		if (aspect) found.add(aspect);
	}
	if (found.size > 0) return {
		brief,
		allowed: ASPECTS.map((aspect) => aspect.id).filter((id) => found.has(id))
	};
	if (/\b(everything|anything)\b/.test(lower) || /\b(all|every) (crafts?|roles?)\b/.test(lower) || /^(all|every)$/.test(lower)) return {
		brief,
		allowed: ASPECTS.map((aspect) => aspect.id)
	};
	if (/\b(nothing|none)\b/.test(lower) || /\b(can'?t|cannot) change\b/.test(lower)) return {
		brief,
		allowed: []
	};
	return { error: "Name one or more roles: look, logic, interaction, rules, words, sound. Or type everything, or nothing." };
}
function fieldOwner(key) {
	for (const aspect of ASPECTS) if (FIELDS[aspect.id].some((field) => field.key === key)) return aspect.id;
	return null;
}
function takeFields(aspect, raw, buckets) {
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return;
	const dest = buckets[aspect] ??= {};
	for (const [key, value] of Object.entries(raw)) if (FIELDS[aspect].some((field) => field.key === key)) dest[key] = value;
}
function applyGrantedPatch(spec, allowed, patch) {
	const allowedSet = new Set(allowed);
	const buckets = {};
	const refused = /* @__PURE__ */ new Set();
	const claim = (aspect, raw) => {
		if (!allowedSet.has(aspect)) {
			refused.add(aspect);
			return;
		}
		takeFields(aspect, raw, buckets);
	};
	if (patch && typeof patch === "object" && !Array.isArray(patch)) {
		const record = patch;
		const nested = Object.keys(record).filter(isAspect);
		const flat = {};
		for (const [key, value] of Object.entries(record)) if (isAspect(key)) claim(key, value);
		else flat[key] = value;
		if (nested.length === 0 || Object.keys(flat).length > 0) for (const [key, value] of Object.entries(flat)) {
			const owner = fieldOwner(key);
			if (!owner) continue;
			claim(owner, { [key]: value });
		}
	}
	const writes = [];
	for (const aspect of ASPECTS) {
		const raw = buckets[aspect.id];
		if (!raw || Object.keys(raw).length === 0) continue;
		const projected = projectSlice(spec, aspect.id, raw);
		if (!projected.summary) continue;
		writes.push({
			aspect: aspect.id,
			slice: projected.slice,
			summary: projected.summary
		});
	}
	return {
		writes,
		refused: [...refused]
	};
}
function specWithWrites(spec, writes) {
	const next = { ...spec };
	for (const write of writes) if (write.aspect === "graphics") next.graphics = write.slice;
	else if (write.aspect === "physics") next.physics = write.slice;
	else if (write.aspect === "motion") next.motion = write.slice;
	else if (write.aspect === "rules") next.rules = write.slice;
	else if (write.aspect === "copy") next.copy = write.slice;
	else next.sound = write.slice;
	return next;
}
//#endregion
export { aspectLabel as a, describeGrant as c, parseDuty as d, readSpec as f, applyGrantedPatch as i, filesForRoles as l, DEFAULT_SPEC as n, benchBlurb as o, specWithWrites as p, PROMPTS as r, cleanEmail as s, ASPECTS as t, isAspect as u };
