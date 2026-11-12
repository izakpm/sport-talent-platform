"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Modal } from "./CoachWorkspace";
import { planningRequest, type Team } from "./planning";
import styles from "./workspace.module.css";
import TeamInvitations from "../parents/TeamInvitations";
import PlayerAccount from "../team-hub/PlayerAccount";
import roster from "./roster.module.css";

export type Player = {
  id: string;
  team_id: string;
  first_name: string;
  last_name: string;
  position: string;
  shirt_number: number | null;
  is_captain: boolean;
  status: "active" | "inactive";
  linked?: boolean;
};
const POSITIONS = [
  "Prop",
  "Hooker",
  "Lock",
  "Flanker",
  "Number 8",
  "Scrum-half",
  "Fly-half",
  "Centre",
  "Wing",
  "Full-back",
];
const nameOf = (p: Player) => `${p.first_name} ${p.last_name}`;

export default function TeamRoster({ teamId }: { teamId: string }) {
  const [team, setTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("active");
  const [editor, setEditor] = useState<Player | "new" | null>(null);
  const [removing, setRemoving] = useState<Player | null>(null);
  const [accountPlayer, setAccountPlayer] = useState<Player | null>(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    let current = true;
    setLoading(true);
    setError("");
    setEditor(null);
    setRemoving(null);
    planningRequest<{ team: Team; players: Player[] }>(
      `/teams/${teamId}/players`,
    )
      .then((data) => {
        if (current) {
          setTeam(data.team);
          setPlayers(data.players);
        }
      })
      .catch((err) => {
        if (current) setError(err.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [teamId, retry]);
  const active = players.filter((p) => p.status === "active");
  const visible = players
    .filter(
      (p) =>
        (status === "all" || p.status === status) &&
        `${nameOf(p)} ${p.position} ${p.shirt_number ?? ""}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    )
    .sort(
      (a, b) =>
        a.status.localeCompare(b.status) ||
        (a.shirt_number ?? 100) - (b.shirt_number ?? 100) ||
        a.last_name.localeCompare(b.last_name) ||
        a.first_name.localeCompare(b.first_name),
    );
  function saved(player: Player) {
    setPlayers((prev) => [...prev.filter((p) => p.id !== player.id), player]);
    setNotice(`${nameOf(player)} saved to the roster.`);
  }
  return (
    <div className={styles.workspace}>
      <div className={styles.topline}>
        <Link href="/dashboard/coaches/teams" className={roster.back}>
          ← All teams
        </Link>
        <span className={styles.sportTag}>Rugby · Team roster</span>
      </div>
      {loading ? (
        <div role="status" className={styles.loading}>
          Loading your squad…
        </div>
      ) : error ? (
        <div role="alert" className={styles.error}>
          {error}
          <button
            className={styles.secondary}
            onClick={() => setRetry((r) => r + 1)}
          >
            Try again
          </button>
        </div>
      ) : (
        team && (
          <>
            <header className={styles.header}>
              <div>
                <p className={styles.eyebrow}>{team.age_group} · YOUR SQUAD</p>
                <h1>{team.name}</h1>
                <p className={styles.subtitle}>
                  Your players. One team. Ready for the next session.
                </p>
              </div>
              <div className={roster.actions}>
                <Link
                  className={styles.secondary}
                  href={`/dashboard/coaches/schedule?team=${team.id}`}
                >
                  Team schedule ↗
                </Link>
                <button
                  className={styles.primary}
                  onClick={() => setEditor("new")}
                >
                  ＋ Add player
                </button>
              </div>
            </header>
            <TeamInvitations
              teamId={teamId}
              teamName={team.name}
              players={players}
              onConfirmed={() => setRetry((v) => v + 1)}
            />
            {notice && (
              <div role="status" className={styles.notice}>
                {notice}
                <button
                  aria-label="Dismiss notification"
                  onClick={() => setNotice("")}
                >
                  ×
                </button>
              </div>
            )}
            <div className={roster.summary}>
              <div>
                <strong>{active.length}</strong>
                <span>Active players</span>
              </div>
              <div>
                <strong>{players.length - active.length}</strong>
                <span>Inactive players</span>
              </div>
              <div>
                <strong>{active.filter((p) => p.is_captain).length}</strong>
                <span>Captains</span>
              </div>
            </div>
            {!players.length ? (
              <section className={styles.empty}>
                <span className={styles.emptyIcon}>◉</span>
                <h2>Let’s bring your squad together.</h2>
                <p>
                  Start with a player’s name. Add a position and shirt number
                  now or later. No player account is needed.
                </p>
                <button
                  className={styles.primary}
                  onClick={() => setEditor("new")}
                >
                  Add your first player
                </button>
              </section>
            ) : (
              <>
                <div className={roster.filters}>
                  <label>
                    Search players
                    <input
                      type="search"
                      placeholder="Name, position or shirt number"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <label>
                    Show players
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="active">Active players</option>
                      <option value="inactive">Inactive players</option>
                      <option value="all">All players</option>
                    </select>
                  </label>
                  <span role="status">
                    {visible.length}{" "}
                    {visible.length === 1 ? "player" : "players"} shown
                  </span>
                </div>
                {visible.length ? (
                  <ul className={roster.list} aria-label="Team players">
                    {visible.map((player) => (
                      <li key={player.id} className={roster.player}>
                        <span
                          className={roster.number}
                          aria-label={
                            player.shirt_number
                              ? `Shirt number ${player.shirt_number}`
                              : "No shirt number"
                          }
                        >
                          {player.shirt_number ?? "—"}
                        </span>
                        <div className={roster.identity}>
                          <strong>{nameOf(player)}</strong>
                          <span>
                            {player.position || "Position not set"}
                            {player.is_captain && (
                              <b className={roster.captain}>Captain</b>
                            )}
                          </span>
                        </div>
                        <span
                          className={
                            player.status === "active"
                              ? roster.active
                              : roster.inactive
                          }
                        >
                          {player.status === "active" ? "Active" : "Inactive"}
                        </span>
                        <div className={roster.rowActions}>
                          <button
                            className={styles.secondary}
                            aria-label={`Athlete account for ${nameOf(player)}`}
                            onClick={() => setAccountPlayer(player)}
                          >
                            Athlete account
                          </button>
                          <button
                            className={styles.secondary}
                            aria-label={`Edit ${nameOf(player)}`}
                            onClick={() => setEditor(player)}
                          >
                            Edit
                          </button>
                          <button
                            className={styles.textButton}
                            aria-label={`Remove ${nameOf(player)}`}
                            onClick={() => setRemoving(player)}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={styles.empty}>
                    <h3>No players match this view.</h3>
                    <p>Try a different name or show all players.</p>
                    <button
                      className={styles.secondary}
                      onClick={() => {
                        setQuery("");
                        setStatus("all");
                      }}
                    >
                      Show all players
                    </button>
                  </div>
                )}
                <p className={roster.help}>
                  Link each player’s registered athlete account to give them
                  access to team updates and session check-in.
                </p>
              </>
            )}
          </>
        )
      )}
      {accountPlayer && (
        <PlayerAccount
          teamId={teamId}
          playerId={accountPlayer.id}
          name={nameOf(accountPlayer)}
          close={() => {
            setAccountPlayer(null);
            setRetry((value) => value + 1);
          }}
        />
      )}
      {editor && (
        <PlayerEditor
          key={editor === "new" ? "new" : editor.id}
          teamId={teamId}
          player={editor === "new" ? undefined : editor}
          close={() => setEditor(null)}
          saved={saved}
        />
      )}
      {removing && (
        <RemovePlayer
          teamId={teamId}
          player={removing}
          close={() => setRemoving(null)}
          removed={() => {
            setPlayers((prev) => prev.filter((p) => p.id !== removing.id));
            setNotice(`${nameOf(removing)} removed from this team.`);
            setRemoving(null);
          }}
        />
      )}
    </div>
  );
}

function PlayerEditor({
  teamId,
  player,
  close,
  saved,
}: {
  teamId: string;
  player?: Player;
  close: () => void;
  saved: (p: Player) => void;
}) {
  const blank = {
    first_name: "",
    last_name: "",
    position: "",
    shirt_number: "",
    is_captain: false,
    status: "active",
  };
  const [form, setForm] = useState(
    player
      ? { ...player, shirt_number: player.shirt_number?.toString() ?? "" }
      : blank,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [another, setAnother] = useState(false);
  const firstInput = useRef<HTMLInputElement>(null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await planningRequest<Player>(
        `/teams/${teamId}/players${player ? `/${player.id}` : ""}`,
        {
          method: player ? "PATCH" : "POST",
          body: JSON.stringify({
            ...form,
            shirt_number: form.shirt_number ? Number(form.shirt_number) : null,
          }),
        },
      );
      saved(result);
      if (another && !player) {
        setForm(blank);
        setMessage(`${nameOf(result)} added. Ready for the next player.`);
        setBusy(false);
        firstInput.current?.focus();
      } else close();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }
  return (
    <Modal
      title={player ? "Edit player" : "Add to your squad."}
      description={
        player?.linked
          ? "Their name comes from their athlete profile. Update their team details below."
          : "Start with their name. The rest can be added later."
      }
      close={() => !busy && close()}
    >
      <form onSubmit={submit} className={styles.form}>
        {message && (
          <p role="status" className={styles.formTip}>
            {message}
          </p>
        )}
        <div className={styles.formRow}>
          <label>
            First name
            <input
              ref={firstInput}
              autoFocus
              required
              maxLength={80}
              autoComplete="off"
              value={form.first_name}
              readOnly={!!player?.linked}
              onChange={(e) =>
                setForm((f) => ({ ...f, first_name: e.target.value }))
              }
            />
          </label>
          <label>
            Last name
            <input
              required
              maxLength={80}
              autoComplete="off"
              value={form.last_name}
              readOnly={!!player?.linked}
              onChange={(e) =>
                setForm((f) => ({ ...f, last_name: e.target.value }))
              }
            />
          </label>
        </div>
        <div className={styles.formRow}>
          <label>
            Rugby position
            <select
              value={form.position}
              onChange={(e) =>
                setForm((f) => ({ ...f, position: e.target.value }))
              }
            >
              <option value="">Not set</option>
              {POSITIONS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label>
            Shirt number <span className={styles.optional}>optional</span>
            <input
              type="number"
              min={1}
              max={99}
              step={1}
              placeholder="1–99"
              value={form.shirt_number}
              onChange={(e) =>
                setForm((f) => ({ ...f, shirt_number: e.target.value }))
              }
            />
          </label>
        </div>
        <label>
          Squad status
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
        <p className={styles.formTip}>
          Inactive players stay on your roster, but won’t appear in the active
          squad. Their shirt number can be reassigned.
        </p>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={form.is_captain}
            onChange={(e) =>
              setForm((f) => ({ ...f, is_captain: e.target.checked }))
            }
          />
          <span>Team captain</span>
        </label>
        {!player && (
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={another}
              onChange={(e) => setAnother(e.target.checked)}
            />
            <span>Keep adding players after saving</span>
          </label>
        )}
        {error && (
          <p role="alert" className={styles.formError}>
            {error}
          </p>
        )}
        <footer className={styles.formFooter}>
          <button
            className={styles.secondary}
            type="button"
            disabled={busy}
            onClick={close}
          >
            Cancel
          </button>
          <button className={styles.primary} disabled={busy}>
            {busy ? "Saving…" : player ? "Save changes" : "Add player"}
          </button>
        </footer>
      </form>
    </Modal>
  );
}

function RemovePlayer({
  teamId,
  player,
  close,
  removed,
}: {
  teamId: string;
  player: Player;
  close: () => void;
  removed: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function remove() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await planningRequest(`/teams/${teamId}/players/${player.id}`, {
        method: "DELETE",
      });
      removed();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }
  return (
    <Modal
      title={`Remove ${nameOf(player)}?`}
      description="This permanently removes their roster entry from this team. Other teams and athlete accounts are unaffected. To keep their details, cancel and edit their status to Inactive instead."
      close={() => !busy && close()}
    >
      {error && (
        <p role="alert" className={styles.formError}>
          {error}
        </p>
      )}
      <div className={styles.formFooter}>
        <button className={styles.secondary} disabled={busy} onClick={close}>
          Keep player
        </button>
        <button className={styles.danger} disabled={busy} onClick={remove}>
          {busy ? "Removing…" : "Remove player"}
        </button>
      </div>
    </Modal>
  );
}
