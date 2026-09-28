import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import { AccountDuties } from "@/components/bench/bot-assign";
import { buildPiece, createRoom, deleteRoom, joinRoom, listAccountDuties, listRooms } from "@/lib/bench/api";
import { ASPECTS, aspectLabel, type AspectId, type RoomListItem } from "@/lib/bench/model";

function isUnauthorized(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /unauthorized/i.test(message);
}

export function Lobby() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomListItem[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<"open" | "join">("open");
  const [code, setCode] = useState("");
  const [aspect, setAspect] = useState<AspectId>("graphics");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const blankStarted = useRef(false);

  useEffect(() => {
    let stop = false;
    listRooms()
      .then((result) => {
        if (stop) return;
        if (result.ok) setRooms(result.rooms);
        else setLoadError(result.error);
      })
      .catch((err: unknown) => {
        if (stop) return;
        if (isUnauthorized(err)) {
          void navigate({ to: "/login" });
          return;
        }
        setLoadError("Couldn't load your rooms.");
      });
    return () => {
      stop = true;
    };
  }, [navigate]);

  useEffect(() => {
    let stop = false;
    listAccountDuties()
      .then((result) => {
        if (stop || !result.ok) return;
        setAdmin(result.admin);
      })
      .catch(() => {
        if (!stop) setAdmin(false);
      });
    return () => {
      stop = true;
    };
  }, []);

  useEffect(() => {
    if (!rooms || rooms.length > 0 || blankStarted.current) return;
    blankStarted.current = true;
    createRoom({ data: { name: "Untitled", aspect: "graphics" } })
      .then((result) => {
        if (result.ok) void navigate({ to: "/r/$code", params: { code: result.code } });
        else {
          blankStarted.current = false;
          setError(result.error);
        }
      })
      .catch((err: unknown) => {
        blankStarted.current = false;
        if (isUnauthorized(err)) void navigate({ to: "/login" });
        else setError("Couldn't open a blank project.");
      });
  }, [rooms, navigate]);

  async function removeProject(code: string, name: string) {
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
      if (isUnauthorized(err)) void navigate({ to: "/login" });
      else setLoadError("Couldn't delete that project.");
    }
    setDeleting(null);
  }

  async function startBlank() {
    setPending(true);
    setError(null);
    try {
      const result = await createRoom({ data: { name: "Untitled", aspect } });
      if (!result.ok) {
        setError(result.error);
        setPending(false);
        return;
      }
      void navigate({ to: "/r/$code", params: { code: result.code } });
    } catch (err) {
      if (isUnauthorized(err)) void navigate({ to: "/login" });
      else setError("Couldn't open a blank project.");
      setPending(false);
    }
  }

  async function onBuild(event: FormEvent) {
    event.preventDefault();
    const typed = prompt.trim();
    if (!typed) return;
    setPending(true);
    setError(null);
    try {
      const created = await createRoom({ data: { name: "Untitled", aspect, blurb: typed } });
      if (!created.ok) {
        setError(created.error);
        setPending(false);
        return;
      }
      await buildPiece({ data: { code: created.code, prompt: typed } }).catch(() => undefined);
      void navigate({ to: "/r/$code", params: { code: created.code } });
    } catch (err) {
      if (isUnauthorized(err)) void navigate({ to: "/login" });
      else setError("Couldn't build that.");
      setPending(false);
    }
  }

  async function onJoin(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = await joinRoom({ data: { code, aspect } });
      if (!result.ok) {
        setError(result.error);
        setPending(false);
        return;
      }
      void navigate({ to: "/r/$code", params: { code: result.room.code } });
    } catch (err) {
      if (isUnauthorized(err)) void navigate({ to: "/login" });
      else setError("Couldn't join that room.");
      setPending(false);
    }
  }

  if (rooms && rooms.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
        <header className="flex items-center justify-between gap-3">
          <p className="font-display text-3xl">Splitbench</p>
          <UserButton />
        </header>
        <p className="text-muted">{error ?? "Opening a blank project…"}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <p className="font-display text-3xl">Splitbench</p>
        <UserButton />
      </header>
      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <section>
          <h1 className="font-display text-4xl leading-tight sm:text-5xl">Start blank. Type what to build.</h1>
          <p className="mt-4 max-w-xl text-muted">
            A new project is an empty stage. Type what you want and it gets built there. Share the code
            if someone else should sit down with you.
          </p>
          <ol className="mt-8 border-y border-line">
            {ASPECTS.map((item) => (
              <li key={item.id} className="flex flex-col gap-1 border-b border-line py-3 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between">
                <span className="font-medium">{item.label}</span>
                <span className="text-sm text-muted">{item.blurb}</span>
              </li>
            ))}
          </ol>
        </section>
        <section className="panel flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={mode === "open" ? "btn btn-primary" : "btn btn-ghost"} onClick={() => setMode("open")}>
              Create
            </button>
            <button type="button" className={mode === "join" ? "btn btn-primary" : "btn btn-ghost"} onClick={() => setMode("join")}>
              Join
            </button>
          </div>
          <form className="flex flex-col gap-3" onSubmit={(event) => void (mode === "open" ? onBuild(event) : onJoin(event))}>
            {mode === "open" ? (
              <label className="flex flex-col gap-1 text-sm font-medium">
                Type what to build
                <textarea
                  className="field composer"
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="A grocery list you can check off"
                  maxLength={800}
                />
              </label>
            ) : (
              <label className="flex flex-col gap-1 text-sm font-medium">
                Project code
                <input
                  className="field tracking-widest uppercase"
                  value={code}
                  onChange={(event) => setCode(event.target.value.toUpperCase())}
                  placeholder="ABC234"
                  maxLength={6}
                  autoCapitalize="characters"
                />
              </label>
            )}
            <fieldset className="flex flex-col gap-2">
              <legend className="text-sm font-medium">Your seat</legend>
              <div className="grid grid-cols-2 gap-2">
                {ASPECTS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={aspect === item.id}
                    className={aspect === item.id ? "btn btn-primary" : "btn btn-ghost"}
                    onClick={() => setAspect(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>
            {error && (
              <p role="alert" className="text-sm font-medium">
                {error}
              </p>
            )}
            {mode === "open" && (
              <button className="btn btn-ghost btn-wide" type="button" disabled={pending} onClick={() => void startBlank()}>
                Start blank
              </button>
            )}
            <button className="btn btn-steel btn-wide" type="submit" disabled={pending || (mode === "open" && !prompt.trim())}>
              {pending ? (mode === "open" ? "Thinking…" : "Joining…") : mode === "open" ? "Build" : "Join project"}
            </button>
          </form>
        </section>
      </div>
      {admin && <AccountDuties />}
      <section>
        <h2 className="font-display text-2xl">Your projects</h2>
        {loadError && <p className="mt-2 text-sm font-medium">{loadError}</p>}
        {rooms === null && !loadError && <p className="mt-3 text-sm text-muted">Loading projects…</p>}
        {rooms && rooms.length === 0 && (
          <p className="mt-3 text-sm text-muted">No projects yet. Create one and send the code.</p>
        )}
        {rooms && rooms.length > 0 && (
          <ul className="mt-2 border-t border-line">
            {rooms.map((room) => (
              <li key={room.code} className="flex items-center gap-3 border-b border-line py-3">
                <Link
                  to="/r/$code"
                  params={{ code: room.code }}
                  className="flex min-h-11 min-w-0 flex-1 items-center justify-between gap-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{room.name}</span>
                    <span className="text-sm text-muted">
                      {room.blurb ? `${room.blurb} · ` : ""}
                      {aspectLabel(room.aspect)} · {room.code}
                    </span>
                  </span>
                  <span className="text-sm font-medium">Enter</span>
                </Link>
                {room.canDelete && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={deleting === room.code}
                    onClick={() => void removeProject(room.code, room.name)}
                  >
                    {deleting === room.code ? "Deleting…" : "Delete"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
