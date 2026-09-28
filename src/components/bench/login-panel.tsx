import { useState, type FormEvent } from "react";
import { Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authClient, signIn } from "@/lib/auth/client";
import { emailAndPasswordEnabled } from "@/lib/auth/email-password";
import { ASPECTS } from "@/lib/bench/model";

export function ShellSkeleton() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <div className="h-8 w-36 animate-pulse rounded-md bg-line" />
      <div className="h-14 max-w-xl animate-pulse rounded-md bg-line" />
      <div className="h-48 max-w-xl animate-pulse rounded-xl bg-line" />
    </main>
  );
}

export function LoginPanel() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onEmail(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    setPending(true);
    try {
      const result =
        mode === "up"
          ? await authClient.signUp.email({
              name: name.trim() || "Member",
              email: email.trim(),
              password,
              callbackURL: "/",
            })
          : await authClient.signIn.email({
              email: email.trim(),
              password,
              callbackURL: "/",
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

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col-reverse gap-8 px-4 py-6 lg:flex-row lg:items-start lg:gap-16 lg:py-12">
      <section className="max-w-xl flex-1">
        <p className="font-display text-3xl text-ink">Splitbench</p>
        <h1 className="mt-6 font-display text-4xl leading-tight text-ink sm:text-5xl">
          One app. One chat. More than one role.
        </h1>
        <p className="mt-4 max-w-lg text-base text-muted">
          Type what to build and it runs for everyone at the table. The admin can give one person several roles.
          Drop a zip if you already have the app.
        </p>
        <ol className="mt-8 border-y border-line">
          {ASPECTS.map((aspect) => (
            <li key={aspect.id} className="flex flex-col gap-1 border-b border-line py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between">
              <span className="font-medium">{aspect.label}</span>
              <span className="text-sm text-muted">{aspect.blurb}</span>
            </li>
          ))}
        </ol>
      </section>
      <section className="panel w-full max-w-md self-start">
        <h2 className="font-display text-2xl">Sign in with Google</h2>
        <p className="mt-1 text-sm text-muted">
          Use Google. Admin controls follow apollo.liuboudourakis@gmail.com.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {GROK_PROVIDERS.filter((provider) => provider.idp === "google").map((provider) => (
            <button
              key={provider.providerId}
              className="btn btn-primary btn-wide"
              type="button"
              onClick={() => {
                setError(null);
                void signIn(provider.providerId, { callbackURL: "/" }).catch((err: unknown) => {
                  setError(err instanceof Error ? err.message : "Google sign-in failed.");
                });
              }}
            >
              Sign in with Google
            </button>
          ))}
          {GROK_PROVIDERS.filter((provider) => provider.idp !== "google").map((provider) => (
            <button
              key={provider.providerId}
              className="btn btn-ghost btn-wide"
              type="button"
              onClick={() => {
                setError(null);
                void signIn(provider.providerId, { callbackURL: "/" }).catch((err: unknown) => {
                  setError(err instanceof Error ? err.message : "Sign-in failed.");
                });
              }}
            >
              Continue with {provider.label}
            </button>
          ))}
        </div>
        {error && (
          <p role="alert" className="mt-3 text-sm font-medium">
            {error}
          </p>
        )}
        {emailAndPasswordEnabled && (
          <details className="mt-4 border-t border-line pt-3">
            <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">Or use email</summary>
            <form className="mt-3 flex flex-col gap-3" onSubmit={(event) => void onEmail(event)}>
            {mode === "up" && (
              <label className="flex flex-col gap-1 text-sm font-medium">
                Name
                <input className="field" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
              </label>
            )}
            <label className="flex flex-col gap-1 text-sm font-medium">
              Email
              <input className="field" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Password
              <input className="field" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "up" ? "new-password" : "current-password"} required />
            </label>
            <button className="btn btn-steel btn-wide" type="submit" disabled={pending}>
              {pending ? "Signing in…" : mode === "up" ? "Create account" : "Sign in with email"}
            </button>
            <button
              className="text-sm font-medium text-muted underline-offset-4 hover:underline"
              type="button"
              onClick={() => {
                setMode(mode === "up" ? "in" : "up");
                setError(null);
              }}
            >
              {mode === "up" ? "Already have an account?" : "Need an account?"}
            </button>
          </form>
          </details>
        )}
        <p className="mt-4 text-sm text-muted">
          Already seated? <Link to="/" className="font-medium text-ink underline-offset-4 hover:underline">Go to your projects</Link>
        </p>
      </section>
    </main>
  );
}
