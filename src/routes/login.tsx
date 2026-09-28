import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { LoginPanel, ShellSkeleton } from "@/components/bench/login-panel";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <ShellSkeleton />;
  if (user) return <Navigate to="/" />;
  return <LoginPanel />;
}
