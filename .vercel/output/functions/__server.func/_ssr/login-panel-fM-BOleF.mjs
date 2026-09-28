import { o as __toESM } from "../_runtime.mjs";
import { t as ASPECTS } from "./model-Drbfu5LE.mjs";
import { C as require_jsx_runtime, X as require_react, y as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as GROK_PROVIDERS } from "./server-Bbqo_MVt.mjs";
import { r as signIn, t as authClient } from "./client-1vAx-gM_.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-panel-fM-BOleF.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
/**
* Current user + loading state. Same behavior in live preview and when deployed:
*   - Auth enabled -> the real signed-in user; `user` is `null` while
*                            the session resolves (`isPending: true`) and when
*                            signed out (`isPending: false`). Session comes from
*                            Better Auth `useSession()` → `/api/auth/get-session`
*                            (cookie when deployed; bearer in live preview).
*   - Auth disabled (`VITE_AUTH_ENABLED=false`) -> `DEV_USER`, never pending.
*
* Protect a route by waiting out `isPending` before acting on `user` —
* redirecting on `user: null` alone bounces signed-in visitors to sign-in on
* every hard reload:
*
*   import { RedirectToSignIn } from "@/lib/auth/gates";
*   const { user, isPending } = useCurrentUserState();
*   if (isPending) return null;              // still resolving — don't redirect yet
*   if (!user) return <RedirectToSignIn />;  // definitely signed out
*
* `authEnabled` is a module-level constant fixed at load, so the guarded hook
* call keeps a stable hook order across every render of a given component.
*/
function useCurrentUserState() {
	const { data, isPending } = authClient.useSession();
	const user = data?.user;
	return {
		user: user ? {
			id: user.id,
			displayName: user.name ?? null,
			primaryEmail: user.email ?? null,
			profileImageUrl: user.image ?? null,
			isDevFallback: false
		} : null,
		isPending
	};
}
/**
* Convenience view of `useCurrentUserState().user` for display (e.g.
* `user?.displayName ?? "Guest"`). NOTE: `null` means *loading OR signed out* —
* for redirects/guards use `useCurrentUserState()` and check `isPending`.
*/
function useCurrentUser() {
	return useCurrentUserState().user;
}
function ShellSkeleton() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-4 py-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-8 w-36 animate-pulse rounded-md bg-line" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-14 max-w-xl animate-pulse rounded-md bg-line" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-48 max-w-xl animate-pulse rounded-xl bg-line" })
		]
	});
}
function LoginPanel() {
	const [mode, setMode] = (0, import_react.useState)("in");
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)(null);
	const [pending, setPending] = (0, import_react.useState)(false);
	async function onEmail(event) {
		event.preventDefault();
		setError(null);
		if (password.length < 8) {
			setError("Use at least 8 characters.");
			return;
		}
		setPending(true);
		try {
			const result = mode === "up" ? await authClient.signUp.email({
				name: name.trim() || "Member",
				email: email.trim(),
				password,
				callbackURL: "/"
			}) : await authClient.signIn.email({
				email: email.trim(),
				password,
				callbackURL: "/"
			});
			if (result.error) {
				setError(result.error.message ?? "Sign-in failed.");
				setPending(false);
				return;
			}
			window.location.assign("/");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Sign-in failed.");
			setPending(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto flex min-h-dvh w-full max-w-5xl flex-col-reverse gap-8 px-4 py-6 lg:flex-row lg:items-start lg:gap-16 lg:py-12",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "max-w-xl flex-1",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-3xl text-ink",
					children: "Splitbench"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-6 font-display text-4xl leading-tight text-ink sm:text-5xl",
					children: "One app. One chat. More than one role."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 max-w-lg text-base text-muted",
					children: "Type what to build and it runs for everyone at the table. The admin can give one person several roles. Drop a zip if you already have the app."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
					className: "mt-8 border-y border-line",
					children: ASPECTS.map((aspect) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
						className: "flex flex-col gap-1 border-b border-line py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium",
							children: aspect.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm text-muted",
							children: aspect.blurb
						})]
					}, aspect.id))
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "panel w-full max-w-md self-start",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-2xl",
					children: "Sign in with Google"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "Use Google. Admin controls follow apollo.liuboudourakis@gmail.com."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 flex flex-col gap-2",
					children: [GROK_PROVIDERS.filter((provider) => provider.idp === "google").map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						className: "btn btn-primary btn-wide",
						type: "button",
						onClick: () => {
							setError(null);
							signIn(provider.providerId, { callbackURL: "/" }).catch((err) => {
								setError(err instanceof Error ? err.message : "Google sign-in failed.");
							});
						},
						children: "Sign in with Google"
					}, provider.providerId)), GROK_PROVIDERS.filter((provider) => provider.idp !== "google").map((provider) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						className: "btn btn-ghost btn-wide",
						type: "button",
						onClick: () => {
							setError(null);
							signIn(provider.providerId, { callbackURL: "/" }).catch((err) => {
								setError(err instanceof Error ? err.message : "Sign-in failed.");
							});
						},
						children: ["Continue with ", provider.label]
					}, provider.providerId))]
				}),
				error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					role: "alert",
					className: "mt-3 text-sm font-medium",
					children: error
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
					className: "mt-4 border-t border-line pt-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
						className: "flex min-h-11 cursor-pointer items-center text-sm font-medium",
						children: "Or use email"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						className: "mt-3 flex flex-col gap-3",
						onSubmit: (event) => void onEmail(event),
						children: [
							mode === "up" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex flex-col gap-1 text-sm font-medium",
								children: ["Name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "field",
									value: name,
									onChange: (event) => setName(event.target.value),
									autoComplete: "name",
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex flex-col gap-1 text-sm font-medium",
								children: ["Email", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "field",
									type: "email",
									value: email,
									onChange: (event) => setEmail(event.target.value),
									autoComplete: "email",
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex flex-col gap-1 text-sm font-medium",
								children: ["Password", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "field",
									type: "password",
									value: password,
									onChange: (event) => setPassword(event.target.value),
									autoComplete: mode === "up" ? "new-password" : "current-password",
									required: true
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "btn btn-steel btn-wide",
								type: "submit",
								disabled: pending,
								children: pending ? "Signing in…" : mode === "up" ? "Create account" : "Sign in with email"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								className: "text-sm font-medium text-muted underline-offset-4 hover:underline",
								type: "button",
								onClick: () => {
									setMode(mode === "up" ? "in" : "up");
									setError(null);
								},
								children: mode === "up" ? "Already have an account?" : "Need an account?"
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-4 text-sm text-muted",
					children: ["Already seated? ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
						to: "/",
						className: "font-medium text-ink underline-offset-4 hover:underline",
						children: "Go to your projects"
					})]
				})
			]
		})]
	});
}
//#endregion
export { useCurrentUserState as i, ShellSkeleton as n, useCurrentUser as r, LoginPanel as t };
