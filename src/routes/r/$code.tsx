import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ShellSkeleton } from "@/components/bench/login-panel";
import { Studio } from "@/components/bench/studio";

export const Route = createFileRoute("/r/$code")({ component: RoomPage });

function RoomPage() {
  const { code } = Route.useParams();
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <ShellSkeleton />;
  if (!user) return <Navigate to="/login" />;
  return <Studio code={code} />;
}
