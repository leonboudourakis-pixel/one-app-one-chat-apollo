import { createFileRoute } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Lobby } from "@/components/bench/lobby";
import { LoginPanel, ShellSkeleton } from "@/components/bench/login-panel";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <ShellSkeleton />;
  if (!user) return <LoginPanel />;
  return <Lobby />;
}
