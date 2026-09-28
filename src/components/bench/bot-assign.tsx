import { useEffect, useState, type FormEvent } from "react";
import { listAccountDuties, removeAccountDuty, saveAccountDuty } from "@/lib/bench/api";
import { ASPECTS, aspectLabel, type AccountDuty, type AspectId } from "@/lib/bench/model";

export function AccountDuties({ compact = false }: { compact?: boolean }) {
  const [duties, setDuties] = useState<AccountDuty[]>([]);
  const [email, setEmail] = useState("");
  const [brief, setBrief] = useState("");
  const [roles, setRoles] = useState<AspectId[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let stop = false;
    listAccountDuties()
      .then((result) => {
        if (!stop && result.ok && result.admin) setDuties(result.duties);
      })
      .catch(() => {
        if (!stop) setError("Couldn't load accounts.");
      });
    return () => {
      stop = true;
    };
  }, []);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const result = await saveAccountDuty({ data: { email, brief, roles } });
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

  async function onRemove(target: string) {
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

  return (
    <section className={compact ? "flex flex-col gap-3" : "panel flex flex-col gap-4"}>
      <div>
        {!compact && <h2 className="font-display text-2xl">What an account can do</h2>}
        <p className={compact ? "text-sm text-muted" : "mt-1 text-sm text-muted"}>
          Pick every role this person should have. One account can hold several. The sentence can name more.
        </p>
      </div>
      <form className="flex flex-col gap-3" onSubmit={(event) => void onSave(event)}>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Account email
          <input
            className="field"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="someone@gmail.com"
            autoComplete="off"
            required
          />
        </label>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Roles</legend>
          <div className="grid grid-cols-2 gap-2">
            {ASPECTS.map((item) => {
              const on = roles.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={on}
                  className={on ? "btn btn-primary" : "btn btn-ghost"}
                  onClick={() =>
                    setRoles((current) =>
                      current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id],
                    )
                  }
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </fieldset>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Note
          <textarea
            className="field composer"
            value={brief}
            onChange={(event) => setBrief(event.target.value)}
            placeholder="Look and logic. Keep the page quiet."
            maxLength={400}
          />
        </label>
        <button className="btn btn-steel" type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </button>
      </form>
      {error && (
        <p role="alert" className="text-sm font-medium">
          {error}
        </p>
      )}
      {notice && <p className="text-sm text-muted">{notice}</p>}
      {duties.length > 0 && (
        <ul className="border-t border-line">
          {duties.map((duty) => (
            <li key={duty.email} className="flex flex-col gap-2 border-b border-line py-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="truncate font-medium">{duty.email}</p>
                <p className="text-sm text-muted">{duty.brief}</p>
                <p className="text-sm text-muted">
                  {duty.allowed.length === 0
                    ? "Cannot change the app."
                    : `Roles: ${duty.allowed.map((id) => aspectLabel(id)).join(", ")}.`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => {
                    setEmail(duty.email);
                    setBrief(duty.brief);
                    setRoles(duty.allowed);
                    setNotice(null);
                  }}
                >
                  Edit
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => void onRemove(duty.email)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
