import { C as require_jsx_runtime, b as Navigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as useCurrentUserState, n as ShellSkeleton, t as LoginPanel } from "./login-panel-fM-BOleF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-CYlhVouj.js
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	const { user, isPending } = useCurrentUserState();
	if (isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShellSkeleton, {});
	if (user) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Navigate, { to: "/" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoginPanel, {});
}
//#endregion
export { Login as component };
