import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { UserButton } from "@/lib/auth/gates";
import { AccountDuties } from "@/components/bench/bot-assign";
import {
  clearBundle,
  deleteRoom,
  getBundle,
  joinRoom,
  moveSeat,
  openRoom,
  saveBundle,
  sendChat,
  buildPiece,
} from "@/lib/bench/api";
import { buildSrcdoc, type PackedFile } from "@/lib/bench/files";
import {
  ASPECTS,
  PROMPTS,
  aspectLabel,
  benchBlurb,
  describeGrant,
  type AspectId,
  type AppSpec,
  type ChatMessage,
  type RoomSnapshot,
  type Seat,
} from "@/lib/bench/model";
import { SAMPLE_LABEL, SAMPLE_SITE } from "@/lib/bench/sample";
import { unpackZip } from "@/lib/bench/unpack";

type Phase =
  | { kind: "loading" }
  | { kind: "missing" }
  | { kind: "join"; name: string; taken: AspectId[] }
  | { kind: "room" };

function isUnauthorized(err: unknown): boolean {
  const message = err instanceof Error ? err.message : String(err);
  return /unauthorized/i.test(message);
}

function mergeMessages(prev: ChatMessage[], next: ChatMessage[]): ChatMessage[] {
  const map = new Map(prev.map((message) => [message.id, message]));
  for (const message of next) map.set(message.id, message);
  return [...map.values()].sort((a, b) => a.id - b.id);
}

export function Studio({ code }: { code: string }) {
  const roomCode = code.toUpperCase();
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>({ kind: "loading" });
  const [name, setName] = useState("");
  const [you, setYou] = useState<AspectId>("graphics");
  const [seats, setSeats] = useState<Seat[]>([]);
  const [spec, setSpec] = useState<AppSpec | null>(null);
  const [reach, setReach] = useState<AspectId[]>(["graphics"]);
  const [dutyBrief, setDutyBrief] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [bundleRevision, setBundleRevision] = useState(0);
  const [bundleLabel, setBundleLabel] = useState<string | null>(null);
  const [files, setFiles] = useState<PackedFile[] | null>(null);
  const [loadedBundle, setLoadedBundle] = useState(-1);
  const [view, setView] = useState<"piece" | "site">("site");
  const [mobileTab, setMobileTab] = useState<"chat" | "bench">("chat");
  const [text, setText] = useState("");
  const [buildText, setBuildText] = useState("");
  const [sending, setSending] = useState(false);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [siteError, setSiteError] = useState<string | null>(null);
  const [siteBusy, setSiteBusy] = useState(false);
  const [joinAspect, setJoinAspect] = useState<AspectId | null>(null);
  const [copied, setCopied] = useState(false);
  const [hot, setHot] = useState(false);
  const afterRef = useRef(0);
  const phaseRef = useRef<Phase["kind"]>("loading");
  const listRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  phaseRef.current = phase.kind;

  function applyRoom(room: RoomSnapshot, how: "replace" | "merge") {
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

  useEffect(() => {
    let stop = false;
    setPhase({ kind: "loading" });
    afterRef.current = 0;
    setMessages([]);
    setFiles(null);
    setLoadedBundle(-1);
    setView("site");
    openRoom({ data: { code: roomCode, afterId: 0 } })
      .then((result) => {
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
          setPhase({ kind: "join", name: result.name, taken: result.taken });
        } else applyRoom(result.room, "replace");
      })
      .catch((err: unknown) => {
        if (stop) return;
        if (isUnauthorized(err)) void navigate({ to: "/login" });
        else setPhase({ kind: "missing" });
      });
    return () => {
      stop = true;
    };
  }, [roomCode, navigate]);

  useEffect(() => {
    if (phase.kind !== "room") return;
    let stop = false;
    let timer = 0;
    const loop = async () => {
      if (stop) return;
      try {
        if (document.visibilityState === "visible" && phaseRef.current === "room") {
          const result = await openRoom({ data: { code: roomCode, afterId: afterRef.current } });
          if (!stop && result.ok && result.status === "room") applyRoom(result.room, "merge");
        }
      } catch (err) {
        if (!stop && isUnauthorized(err)) void navigate({ to: "/login" });
      } finally {
        if (!stop) timer = window.setTimeout(() => void loop(), 1500);
      }
    };
    timer = window.setTimeout(() => void loop(), 1500);
    return () => {
      stop = true;
      window.clearTimeout(timer);
    };
  }, [phase.kind, roomCode, navigate]);

  useEffect(() => {
    if (phase.kind !== "room") return;
    if (bundleRevision === loadedBundle) return;
    if (bundleRevision === 0) {
      setFiles(null);
      setLoadedBundle(0);
      return;
    }
    let stop = false;
    getBundle({ data: { code: roomCode } })
      .then((result) => {
        if (stop) return;
        if (!result.ok) {
          setSiteError(result.error);
          return;
        }
        setFiles(result.files);
        setBundleLabel(result.label);
        setLoadedBundle(result.bundleRevision);
        if (result.files) setView("site");
      })
      .catch(() => {
        if (!stop) setSiteError("The site preview could not be loaded.");
      });
    return () => {
      stop = true;
    };
  }, [bundleRevision, loadedBundle, phase.kind, roomCode]);

  useEffect(() => {
    const node = listRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [messages.length]);

  useEffect(() => {
    document.title = name ? `${name} · Splitbench` : "Splitbench";
    return () => {
      document.title = "Splitbench";
    };
  }, [name]);

  const srcdoc = useMemo(() => (files ? buildSrcdoc(files) : null), [files]);
  const taken = new Set(seats.map((seat) => seat.aspect));
  const openSeats = ASPECTS.filter((aspect) => aspect.id === you || !taken.has(aspect.id));

  async function build(body: string) {
    const trimmed = body.trim();
    if (!trimmed || building) return;
    setBuilding(true);
    setError(null);
    try {
      const result = await buildPiece({ data: { code: roomCode, prompt: trimmed } });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setBuildText("");
      applyRoom(result.room, "replace");
      setView("site");
    } catch (err) {
      if (isUnauthorized(err)) void navigate({ to: "/login" });
      else setError("The build did not finish.");
    } finally {
      setBuilding(false);
    }
  }

  async function send(body: string) {
    const trimmed = body.trim();
    if (!trimmed || sending) return;
    setSending(true);
    setError(null);
    setText("");
    try {
      const result = await sendChat({ data: { code: roomCode, body: trimmed, afterId: afterRef.current } });
      if (!result.ok) {
        setText(trimmed);
        setError(result.error);
        return;
      }
      applyRoom(result.room, "merge");
    } catch (err) {
      setText(trimmed);
      if (isUnauthorized(err)) void navigate({ to: "/login" });
      else setError("The message did not send.");
    } finally {
      setSending(false);
    }
  }

  async function publishFiles(next: PackedFile[], label: string) {
    setSiteBusy(true);
    setSiteError(null);
    try {
      const result = await saveBundle({ data: { code: roomCode, label, files: next } });
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
      if (isUnauthorized(err)) void navigate({ to: "/login" });
      else setSiteError("The zip could not be shared.");
    } finally {
      setSiteBusy(false);
    }
  }

  async function onFile(file: File) {
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".zip")) {
      setSiteError("Drop a .zip file.");
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const unpacked = unpackZip(bytes);
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

  if (phase.kind === "loading") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-4 px-4 py-8">
        <div className="h-8 w-40 animate-pulse rounded-md bg-line" />
        <div className="h-64 animate-pulse rounded-xl bg-line" />
      </main>
    );
  }

  if (phase.kind === "missing") {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-4 px-4">
        <h1 className="font-display text-4xl">No room uses that code.</h1>
        <p className="text-muted">{error ?? "Check the six characters and try again."}</p>
        <Link to="/" className="btn btn-primary w-fit">
          Back to rooms
        </Link>
      </main>
    );
  }

  if (phase.kind === "join") {
    const free = ASPECTS.filter((aspect) => !phase.taken.includes(aspect.id));
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-4 px-4">
        <p className="text-sm text-muted">{roomCode}</p>
        <h1 className="font-display text-4xl">{phase.name}</h1>
        <p className="text-muted">Pick an open craft. Your Grok will be locked to it.</p>
        {free.length === 0 ? (
          <p className="font-medium">Every craft in this room is taken.</p>
        ) : (
          <form
            className="panel flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (!joinAspect) return;
              setError(null);
              void joinRoom({ data: { code: roomCode, aspect: joinAspect } })
                .then((result) => {
                  if (!result.ok) {
                    setError(result.error);
                    return;
                  }
                  applyRoom(result.room, "replace");
                })
                .catch((err: unknown) => {
                  if (isUnauthorized(err)) void navigate({ to: "/login" });
                  else setError("Couldn't take that seat.");
                });
            }}
          >
            <div className="grid grid-cols-2 gap-2">
              {ASPECTS.map((aspect) => {
                const blocked = phase.taken.includes(aspect.id);
                return (
                  <button
                    key={aspect.id}
                    type="button"
                    disabled={blocked}
                    aria-pressed={joinAspect === aspect.id}
                    className={joinAspect === aspect.id ? "btn btn-primary" : "btn btn-ghost"}
                    onClick={() => setJoinAspect(aspect.id)}
                  >
                    {aspect.label}
                  </button>
                );
              })}
            </div>
            {error && <p className="text-sm font-medium">{error}</p>}
            <button className="btn btn-steel" type="submit" disabled={!joinAspect}>
              Sit down
            </button>
          </form>
        )}
      </main>
    );
  }

  return (
    <div className="room">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3">
        <Link to="/" className="font-display text-2xl">
          Splitbench
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{name}</p>
          <p className="text-sm text-muted">
            {roomCode} · you are {aspectLabel(you)}
          </p>
        </div>
        <button type="button" className="btn btn-ghost" onClick={() => void copyLink()}>
          {copied ? "Copied" : "Copy link"}
        </button>
        {canDelete && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              if (!window.confirm(`Delete ${name || "this project"}? The app and the chat go with it.`)) return;
              void deleteRoom({ data: { code: roomCode } }).then((result) => {
                if (!result.ok) {
                  setError(result.error);
                  return;
                }
                void navigate({ to: "/" });
              });
            }}
          >
            Delete
          </button>
        )}
        <UserButton />
      </header>
      <div className="room-main">
        <section className={`side side-chat ${mobileTab !== "chat" ? "is-hidden" : ""}`}>
          <div ref={listRef} className="scroll flex flex-col gap-3 px-4 py-4">
            {messages.length === 0 && (
              <p className="text-sm text-muted">
                This project is a blank app. Type what to build, or ask Grok to change a role you hold.
              </p>
            )}
            {messages.map((message) => (
              <Message key={message.id} message={message} />
            ))}
          </div>
          <form
            className="flex items-end gap-2 border-t border-line px-4 py-3"
            onSubmit={(event) => {
              event.preventDefault();
              void build(buildText);
            }}
          >
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium" htmlFor="build">
              Type what to build
              <input
                id="build"
                className="field"
                value={buildText}
                placeholder="A grocery list you can check off"
                maxLength={800}
                onChange={(event) => setBuildText(event.target.value)}
              />
            </label>
            <button className="btn btn-steel" type="submit" disabled={building || !buildText.trim()}>
              {building ? "Thinking…" : "Build"}
            </button>
          </form>
          <form
            className="flex flex-col gap-2 border-t border-line px-4 py-3"
            onSubmit={(event) => {
              event.preventDefault();
              void send(text);
            }}
          >
            <label className="text-sm font-medium" htmlFor="ask">
              Ask {admin ? "Grok" : aspectLabel(you)}
            </label>
            <textarea
              id="ask"
              className="field composer"
              value={text}
              placeholder={
                admin
                  ? "Change the app. You can edit every role."
                  : dutyBrief
                    ? dutyBrief
                    : reach.length <= 1
                      ? `Only the ${aspectLabel(you).toLowerCase()} role will change.`
                      : `Your Grok can change ${describeGrant(reach)}.`
              }
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void send(text);
                }
              }}
            />
            <div className="flex flex-wrap gap-2">
              {reach.flatMap((role) =>
                PROMPTS[role].slice(0, 1).map((prompt) => (
                  <button key={prompt} type="button" className="btn btn-ghost" disabled={sending} onClick={() => void send(prompt)}>
                    {prompt}
                  </button>
                )),
              )}
            </div>
            {error && <p className="text-sm font-medium">{error}</p>}
            <button className="btn btn-primary" type="submit" disabled={sending || !text.trim()}>
              {sending ? "Thinking…" : "Send"}
            </button>
          </form>
        </section>

        <section
          className="stage-wrap"
          onDragEnter={(event) => {
            event.preventDefault();
            setHot(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setHot(false)}
          onDrop={(event) => {
            event.preventDefault();
            setHot(false);
            const file = event.dataTransfer.files[0];
            if (file) void onFile(file);
          }}
        >
          <div className="flex flex-wrap items-center gap-2 px-3 py-3">
            <p className="font-medium">App</p>
            {bundleLabel && <p className="text-sm text-stagefg">{bundleLabel}</p>}
          </div>
          <div className="stage-view">
            {srcdoc?.html ? (
              <iframe
                title={bundleLabel ?? "Dropped site"}
                sandbox="allow-scripts allow-forms allow-popups"
                referrerPolicy="no-referrer"
                srcDoc={srcdoc.html}
                className="h-full w-full border-0 bg-sheet"
              />
            ) : (
              <div className={hot ? "drop is-hot" : "drop"}>
                <p className="font-display text-3xl text-stagefg">Blank app</p>
                <p className="max-w-sm text-sm text-stagefg opacity-75">
                  Type what to build and it runs here for everyone in the room. Or drop a zip.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <button type="button" className="btn btn-primary" onClick={() => fileRef.current?.click()} disabled={siteBusy}>
                    {siteBusy ? "Reading…" : "Choose a zip"}
                  </button>
                  <button type="button" className="btn btn-ghost" disabled={siteBusy} onClick={() => void publishFiles(SAMPLE_SITE, SAMPLE_LABEL)}>
                    Run the sample site
                  </button>
                </div>
                {siteError && <p className="text-sm font-medium text-stagefg">{siteError}</p>}
              </div>
            )}
            {srcdoc?.html && (
              <div className="absolute right-3 bottom-3 flex flex-wrap justify-end gap-2">
                <button type="button" className="btn btn-ghost" onClick={() => fileRef.current?.click()} disabled={siteBusy}>
                  Replace zip
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    void clearBundle({ data: { code: roomCode } }).then(() => {
                      setFiles(null);
                      setBundleLabel(null);
                      setBundleRevision(0);
                      setLoadedBundle(0);
                    });
                  }}
                >
                  Clear site
                </button>
              </div>
            )}
            {hot && (
              <div className="absolute inset-0 grid place-items-center bg-stage/80 text-stagefg">
                <p className="font-display text-3xl">Drop to run it</p>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            className="hidden"
            type="file"
            accept=".zip,application/zip"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void onFile(file);
            }}
          />
        </section>

        <section className={`side side-bench ${mobileTab !== "bench" ? "is-hidden" : ""}`}>
          <div className="scroll flex flex-col gap-4 px-4 py-4">
            <div>
              <h2 className="font-display text-2xl">{reach.length > 1 || admin ? "Roles" : aspectLabel(you)}</h2>
              <p className="mt-1 text-sm text-muted">{benchBlurb(you, reach, dutyBrief)}</p>
            </div>
            <ul className="flex flex-col gap-2">
              {reach.map((role) => {
                const item = ASPECTS.find((aspect) => aspect.id === role);
                return (
                  <li key={role} className="border-b border-line py-2">
                    <p className="font-medium">{item?.label}</p>
                    <p className="text-sm text-muted">{item?.blurb}</p>
                  </li>
                );
              })}
            </ul>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Seat
              <select
                className="field"
                value={you}
                onChange={(event) => {
                  const next = event.target.value;
                  if (!next) return;
                  void moveSeat({ data: { code: roomCode, aspect: next, afterId: afterRef.current } }).then((result) => {
                    if (!result.ok) {
                      setError(result.error);
                      return;
                    }
                    applyRoom(result.room, "merge");
                  });
                }}
              >
                {openSeats.map((aspect) => (
                  <option key={aspect.id} value={aspect.id}>
                    {aspect.label}
                  </option>
                ))}
              </select>
            </label>
            <ul className="border-t border-line pt-3">
              {ASPECTS.map((aspect) => {
                const seat = seats.find((item) => item.aspect === aspect.id);
                return (
                  <li key={aspect.id} className="flex items-baseline justify-between gap-3 py-1 text-sm">
                    <span className={seat?.mine ? "font-medium" : "text-muted"}>{aspect.label}</span>
                    <span className="text-muted">
                      {seat ? `${seat.displayName}${seat.online ? "" : " · away"}` : "Open"}
                    </span>
                  </li>
                );
              })}
            </ul>
            {admin && (
              <details className="border-t border-line pt-3">
                <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium">
                  What an account can do
                </summary>
                <div className="pt-3">
                  <AccountDuties compact />
                </div>
              </details>
            )}
          </div>
        </section>
      </div>
      <div className="tabbar">
        <button type="button" className={mobileTab === "chat" ? "btn btn-primary flex-1" : "btn btn-ghost flex-1"} onClick={() => setMobileTab("chat")}>
          Chat
        </button>
        <button type="button" className={mobileTab === "bench" ? "btn btn-primary flex-1" : "btn btn-ghost flex-1"} onClick={() => setMobileTab("bench")}>
          Bench
        </button>
      </div>
    </div>
  );
}

function Message({ message }: { message: ChatMessage }) {
  if (message.kind === "system") {
    return <p className="px-2 text-center text-sm text-muted">{message.body}</p>;
  }
  if (message.kind === "note") {
    return (
      <p className="text-sm text-muted">
        <span className="font-medium text-ink">{message.displayName}</span>
        {" · "}
        {message.body}
      </p>
    );
  }
  if (message.kind === "bot") {
    return (
      <div className="border-l-2 border-steel pl-3">
        <p className="text-sm font-medium text-steel">
          {message.displayName === "Build" ? "Build" : `${aspectLabel(message.aspect)} Grok`}
        </p>
        <p className="text-sm">{message.body}</p>
      </div>
    );
  }
  return (
    <div className={message.mine ? "ml-8" : "mr-8"}>
      <p className="mb-1 text-sm text-muted">{message.mine ? "You" : message.displayName}</p>
      <p className={message.mine ? "rounded-xl bg-ink px-3 py-2 text-sm text-paper" : "rounded-xl border border-line bg-sheet px-3 py-2 text-sm"}>
        {message.body}
      </p>
    </div>
  );
}
