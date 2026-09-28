import { o as __toESM } from "../_runtime.mjs";
import { a as aspectLabel, t as ASPECTS } from "./model-Drbfu5LE.mjs";
import { C as require_jsx_runtime, X as require_react, x as useNavigate, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as useCurrentUserState, n as ShellSkeleton, t as LoginPanel } from "./login-panel-fM-BOleF.mjs";
import { a as createRoom, c as joinRoom, l as listAccountDuties, n as UserButton, o as deleteRoom, r as buildPiece, t as AccountDuties, u as listRooms } from "./bot-assign-DP7Isxl3.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CGkSzl4j.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function isUnauthorized(err) {
	const message = err instanceof Error ? err.message : String(err);
	return /unauthorized/i.test(message);
}
function Lobby() {
	const navigate = useNavigate();
	const [rooms, setRooms] = (0, import_react.useState)(null);
	const [loadError, setLoadError] = (0, import_react.useState)(null);
	const [mode, setMode] = (0, import_react.useState)("open");
	const [code, setCode] = (0, import_react.useState)("");
	const [aspect, setAspect] = (0, import_react.useState)("graphics");
	const [error, setError] = (0, import_react.useState)(null);
	const [pending, setPending] = (0, import_react.useState)(false);
	const [admin, setAdmin] = (0, import_react.useState)(false);
	const [prompt, setPrompt] = (0, import_react.useState)("");
	const [deleting, setDeleting] = (0, import_react.useState)(null);
	const blankStarted = (0, import_react.useRef)(false);
	(0, import_react.useEffect)(() => {
		let stop = false;
		listRooms().then((result) => {
			if (stop) return;
			if (result.ok) setRooms(result.rooms);
			else setLoadError(result.error);
		}).catch((err) => {
			if (stop) return;
			if (isUnauthorized(err)) {
				navigate({ to: "/login" });
				return;
			}
			setLoadError("Couldn't load your rooms.");
		});
		return () => {
			stop = true;
		};
	}, [navigate]);
	(0, import_react.useEffect)(() => {
		let stop = false;
		listAccountDuties().then((result) => {
			if (stop || !result.ok) return;
			setAdmin(result.admin);
		}).catch(() => {
			if (!stop) setAdmin(false);
		});
		return () => {
			stop = true;
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (!rooms || rooms.length > 0 || blankStarted.current) return;
		blankStarted.current = true;
		createRoom({ data: {
			name: "Untitled",
			aspect: "graphics"
		} }).then((result) => {
			if (result.ok) navigate({
				to: "/r/$code",
				params: { code: result.code }
			});
			else {
				blankStarted.current = false;
				setError(result.error);
			}
		}).catch((err) => {
			blankStarted.current = false;
			if (isUnauthorized(err)) navigate({ to: "/login" });
			else setError("Couldn't open a blank project.");
		});
	}, [rooms, navigate]);
	async function removeProject(code, name) {
		if (deleting) return;
		if (!window.confirm(`Delete ${name}? The app and the chat go with it.`)) return;
		setDeleting(code);
		setLoadError(null);
		try {
			const result = await deleteRoom({ data: { code } });
			if (!result.ok) {
				setLoadError(result.error);
				setDeleting(null);
				return;
			}
			setRooms((current) => current?.filter((room) => room.code !== code) ?? current);
		} catch (err) {
			if (isUnauthorized(err)) navigate({ to: "/login" });
			else setLoadError("Couldn't delete that project.");
		}
		setDeleting(null);
	}
	async function startBlank() {
		setPending(true);
		setError(null);
		try {
			const result = await createRoom({ data: {
				name: "Untitled",
				aspect
			} });
			if (!result.ok) {
				setError(result.error);
				setPending(false);
				return;
			}
			navigate({
				to: "/r/$code",
				params: { code: result.code }
			});
		} catch (err) {
			if (isUnauthorized(err)) navigate({ to: "/login" });
			else setError("Couldn't open a blank project.");
			setPending(false);
		}
	}
	async function onBuild(event) {
		event.preventDefault();
		const typed = prompt.trim();
		if (!typed) return;
		setPending(true);
		setError(null);
		try {
			const created = await createRoom({ data: {
				name: "Untitled",
				aspect,
				blurb: typed
			} });
			if (!created.ok) {
				setError(created.error);
				setPending(false);
				return;
			}
			await buildPiece({ data: {
				code: created.code,
				prompt: typed
			} }).catch(() => void 0);
			navigate({
				to: "/r/$code",
				params: { code: created.code }
			});
		} catch (err) {
			if (isUnauthorized(err)) navigate({ to: "/login" });
			else setError("Couldn't build that.");
			setPending(false);
		}
	}
	async function onJoin(event) {
		event.preventDefault();
		setPending(true);
		setError(null);
		try {
			const result = await joinRoom({ data: {
				code,
				aspect
			} });
			if (!result.ok) {
				setError(result.error);
				setPending(false);
				return;
			}
			navigate({
				to: "/r/$code",
				params: { code: result.room.code }
			});
		} catch (err) {
			if (isUnauthorized(err)) navigate({ to: "/login" });
			else setError("Couldn't join that room.");
			setPending(false);
		}
	}
	if (rooms && rooms.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
			className: "flex items-center justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-3xl",
				children: "Splitbench"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-muted",
			children: error ?? "Opening a blank project…"
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-3xl",
					children: "Splitbench"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserButton, {})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-4xl leading-tight sm:text-5xl",
						children: "Start blank. Type what to build."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 max-w-xl text-muted",
						children: "A new project is an empty stage. Type what you want and it gets built there. Share the code if someone else should sit down with you."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
						className: "mt-8 border-y border-line",
						children: ASPECTS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex flex-col gap-1 border-b border-line py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: item.label
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm text-muted",
								children: item.blurb
							})]
						}, item.id))
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "panel flex flex-col gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: mode === "open" ? "btn btn-primary" : "btn btn-ghost",
							onClick: () => setMode("open"),
							children: "Create"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: mode === "join" ? "btn btn-primary" : "btn btn-ghost",
							onClick: () => setMode("join"),
							children: "Join"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "flex flex-col gap-3",
						onSubmit: (event) => void (mode === "open" ? onBuild(event) : onJoin(event)),
						children: [
							mode === "open" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex flex-col gap-1 text-sm font-medium",
								children: ["Type what to build", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									className: "field composer",
									value: prompt,
									onChange: (event) => setPrompt(event.target.value),
									placeholder: "A grocery list you can check off",
									maxLength: 800
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex flex-col gap-1 text-sm font-medium",
								children: ["Project code", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "field tracking-widest uppercase",
									value: code,
									onChange: (event) => setCode(event.target.value.toUpperCase()),
									placeholder: "ABC234",
									maxLength: 6,
									autoCapitalize: "characters"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
								className: "flex flex-col gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
									className: "text-sm font-medium",
									children: "Your seat"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "grid grid-cols-2 gap-2",
									children: ASPECTS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-pressed": aspect === item.id,
										className: aspect === item.id ? "btn btn-primary" : "btn btn-ghost",
										onClick: () => setAspect(item.id),
										children: item.label
									}, item.id))
								})]
							}),
							error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								role: "alert",
								className: "text-sm font-medium",
								children: error
							}),
							mode === "open" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "btn btn-ghost btn-wide",
								type: "button",
								disabled: pending,
								onClick: () => void startBlank(),
								children: "Start blank"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "btn btn-steel btn-wide",
								type: "submit",
								disabled: pending || mode === "open" && !prompt.trim(),
								children: pending ? "One moment…" : mode === "open" ? "Build" : "Join project"
							})
						]
					})]
				})]
			}),
			admin && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AccountDuties, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: "Your projects"
				}),
				loadError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm font-medium",
					children: loadError
				}),
				rooms === null && !loadError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: "Loading projects…"
				}),
				rooms && rooms.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted",
					children: "No projects yet. Create one and send the code."
				}),
				rooms && rooms.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-2 border-t border-line",
					children: rooms.map((room) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex items-center gap-3 border-b border-line py-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to: "/r/$code",
							params: { code: room.code },
							className: "flex min-h-11 min-w-0 flex-1 items-center justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block truncate font-medium",
									children: room.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-sm text-muted",
									children: [
										room.blurb ? `${room.blurb} · ` : "",
										aspectLabel(room.aspect),
										" · ",
										room.code
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-medium",
								children: "Enter"
							})]
						}), room.canDelete && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-ghost",
							disabled: deleting === room.code,
							onClick: () => void removeProject(room.code, room.name),
							children: deleting === room.code ? "Deleting…" : "Delete"
						})]
					}, room.code))
				})
			] })
		]
	});
}
function Home() {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShellSkeleton, {});
	if (!user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoginPanel, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lobby, {});
}
//#endregion
export { Home as component };
