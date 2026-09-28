//#region node_modules/.nitro/vite/services/ssr/assets/files-C7P5IyM5.js
var TEXT_EXT = /* @__PURE__ */ new Set([
	"html",
	"htm",
	"css",
	"js",
	"mjs",
	"svg",
	"txt",
	"json",
	"map",
	"xml"
]);
var MIME = {
	html: "text/html",
	htm: "text/html",
	css: "text/css",
	js: "text/javascript",
	mjs: "text/javascript",
	svg: "image/svg+xml",
	txt: "text/plain",
	json: "application/json",
	map: "application/json",
	xml: "application/xml",
	png: "image/png",
	jpg: "image/jpeg",
	jpeg: "image/jpeg",
	gif: "image/gif",
	webp: "image/webp",
	ico: "image/x-icon",
	woff: "font/woff",
	woff2: "font/woff2",
	mp3: "audio/mpeg",
	wav: "audio/wav",
	ogg: "audio/ogg"
};
var MAX_FILES = 40;
var MAX_TOTAL = 1e6;
var CSP = [
	"default-src 'none'",
	"script-src 'unsafe-inline' 'unsafe-eval' data: blob: https:",
	"style-src 'unsafe-inline' data: https:",
	"img-src data: blob: https:",
	"font-src data: blob: https:",
	"media-src data: blob: https:",
	"connect-src data: blob: https:",
	"worker-src blob:"
].join("; ");
function extOf(path) {
	const base = path.split("/").pop() ?? "";
	const dot = base.lastIndexOf(".");
	return dot >= 0 ? base.slice(dot + 1).toLowerCase() : "";
}
function mimeFor(path) {
	return MIME[extOf(path)] ?? null;
}
function isTextPath(path) {
	return TEXT_EXT.has(extOf(path));
}
function cleanPath(raw) {
	const normalized = raw.replace(/\\/g, "/").replace(/^\/+/, "");
	if (!normalized || normalized.endsWith("/")) return null;
	const parts = [];
	for (const segment of normalized.split("/")) {
		if (!segment || segment === "." || segment === "__MACOSX") continue;
		if (segment === ".." || segment === ".DS_Store") return null;
		if (!/^[A-Za-z0-9._-]+$/.test(segment)) return null;
		parts.push(segment);
	}
	return parts.length ? parts.join("/") : null;
}
function stripSharedRoot(paths) {
	if (paths.length === 0 || paths.some((path) => !path.includes("/"))) return paths;
	const root = paths[0].split("/")[0];
	if (!paths.every((path) => path.split("/")[0] === root)) return paths;
	return paths.map((path) => path.slice(root.length + 1));
}
function validatePacked(input) {
	if (!Array.isArray(input)) return { error: "That drop is not a file list." };
	if (input.length > MAX_FILES) return { error: "Keep the zip to 40 files or fewer." };
	const files = [];
	let total = 0;
	for (const item of input) {
		if (!item || typeof item !== "object") return { error: "A file in the zip could not be read." };
		const record = item;
		const path = typeof record.path === "string" ? cleanPath(record.path) : null;
		const mime = path ? mimeFor(path) : null;
		const encoding = record.encoding;
		const data = record.data;
		if (!path || !mime || encoding !== "utf8" && encoding !== "base64" || typeof data !== "string") continue;
		if (mimeFor(path) !== mime && record.mime !== mime) continue;
		total += data.length;
		if (total > MAX_TOTAL) return { error: "That zip is too large to run in the room." };
		files.push({
			path,
			mime,
			encoding,
			data
		});
	}
	const rooted = stripSharedRoot(files.map((file) => file.path));
	const remapped = files.map((file, index) => ({
		...file,
		path: rooted[index]
	}));
	if (!remapped.some((file) => /^html?$/.test(extOf(file.path)) || extOf(file.path) === "html" || extOf(file.path) === "htm")) return { error: "The zip needs an HTML page, usually index.html." };
	return { files: remapped };
}
function resolvePath(fromFile, rel) {
	const trimmed = rel.trim();
	if (!trimmed || trimmed.startsWith("#")) return null;
	if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith("//")) return null;
	const bare = (trimmed.split("#")[0] ?? "").split("?")[0] ?? "";
	if (!bare) return null;
	const parts = bare.startsWith("/") ? [] : fromFile.split("/").slice(0, -1);
	for (const segment of bare.split("/")) {
		if (!segment || segment === ".") continue;
		if (segment === "..") {
			if (!parts.length) return null;
			parts.pop();
			continue;
		}
		parts.push(segment);
	}
	return parts.join("/") || null;
}
function dataUri(file) {
	if (file.encoding === "base64") return `data:${file.mime};base64,${file.data}`;
	return `data:${file.mime};charset=utf-8,${encodeURIComponent(file.data)}`;
}
function textOf(files, path) {
	const file = files.get(path);
	if (!file || file.encoding !== "utf8") return null;
	return file.data;
}
function htmlEntry(files) {
	const pages = files.filter((file) => extOf(file.path) === "html" || extOf(file.path) === "htm");
	return (pages.find((file) => /(^|\/)index\.html?$/i.test(file.path)) ?? pages.sort((a, b) => a.path.length - b.path.length)[0])?.path ?? null;
}
function buildSrcdoc(files) {
	const entry = htmlEntry(files);
	if (!entry) return {
		entry: null,
		html: "<!DOCTYPE html><title>Empty</title><p>This zip has no HTML page.</p>"
	};
	const map = new Map(files.map((file) => [file.path, file]));
	const assetUri = /* @__PURE__ */ new Map();
	for (const file of files) {
		const ext = extOf(file.path);
		if (ext === "html" || ext === "htm" || ext === "css" || ext === "js" || ext === "mjs") continue;
		assetUri.set(file.path, dataUri(file));
	}
	const cssDone = /* @__PURE__ */ new Map();
	const cssText = (path, stack) => {
		if (cssDone.has(path)) return cssDone.get(path);
		if (stack.includes(path)) return "";
		const raw = textOf(map, path);
		if (raw == null) return "";
		let css = raw.replace(/@import\s+(?:url\(\s*)?['"]([^'"]+)['"]\s*\)?[^;]*;/gi, (full, spec) => {
			const resolved = resolvePath(path, spec);
			if (!resolved || extOf(resolved) !== "css") return full;
			return cssText(resolved, [...stack, path]);
		});
		css = css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (full, _quote, spec) => {
			const resolved = resolvePath(path, spec);
			if (!resolved) return full;
			const uri = assetUri.get(resolved) ?? (extOf(resolved) === "css" ? null : null);
			if (assetUri.has(resolved)) return `url("${assetUri.get(resolved)}")`;
			return uri ? `url("${uri}")` : full;
		});
		cssDone.set(path, css);
		return css;
	};
	for (const file of files) if (extOf(file.path) === "css") cssText(file.path, []);
	for (const [path, css] of cssDone) assetUri.set(path, dataUri({
		path,
		mime: "text/css",
		encoding: "utf8",
		data: css
	}));
	const jsPaths = files.map((file) => file.path).filter((path) => extOf(path) === "js" || extOf(path) === "mjs");
	const jsSet = new Set(jsPaths);
	const depsOf = (path) => {
		const raw = textOf(map, path) ?? "";
		const deps = [];
		const re = /(['"])(\.{1,2}\/[^'"]+)\1/g;
		let match;
		while (match = re.exec(raw)) {
			const resolved = resolvePath(path, match[2] ?? "");
			if (resolved && jsSet.has(resolved) && resolved !== path) deps.push(resolved);
		}
		return deps;
	};
	const indegree = new Map(jsPaths.map((path) => [path, 0]));
	const children = new Map(jsPaths.map((path) => [path, []]));
	for (const path of jsPaths) for (const dep of depsOf(path)) {
		indegree.set(path, (indegree.get(path) ?? 0) + 1);
		children.get(dep)?.push(path);
	}
	const queue = jsPaths.filter((path) => (indegree.get(path) ?? 0) === 0);
	const order = [];
	while (queue.length) {
		const path = queue.shift();
		order.push(path);
		for (const child of children.get(path) ?? []) {
			indegree.set(child, (indegree.get(child) ?? 1) - 1);
			if ((indegree.get(child) ?? 0) === 0) queue.push(child);
		}
	}
	for (const path of jsPaths) if (!order.includes(path)) order.push(path);
	const jsSource = /* @__PURE__ */ new Map();
	for (const path of order) {
		let js = textOf(map, path) ?? "";
		js = js.replace(/(['"])(\.{1,2}\/[^'"]+)\1/g, (full, quote, spec) => {
			const resolved = resolvePath(path, spec);
			if (!resolved) return full;
			const uri = assetUri.get(resolved);
			return uri ? `${quote}${uri}${quote}` : full;
		});
		jsSource.set(path, js);
		assetUri.set(path, dataUri({
			path,
			mime: "text/javascript",
			encoding: "utf8",
			data: js
		}));
	}
	let html = textOf(map, entry) ?? "";
	html = html.replace(/<base\b[^>]*>/gi, "");
	html = html.replace(/<meta[^>]*http-equiv\s*=\s*(['"])(?:content-security-policy(?:-report-only)?|refresh)\1[^>]*>/gi, "");
	html = html.replace(/<link\b[^>]*>/gi, (tag) => {
		const hrefMatch = /\bhref\s*=\s*(['"])([^'"]+)\1/i.exec(tag);
		if (!hrefMatch) return tag;
		const resolved = resolvePath(entry, hrefMatch[2] ?? "");
		if (!resolved) return tag;
		if ((/rel\s*=\s*(['"])stylesheet\1/i.test(tag) || extOf(resolved) === "css") && cssDone.has(resolved)) return `<style>${cssDone.get(resolved).replace(/<\/style/gi, "<\\/style")}</style>`;
		const uri = assetUri.get(resolved);
		return uri ? tag.replace(hrefMatch[2] ?? "", uri) : tag;
	});
	html = html.replace(/<script\b([^>]*)\bsrc\s*=\s*(['"])([^'"]+)\2([^>]*)>\s*<\/script>/gi, (full, pre, _quote, src, post) => {
		const resolved = resolvePath(entry, src);
		if (!resolved) return full;
		const source = resolved ? jsSource.get(resolved) : void 0;
		if (source != null) {
			const module = /type\s*=\s*(['"])module\1/i.test(`${pre} ${post}`);
			const safe = source.replace(/<\/script/gi, "<\\/script");
			return `<script${module ? " type=\"module\"" : ""}>${safe}<\/script>`;
		}
		const uri = assetUri.get(resolved);
		return uri ? full.replace(src, uri) : full;
	});
	html = html.replace(/\b(src|href)\s*=\s*(['"])([^'"]+)\2/gi, (full, attr, quote, value) => {
		if (value.startsWith("data:") || value.startsWith("blob:") || value.startsWith("http")) return full;
		const resolved = resolvePath(entry, value);
		if (!resolved) return full;
		const uri = assetUri.get(resolved);
		return uri ? `${attr}=${quote}${uri}${quote}` : full;
	});
	html = html.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi, (full, _quote, spec) => {
		if (spec.startsWith("data:") || spec.startsWith("http") || spec.startsWith("#")) return full;
		const resolved = resolvePath(entry, spec);
		const uri = resolved ? assetUri.get(resolved) : void 0;
		return uri ? `url("${uri}")` : full;
	});
	const meta = `<meta http-equiv="Content-Security-Policy" content="${CSP}">`;
	if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, (open) => `${open}${meta}`);
	else html = `<!DOCTYPE html><html><head><meta charset="utf-8">${meta}</head><body>${html}</body></html>`;
	return {
		html,
		entry
	};
}
//#endregion
export { validatePacked as i, isTextPath as n, mimeFor as r, buildSrcdoc as t };
