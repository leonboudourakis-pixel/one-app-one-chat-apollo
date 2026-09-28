import { o as __toESM } from "../_runtime.mjs";
import { a as aspectLabel, t as ASPECTS } from "./model-Drbfu5LE.mjs";
import { C as require_jsx_runtime, X as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as getServerFnById, i as TSS_SERVER_FUNCTION, r as createServerFn } from "./ssr.mjs";
import { a as hasGateSessionMarker } from "./server-Bbqo_MVt.mjs";
import { i as signOut } from "./client-1vAx-gM_.mjs";
import { r as useCurrentUser } from "./login-panel-fM-BOleF.mjs";
import { t as authMiddleware } from "./middleware-X_sruB8u.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/bot-assign-DP7Isxl3.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var subscribeToNothing = () => () => {};
var noGateSessionOnServer = () => false;
/**
* Minimal signed-in identity chip + sign-out. Restyle freely (see the
* `design-ui` skill). Sign-out is only shown when auth is enabled (the
* disabled-auth dev user has nothing to sign out of) and the session is not
* gate-materialized — behind the gate the next request signs the viewer
* straight back in, so a sign-out control there is a broken loop.
*/
function UserButton() {
	const user = useCurrentUser();
	const [signingOut, setSigningOut] = (0, import_react.useState)(false);
	const gateSession = (0, import_react.useSyncExternalStore)(subscribeToNothing, hasGateSessionMarker, noGateSessionOnServer);
	if (!user) return null;
	const label = user.displayName ?? user.primaryEmail ?? "Account";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [
			user.profileImageUrl ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
				src: user.profileImageUrl,
				alt: "",
				className: "h-8 w-8 rounded-full object-cover"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "grid h-8 w-8 place-items-center rounded-full bg-black/10 text-sm font-medium dark:bg-white/20",
				children: label.charAt(0).toUpperCase()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-medium",
				children: label
			}),
			!gateSession && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				disabled: signingOut,
				onClick: () => {
					setSigningOut(true);
					signOut().catch(() => setSigningOut(false));
				},
				className: "cursor-pointer text-sm underline-offset-4 opacity-70 hover:underline disabled:cursor-wait disabled:no-underline",
				children: signingOut ? "Signing out…" : "Sign out"
			})
		]
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var listRooms = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("c1b4ea2e83ce749ba861782871dd99f0cabe4bb15a2313b241f73a8ed4b561b4"));
var deleteRoom = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("1178b373cc0ec5886b272ca96e974dc208b9c80753b140da92691afa23c422e2"));
var createRoom = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("614050903d32a4e12de47f1b890e8c707a39c9903d7899b164de09c68eb0309a"));
var buildPiece = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("a47a538f64229ffa978a5c4ed0e963ab878b31fb84c3a4cfb096d933ee2eff88"));
var openRoom = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("954ba4ec906ef457c20c9eb6db4a43d7290479a265b0c6d36ebd54f2b33b18e9"));
var joinRoom = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("f17cbff57057ef20bf8d10da13ee78854c22c50c284080d6b4a4984ab1278159"));
var moveSeat = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("3fd5adc848606d3ed5633932d5e719c3b4a7535d4d9950ae11b9d09847f18f35"));
createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("c7faedac15c8d5503193d88bf795033a2c71471d4a58278ef24c7eac23161fdf"));
var sendChat = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("917df3c869fe0f0007a1067d713605aae969521dffd629c585fef9db3bc3d148"));
var saveBundle = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("077e33d15b73b03e8d7da3fce405f8bea79bbd358f6c39fa73f0d1f95de9dbac"));
var clearBundle = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("6ef24dfb3e6f3fa4c03af78b1f87e3909815e3d78129c4c46ba1b6f00af75765"));
var getBundle = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("c677054243bde15ac0820f0180d240bc49063dcbf6938030f3e3a6702fb9e871"));
var listAccountDuties = createServerFn({ method: "POST" }).middleware([authMiddleware]).handler(createSsrRpc("c3d72cfb9c29ca851620897bb9f224f1a118fa2a11dd940f6eec905cbd66a268"));
var saveAccountDuty = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("a0438e8ea77d0b25ea31f09738b4014c4ae274a6083f347fac1f4c7a17dc5dc1"));
var removeAccountDuty = createServerFn({ method: "POST" }).middleware([authMiddleware]).validator((data) => data).handler(createSsrRpc("71ef476f7b81f07712670fccb920d0040aa506e12bf2147ea6ddba2b41901db7"));
function AccountDuties({ compact = false }) {
	const [duties, setDuties] = (0, import_react.useState)([]);
	const [email, setEmail] = (0, import_react.useState)("");
	const [brief, setBrief] = (0, import_react.useState)("");
	const [roles, setRoles] = (0, import_react.useState)([]);
	const [error, setError] = (0, import_react.useState)(null);
	const [notice, setNotice] = (0, import_react.useState)(null);
	const [pending, setPending] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		let stop = false;
		listAccountDuties().then((result) => {
			if (!stop && result.ok && result.admin) setDuties(result.duties);
		}).catch(() => {
			if (!stop) setError("Couldn't load accounts.");
		});
		return () => {
			stop = true;
		};
	}, []);
	async function onSave(event) {
		event.preventDefault();
		setPending(true);
		setError(null);
		setNotice(null);
		try {
			const result = await saveAccountDuty({ data: {
				email,
				brief,
				roles
			} });
			if (!result.ok) {
				setError(result.error);
				setPending(false);
				return;
			}
			setDuties(result.duties);
			setNotice("Saved. That account follows this the next time they talk to their Grok.");
			setBrief("");
			setRoles([]);
		} catch {
			setError("Couldn't save that.");
		}
		setPending(false);
	}
	async function onRemove(target) {
		setError(null);
		setNotice(null);
		try {
			const result = await removeAccountDuty({ data: { email: target } });
			if (!result.ok) {
				setError(result.error);
				return;
			}
			setDuties(result.duties);
		} catch {
			setError("Couldn't remove that account.");
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: compact ? "flex flex-col gap-3" : "panel flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [!compact && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl",
				children: "What an account can do"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: compact ? "text-sm text-muted" : "mt-1 text-sm text-muted",
				children: "Pick every role this person should have. One account can hold several. The sentence can name more."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "flex flex-col gap-3",
				onSubmit: (event) => void onSave(event),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex flex-col gap-1 text-sm font-medium",
						children: ["Account email", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: "field",
							type: "email",
							value: email,
							onChange: (event) => setEmail(event.target.value),
							placeholder: "someone@gmail.com",
							autoComplete: "off",
							required: true
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
						className: "flex flex-col gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
							className: "text-sm font-medium",
							children: "Roles"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-2 gap-2",
							children: ASPECTS.map((item) => {
								const on = roles.includes(item.id);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									"aria-pressed": on,
									className: on ? "btn btn-primary" : "btn btn-ghost",
									onClick: () => setRoles((current) => current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]),
									children: item.label
								}, item.id);
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex flex-col gap-1 text-sm font-medium",
						children: ["Note", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							className: "field composer",
							value: brief,
							onChange: (event) => setBrief(event.target.value),
							placeholder: "Look and logic. Keep the page quiet.",
							maxLength: 400
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "btn btn-steel",
						type: "submit",
						disabled: pending,
						children: pending ? "Saving…" : "Save"
					})
				]
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				role: "alert",
				className: "text-sm font-medium",
				children: error
			}),
			notice && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted",
				children: notice
			}),
			duties.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "border-t border-line",
				children: duties.map((duty) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex flex-col gap-2 border-b border-line py-3 sm:flex-row sm:items-start sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate font-medium",
								children: duty.email
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: duty.brief
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted",
								children: duty.allowed.length === 0 ? "Cannot change the app." : `Roles: ${duty.allowed.map((id) => aspectLabel(id)).join(", ")}.`
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-ghost",
							onClick: () => {
								setEmail(duty.email);
								setBrief(duty.brief);
								setRoles(duty.allowed);
								setNotice(null);
							},
							children: "Edit"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-ghost",
							onClick: () => void onRemove(duty.email),
							children: "Remove"
						})]
					})]
				}, duty.email))
			})
		]
	});
}
//#endregion
export { createRoom as a, joinRoom as c, moveSeat as d, openRoom as f, clearBundle as i, listAccountDuties as l, sendChat as m, UserButton as n, deleteRoom as o, saveBundle as p, buildPiece as r, getBundle as s, AccountDuties as t, listRooms as u };
