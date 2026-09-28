import { o as __toESM } from "./_runtime.mjs";
import { i as validatePacked, n as isTextPath, r as mimeFor, t as buildSrcdoc } from "./_ssr/files-C7P5IyM5.mjs";
import { a as aspectLabel, c as describeGrant, o as benchBlurb, r as PROMPTS, t as ASPECTS } from "./_ssr/model-Drbfu5LE.mjs";
import { C as require_jsx_runtime, X as require_react, b as Navigate, x as useNavigate, y as Link } from "./_libs/@tanstack/react-router+[...].mjs";
import { n as Route$1 } from "./_ssr/router-DnwfWppm.mjs";
import { i as useCurrentUserState, n as ShellSkeleton } from "./_ssr/login-panel-fM-BOleF.mjs";
import { c as joinRoom, d as moveSeat, f as openRoom, i as clearBundle, m as sendChat, n as UserButton, o as deleteRoom, p as saveBundle, r as buildPiece, s as getBundle, t as AccountDuties } from "./_ssr/bot-assign-DP7Isxl3.mjs";
import { t as unzipSync } from "./_libs/fflate.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/_code-DjDa8FNg.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SAMPLE_LABEL = "desk-lamp";
var SAMPLE_SITE = [
	{
		path: "index.html",
		mime: "text/html",
		encoding: "utf8",
		data: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Desk lamp</title>
  <link rel="stylesheet" href="styles.css" />
</head>
<body>
  <main>
    <p class="kicker">Dropped site</p>
    <h1>Desk lamp</h1>
    <p>A small page from a zip. The lamp uses the stylesheet and script packed beside this file.</p>
    <button id="lamp" type="button">Turn the lamp on</button>
    <p id="status">The desk is dark.</p>
  </main>
  <script src="main.js"><\/script>
</body>
</html>`
	},
	{
		path: "styles.css",
		mime: "text/css",
		encoding: "utf8",
		data: `:root { color-scheme: light; }
* { box-sizing: border-box; }
body {
  margin: 0;
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #241c16;
  color: #f4efe6;
  font: 18px/1.5 Georgia, "Iowan Old Style", serif;
}
body.on { background: #f4efe6; color: #241c16; }
main { width: min(36rem, calc(100% - 2rem)); }
.kicker { letter-spacing: 0.14em; text-transform: uppercase; font: 12px/1.4 ui-sans-serif, system-ui, sans-serif; }
h1 { font-size: 3rem; font-weight: 500; margin: 0.2rem 0 0.6rem; }
button {
  margin-top: 1rem;
  min-height: 44px;
  padding: 0 1rem;
  border: 1px solid currentColor;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}
#status { font: 15px/1.4 ui-sans-serif, system-ui, sans-serif; }`
	},
	{
		path: "main.js",
		mime: "text/javascript",
		encoding: "utf8",
		data: `const button = document.querySelector("#lamp");
const status = document.querySelector("#status");
let on = false;
button.addEventListener("click", () => {
  on = !on;
  document.body.classList.toggle("on", on);
  button.textContent = on ? "Turn the lamp off" : "Turn the lamp on";
  status.textContent = on ? "The desk is lit." : "The desk is dark.";
});`
	}
];
var MAX_ZIP_BYTES = 15e5;
var MAX_FILE_BYTES = 35e4;
function toBase64(bytes) {
	let binary = "";
	const step = 32768;
	for (let index = 0; index < bytes.length; index += step) binary += String.fromCharCode(...bytes.subarray(index, index + step));
	return btoa(binary);
}
function unpackZip(bytes) {
	if (bytes.byteLength > MAX_ZIP_BYTES) return { error: "That zip is too large to run in the room." };
	let extracted;
	try {
		let claimed = 0;
		extracted = unzipSync(bytes, { filter(file) {
			if (file.compression !== 0 && file.compression !== 8) return false;
			if (file.originalSize > MAX_FILE_BYTES) return false;
			if (claimed + file.originalSize > MAX_ZIP_BYTES) return false;
			claimed += file.originalSize;
			return true;
		} });
	} catch {
		return { error: "That file is not a zip this preview can open." };
	}
	const packed = [];
	for (const [name, data] of Object.entries(extracted)) {
		const mime = mimeFor(name);
		if (!mime || !data?.length) continue;
		if (isTextPath(name)) packed.push({
			path: name,
			mime,
			encoding: "utf8",
			data: new TextDecoder("utf-8", { fatal: false }).decode(data)
		});
		else packed.push({
			path: name,
			mime,
			encoding: "base64",
			data: toBase64(data)
		});
	}
	return validatePacked(packed);
}
function isUnauthorized(err) {
	const message = err instanceof Error ? err.message : String(err);
	return /unauthorized/i.test(message);
}
function mergeMessages(prev, next) {
	const map = new Map(prev.map((message) => [message.id, message]));
	for (const message of next) map.set(message.id, message);
	return [...map.values()].sort((a, b) => a.id - b.id);
}
function Studio({ code }) {
	const roomCode = code.toUpperCase();
	const navigate = useNavigate();
	const [phase, setPhase] = (0, import_react.useState)({ kind: "loading" });
	const [name, setName] = (0, import_react.useState)("");
	const [you, setYou] = (0, import_react.useState)("graphics");
	const [seats, setSeats] = (0, import_react.useState)([]);
	const [spec, setSpec] = (0, import_react.useState)(null);
	const [reach, setReach] = (0, import_react.useState)(["graphics"]);
	const [dutyBrief, setDutyBrief] = (0, import_react.useState)(null);
	const [admin, setAdmin] = (0, import_react.useState)(false);
	const [canDelete, setCanDelete] = (0, import_react.useState)(false);
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [bundleRevision, setBundleRevision] = (0, import_react.useState)(0);
	const [bundleLabel, setBundleLabel] = (0, import_react.useState)(null);
	const [files, setFiles] = (0, import_react.useState)(null);
	const [loadedBundle, setLoadedBundle] = (0, import_react.useState)(-1);
	const [view, setView] = (0, import_react.useState)("site");
	const [mobileTab, setMobileTab] = (0, import_react.useState)("chat");
	const [text, setText] = (0, import_react.useState)("");
	const [buildText, setBuildText] = (0, import_react.useState)("");
	const [sending, setSending] = (0, import_react.useState)(false);
	const [building, setBuilding] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [siteError, setSiteError] = (0, import_react.useState)(null);
	const [siteBusy, setSiteBusy] = (0, import_react.useState)(false);
	const [joinAspect, setJoinAspect] = (0, import_react.useState)(null);
	const [copied, setCopied] = (0, import_react.useState)(false);
	const [hot, setHot] = (0, import_react.useState)(false);
	const afterRef = (0, import_react.useRef)(0);
	const phaseRef = (0, import_react.useRef)("loading");
	const listRef = (0, import_react.useRef)(null);
	const fileRef = (0, import_react.useRef)(null);
	phaseRef.current = phase.kind;
	function applyRoom(room, how) {
		setName(room.name);
		setYou(room.you);
		setSeats(room.seats);
		setSpec(room.spec);
		setReach(room.reach ?? [room.you]);
		setDutyBrief(room.dutyBrief ?? null);
		setAdmin(room.admin === true);
		setCanDelete(room.canDelete === true);
		setBundleRevision(room.bundleRevision);
		setBundleLabel(room.bundleLabel);
		setMessages((prev) => {
			const next = how === "replace" ? room.messages : mergeMessages(prev, room.messages);
			afterRef.current = next.at(-1)?.id ?? afterRef.current;
			return next;
		});
		setPhase({ kind: "room" });
	}
	(0, import_react.useEffect)(() => {
		let stop = false;
		setPhase({ kind: "loading" });
		afterRef.current = 0;
		setMessages([]);
		setFiles(null);
		setLoadedBundle(-1);
		setView("site");
		openRoom({ data: {
			code: roomCode,
			afterId: 0
		} }).then((result) => {
			if (stop) return;
			if (!result.ok) {
				setError(result.error);
				setPhase({ kind: "missing" });
				return;
			}
			if (result.status === "missing") setPhase({ kind: "missing" });
			else if (result.status === "join") {
				setName(result.name);
				const open = ASPECTS.find((aspect) => !result.taken.includes(aspect.id))?.id ?? null;
				setJoinAspect(open);
				setPhase({
					kind: "join",
					name: result.name,
					taken: result.taken
				});
			} else applyRoom(result.room, "replace");
		}).catch((err) => {
			if (stop) return;
			if (isUnauthorized(err)) navigate({ to: "/login" });
			else setPhase({ kind: "missing" });
		});
		return () => {
			stop = true;
		};
	}, [roomCode, navigate]);
	(0, import_react.useEffect)(() => {
		if (phase.kind !== "room") return;
		let stop = false;
		let timer = 0;
		const loop = async () => {
			if (stop) return;
			try {
				if (document.visibilityState === "visible" && phaseRef.current === "room") {
					const result = await openRoom({ data: {
						code: roomCode,
						afterId: afterRef.current
					} });
					if (!stop && result.ok && result.status === "room") applyRoom(result.room, "merge");
				}
			} catch (err) {
				if (!stop && isUnauthorized(err)) navigate({ to: "/login" });
			} finally {
				if (!stop) timer = window.setTimeout(() => void loop(), 1500);
			}
		};
		timer = window.setTimeout(() => void loop(), 1500);
		return () => {
			stop = true;
			window.clearTimeout(timer);
		};
	}, [
		phase.kind,
		roomCode,
		navigate
	]);
	(0, import_react.useEffect)(() => {
		if (phase.kind !== "room") return;
		if (bundleRevision === loadedBundle) return;
		if (bundleRevision === 0) {
			setFiles(null);
			setLoadedBundle(0);
			return;
		}
		let stop = false;
		getBundle({ data: { code: roomCode } }).then((result) => {
			if (stop) return;
			if (!result.ok) {
				setSiteError(result.error);
				return;
			}
			setFiles(result.files);
			setBundleLabel(result.label);
			setLoadedBundle(result.bundleRevision);
			if (result.files) setView("site");
		}).catch(() => {
			if (!stop) setSiteError("The site preview could not be loaded.");
		});
		return () => {
			stop = true;
		};
	}, [
		bundleRevision,
		loadedBundle,
		phase.kind,
		roomCode
	]);
	(0, import_react.useEffect)(() => {
		const node = listRef.current;
		if (!node) return;
		node.scrollTop = node.scrollHeight;
	}, [messages.length]);
	(0, import_react.useEffect)(() => {
		document.title = name ? `${name} · Splitbench` : "Splitbench";
		return () => {
			document.title = "Splitbench";
		};
	}, [name]);
	const srcdoc = (0, import_react.useMemo)(() => files ? buildSrcdoc(files) : null, [files]);
	const taken = new Set(seats.map((seat) => seat.aspect));
	const openSeats = ASPECTS.filter((aspect) => aspect.id === you || !taken.has(aspect.id));
	async function build(body) {
		const trimmed = body.trim();
		if (!trimmed || building) return;
		setBuilding(true);
		setError(null);
		try {
			const result = await buildPiece({ data: {
				code: roomCode,
				prompt: trimmed
			} });
			if (!result.ok) {
				setError(result.error);
				return;
			}
			setBuildText("");
			applyRoom(result.room, "replace");
			setView("site");
		} catch (err) {
			if (isUnauthorized(err)) navigate({ to: "/login" });
			else setError("The build did not finish.");
		} finally {
			setBuilding(false);
		}
	}
	async function send(body) {
		const trimmed = body.trim();
		if (!trimmed || sending) return;
		setSending(true);
		setError(null);
		setText("");
		try {
			const result = await sendChat({ data: {
				code: roomCode,
				body: trimmed,
				afterId: afterRef.current
			} });
			if (!result.ok) {
				setText(trimmed);
				setError(result.error);
				return;
			}
			applyRoom(result.room, "merge");
		} catch (err) {
			setText(trimmed);
			if (isUnauthorized(err)) navigate({ to: "/login" });
			else setError("The message did not send.");
		} finally {
			setSending(false);
		}
	}
	async function publishFiles(next, label) {
		setSiteBusy(true);
		setSiteError(null);
		try {
			const result = await saveBundle({ data: {
				code: roomCode,
				label,
				files: next
			} });
			if (!result.ok) {
				setSiteError(result.error);
				return;
			}
			setFiles(next);
			setBundleLabel(result.label);
			setBundleRevision(result.bundleRevision);
			setLoadedBundle(result.bundleRevision);
			setView("site");
		} catch (err) {
			if (isUnauthorized(err)) navigate({ to: "/login" });
			else setSiteError("The zip could not be shared.");
		} finally {
			setSiteBusy(false);
		}
	}
	async function onFile(file) {
		if (!file.name.toLowerCase().endsWith(".zip")) {
			setSiteError("Drop a .zip file.");
			return;
		}
		const unpacked = unpackZip(new Uint8Array(await file.arrayBuffer()));
		if ("error" in unpacked) {
			setSiteError(unpacked.error);
			return;
		}
		await publishFiles(unpacked.files, file.name);
	}
	async function copyLink() {
		try {
			await navigator.clipboard.writeText(`${window.location.origin}/r/${roomCode}`);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1400);
		} catch {
			setError("Copy the code by hand.");
		}
	}
	if (phase.kind === "loading") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 px-4 py-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 w-40 animate-pulse rounded-md bg-line" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-64 animate-pulse rounded-xl bg-line" })]
	});
	if (phase.kind === "missing") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-4 px-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "font-display text-4xl",
				children: "No room uses that code."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-muted",
				children: error ?? "Check the six characters and try again."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
				to: "/",
				className: "btn btn-primary w-fit",
				children: "Back to rooms"
			})
		]
	});
	if (phase.kind === "join") {
		const free = ASPECTS.filter((aspect) => !phase.taken.includes(aspect.id));
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-4 px-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted",
					children: roomCode
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "font-display text-4xl",
					children: phase.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-muted",
					children: "Pick an open craft. Your Grok will be locked to it."
				}),
				free.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-medium",
					children: "Every craft in this room is taken."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "panel flex flex-col gap-3",
					onSubmit: (event) => {
						event.preventDefault();
						if (!joinAspect) return;
						setError(null);
						joinRoom({ data: {
							code: roomCode,
							aspect: joinAspect
						} }).then((result) => {
							if (!result.ok) {
								setError(result.error);
								return;
							}
							applyRoom(result.room, "replace");
						}).catch((err) => {
							if (isUnauthorized(err)) navigate({ to: "/login" });
							else setError("Couldn't take that seat.");
						});
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-2 gap-2",
							children: ASPECTS.map((aspect) => {
								const blocked = phase.taken.includes(aspect.id);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: blocked,
									"aria-pressed": joinAspect === aspect.id,
									className: joinAspect === aspect.id ? "btn btn-primary" : "btn btn-ghost",
									onClick: () => setJoinAspect(aspect.id),
									children: aspect.label
								}, aspect.id);
							})
						}),
						error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: error
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							className: "btn btn-steel",
							type: "submit",
							disabled: !joinAspect,
							children: "Sit down"
						})
					]
				})
			]
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "room",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "font-display text-2xl",
						children: "Splitbench"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate font-medium",
							children: name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted",
							children: [
								roomCode,
								" · you are ",
								aspectLabel(you)
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-ghost",
						onClick: () => void copyLink(),
						children: copied ? "Copied" : "Copy link"
					}),
					canDelete && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-ghost",
						onClick: () => {
							if (!window.confirm(`Delete ${name || "this project"}? The app and the chat go with it.`)) return;
							deleteRoom({ data: { code: roomCode } }).then((result) => {
								if (!result.ok) {
									setError(result.error);
									return;
								}
								navigate({ to: "/" });
							});
						},
						children: "Delete"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "room-main",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: `side side-chat ${mobileTab !== "chat" ? "is-hidden" : ""}`,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								ref: listRef,
								className: "scroll flex flex-col gap-3 px-4 py-4",
								children: [messages.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-muted",
									children: "This project is a blank app. Type what to build, or ask Grok to change a role you hold."
								}), messages.map((message) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Message, { message }, message.id))]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								className: "flex items-end gap-2 border-t border-line px-4 py-3",
								onSubmit: (event) => {
									event.preventDefault();
									build(buildText);
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium",
									htmlFor: "build",
									children: ["Type what to build", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										id: "build",
										className: "field",
										value: buildText,
										placeholder: "A grocery list you can check off",
										maxLength: 800,
										onChange: (event) => setBuildText(event.target.value)
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									className: "btn btn-steel",
									type: "submit",
									disabled: building || !buildText.trim(),
									children: building ? "Building…" : "Build"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								className: "flex flex-col gap-2 border-t border-line px-4 py-3",
								onSubmit: (event) => {
									event.preventDefault();
									send(text);
								},
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "text-sm font-medium",
										htmlFor: "ask",
										children: ["Ask ", admin ? "Grok" : aspectLabel(you)]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										id: "ask",
										className: "field composer",
										value: text,
										placeholder: admin ? "Change the app. You can edit every role." : dutyBrief ? dutyBrief : reach.length <= 1 ? `Only the ${aspectLabel(you).toLowerCase()} role will change.` : `Your Grok can change ${describeGrant(reach)}.`,
										onChange: (event) => setText(event.target.value),
										onKeyDown: (event) => {
											if (event.key === "Enter" && !event.shiftKey) {
												event.preventDefault();
												send(text);
											}
										}
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex flex-wrap gap-2",
										children: reach.flatMap((role) => PROMPTS[role].slice(0, 1).map((prompt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "btn btn-ghost",
											disabled: sending,
											onClick: () => void send(prompt),
											children: prompt
										}, prompt)))
									}),
									error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-medium",
										children: error
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										className: "btn btn-primary",
										type: "submit",
										disabled: sending || !text.trim(),
										children: sending ? "Asking…" : "Send"
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "stage-wrap",
						onDragEnter: (event) => {
							event.preventDefault();
							setHot(true);
						},
						onDragOver: (event) => event.preventDefault(),
						onDragLeave: () => setHot(false),
						onDrop: (event) => {
							event.preventDefault();
							setHot(false);
							const file = event.dataTransfer.files[0];
							if (file) onFile(file);
						},
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-2 px-3 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium",
									children: "App"
								}), bundleLabel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm text-stagefg",
									children: bundleLabel
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "stage-view",
								children: [
									srcdoc?.html ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
										title: bundleLabel ?? "Dropped site",
										sandbox: "allow-scripts allow-forms allow-popups",
										referrerPolicy: "no-referrer",
										srcDoc: srcdoc.html,
										className: "h-full w-full border-0 bg-sheet"
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: hot ? "drop is-hot" : "drop",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-display text-3xl text-stagefg",
												children: "Blank app"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "max-w-sm text-sm text-stagefg opacity-75",
												children: "Type what to build and it runs here for everyone in the room. Or drop a zip."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-wrap justify-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													className: "btn btn-primary",
													onClick: () => fileRef.current?.click(),
													disabled: siteBusy,
													children: siteBusy ? "Reading…" : "Choose a zip"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													type: "button",
													className: "btn btn-ghost",
													disabled: siteBusy,
													onClick: () => void publishFiles(SAMPLE_SITE, SAMPLE_LABEL),
													children: "Run the sample site"
												})]
											}),
											siteError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm font-medium text-stagefg",
												children: siteError
											})
										]
									}),
									srcdoc?.html && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "absolute right-3 bottom-3 flex flex-wrap justify-end gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "btn btn-ghost",
											onClick: () => fileRef.current?.click(),
											disabled: siteBusy,
											children: "Replace zip"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "btn btn-ghost",
											onClick: () => {
												clearBundle({ data: { code: roomCode } }).then(() => {
													setFiles(null);
													setBundleLabel(null);
													setBundleRevision(0);
													setLoadedBundle(0);
												});
											},
											children: "Clear site"
										})]
									}),
									hot && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "absolute inset-0 grid place-items-center bg-stage/80 text-stagefg",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "font-display text-3xl",
											children: "Drop to run it"
										})
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								ref: fileRef,
								className: "hidden",
								type: "file",
								accept: ".zip,application/zip",
								onChange: (event) => {
									const file = event.target.files?.[0];
									event.target.value = "";
									if (file) onFile(file);
								}
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: `side side-bench ${mobileTab !== "bench" ? "is-hidden" : ""}`,
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "scroll flex flex-col gap-4 px-4 py-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
									className: "font-display text-2xl",
									children: reach.length > 1 || admin ? "Roles" : aspectLabel(you)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-sm text-muted",
									children: benchBlurb(you, reach, dutyBrief)
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "flex flex-col gap-2",
									children: reach.map((role) => {
										const item = ASPECTS.find((aspect) => aspect.id === role);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "border-b border-line py-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-medium",
												children: item?.label
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-sm text-muted",
												children: item?.blurb
											})]
										}, role);
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "flex flex-col gap-1 text-sm font-medium",
									children: ["Seat", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										className: "field",
										value: you,
										onChange: (event) => {
											const next = event.target.value;
											if (!next) return;
											moveSeat({ data: {
												code: roomCode,
												aspect: next,
												afterId: afterRef.current
											} }).then((result) => {
												if (!result.ok) {
													setError(result.error);
													return;
												}
												applyRoom(result.room, "merge");
											});
										},
										children: openSeats.map((aspect) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: aspect.id,
											children: aspect.label
										}, aspect.id))
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "border-t border-line pt-3",
									children: ASPECTS.map((aspect) => {
										const seat = seats.find((item) => item.aspect === aspect.id);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "flex items-baseline justify-between gap-3 py-1 text-sm",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: seat?.mine ? "font-medium" : "text-muted",
												children: aspect.label
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted",
												children: seat ? `${seat.displayName}${seat.online ? "" : " · away"}` : "Open"
											})]
										}, aspect.id);
									})
								}),
								admin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
									className: "border-t border-line pt-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
										className: "flex min-h-11 cursor-pointer items-center text-sm font-medium",
										children: "What an account can do"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "pt-3",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountDuties, { compact: true })
									})]
								})
							]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "tabbar",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: mobileTab === "chat" ? "btn btn-primary flex-1" : "btn btn-ghost flex-1",
					onClick: () => setMobileTab("chat"),
					children: "Chat"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: mobileTab === "bench" ? "btn btn-primary flex-1" : "btn btn-ghost flex-1",
					onClick: () => setMobileTab("bench"),
					children: "Bench"
				})]
			})
		]
	});
}
function Message({ message }) {
	if (message.kind === "system") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "px-2 text-center text-sm text-muted",
		children: message.body
	});
	if (message.kind === "note") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
		className: "text-sm text-muted",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-medium text-ink",
				children: message.displayName
			}),
			" · ",
			message.body
		]
	});
	if (message.kind === "bot") return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border-l-2 border-steel pl-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm font-medium text-steel",
			children: message.displayName === "Build" ? "Build" : `${aspectLabel(message.aspect)} Grok`
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm",
			children: message.body
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: message.mine ? "ml-8" : "mr-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mb-1 text-sm text-muted",
			children: message.mine ? "You" : message.displayName
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: message.mine ? "rounded-xl bg-ink px-3 py-2 text-sm text-paper" : "rounded-xl border border-line bg-sheet px-3 py-2 text-sm",
			children: message.body
		})]
	});
}
function RoomPage() {
	const { code } = Route$1.useParams();
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShellSkeleton, {});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/login" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Studio, { code });
}
//#endregion
export { RoomPage as component };
