"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { family } from "./family-api";
import { teamInviteReturn } from "../../lib/team-invite-return";
import { Modal } from "../coaches/CoachWorkspace";
import type { Player } from "../coaches/TeamRoster";
import s from "../coaches/workspace.module.css";
import p from "./parents.module.css";
type Invitation = {
  id: string;
  team_name: string;
  child_id?: string;
  coach_name: string;
  parent_name: string;
  child_name: string;
  status: string;
  expires_at: string;
  created_at: string;
};
const labels: Record<string, string> = {
  open: "Waiting for parent",
  pending: "Awaiting coach confirmation",
  confirmed: "Confirmed",
  declined: "Declined",
  revoked: "Revoked",
  withdrawn: "Withdrawn",
  expired: "Expired",
};
export default function TeamInvitations({
  teamId,
  teamName,
  players = [],
  onConfirmed,
  childId,
}: {
  teamId?: string;
  childId?: string;
  teamName?: string;
  players?: Player[];
  onConfirmed?: () => void;
}) {
  const [items, setItems] = useState<Invitation[]>([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [notice, setNotice] = useState("");
  const [share, setShare] = useState<{
      url: string;
      expires_at: string;
    } | null>(null),
    [review, setReview] = useState<Invitation | null>(null);
  const [pending, setPending] = useState<string | null>(null),
    [retry, setRetry] = useState(0);
  const path = teamId ? `/team-invites/teams/${teamId}` : "/team-invites";
  useEffect(() => {
    let live = true;
    setLoading(true);
    if (!teamId) setPending(teamInviteReturn());
    const load = () =>
      family<Invitation[]>(path)
        .then((v) => {
          if (live) {
            setItems(v);
            setError("");
          }
        })
        .catch((e) => {
          if (live) setError(e.message);
        })
        .finally(() => {
          if (live) setLoading(false);
        });
    void load();
    const timer = setInterval(load, 60000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [path, retry, teamId]);
  async function create() {
    setBusy(true);
    setError("");
    try {
      const v = await family<{ token: string; expires_at: string }>(path, {});
      setShare({
        url: `${window.location.origin}/join-team#invite=${v.token}`,
        expires_at: v.expires_at,
      });
      setRetry((v) => v + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function decide(i: Invitation, status: string, player_id?: string) {
    setBusy(true);
    setError("");
    try {
      await family(
        teamId ? `${path}/${i.id}` : `${path}/${i.id}/withdraw`,
        teamId ? { status, player_id } : {},
      );
      setReview(null);
      setNotice(
        status === "confirmed"
          ? `${i.child_name} is now linked to ${i.team_name}.`
          : "Invitation updated.",
      );
      setRetry((v) => v + 1);
      if (status === "confirmed") onConfirmed?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const visibleItems = childId
    ? items.filter((i) => i.child_id === childId)
    : items;
  return (
    <section className={p.card} aria-label="Team invitations">
      <div className={p.sectionHeading}>
        <h2>
          Team invitations
          {visibleItems.some((i) => i.status === "pending")
            ? ` (${visibleItems.filter((i) => i.status === "pending").length} pending)`
            : ""}
        </h2>
        <div className={p.actions}>
          {teamId && (
            <button className={s.primary} disabled={busy} onClick={create}>
              Invite player via WhatsApp
            </button>
          )}
          <button
            className={s.secondary}
            disabled={busy || loading}
            onClick={() => setRetry((v) => v + 1)}
          >
            Refresh invitations
          </button>
        </div>
      </div>
      <p>
        {teamId
          ? "Share a private invitation with a parent. They choose their child, then you confirm the player before team access starts."
          : "Track invitations you accepted for your children. They join the team only when the coach confirms."}
      </p>
      {pending && (
        <p>
          <Link className={s.primary} href={pending}>
            Continue team invitation
          </Link>
        </p>
      )}
      {loading && <p role="status">Loading invitations…</p>}
      {error && !review && (
        <p role="alert" className={s.formError}>
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className={s.notice}>
          {notice}
        </p>
      )}
      {!loading && !visibleItems.length && <p>No invitations yet.</p>}
      {visibleItems.map((i) => (
        <article key={i.id} className={p.record}>
          <h3>{i.child_name || `Invitation ${i.id.slice(0, 8)}`}</h3>
          <p>
            {i.team_name} · {labels[i.status]}
          </p>
          <p>
            {teamId && i.parent_name
              ? `Accepted by ${i.parent_name}`
              : `Coach: ${i.coach_name}`}{" "}
            · Created {new Date(i.created_at).toLocaleDateString("en-ZA")}
          </p>
          {["open", "pending"].includes(i.status) && (
            <p>Expires {new Date(i.expires_at).toLocaleDateString("en-ZA")}</p>
          )}
          <div className={p.actions}>
            {teamId && i.status === "pending" && (
              <button
                className={s.primary}
                disabled={busy}
                onClick={() => {
                  setError("");
                  setReview(i);
                }}
              >
                Review player
              </button>
            )}
            {teamId && ["open", "pending"].includes(i.status) && (
              <button
                className={s.secondary}
                disabled={busy}
                onClick={() => decide(i, "revoked")}
              >
                Revoke invitation
              </button>
            )}
            {!teamId && i.status === "pending" && (
              <button
                className={s.secondary}
                disabled={busy}
                onClick={() => decide(i, "withdrawn")}
              >
                Withdraw request
              </button>
            )}
          </div>
        </article>
      ))}
      {share && (
        <Modal
          title="Invite a parent"
          description="One invitation, one child. Valid for seven days."
          close={() => setShare(null)}
        >
          <p>
            Share this link privately with the parent of the player joining{" "}
            {teamName}. A forwarded link can be accepted by another parent, so
            confirm their identity before approving.
          </p>
          <label>
            Invitation link
            <input readOnly value={share.url} style={{ width: "100%" }} />
          </label>
          <div className={p.actions}>
            <a
              className={s.primary}
              target="_blank"
              rel="noopener noreferrer"
              href={`https://wa.me/?text=${encodeURIComponent(`You’re invited to join ${teamName} on PlayVerified. Please sign in as a parent and choose your child. I will confirm their place before team access starts. ${share.url}`)}`}
            >
              Share via WhatsApp
            </a>
            <button
              className={s.secondary}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(share.url);
                  setNotice("Invitation link copied.");
                } catch {
                  setNotice("Select and copy the invitation link above.");
                }
              }}
            >
              Copy link
            </button>
          </div>
          <p>
            The original link is shown only here. Create a new invitation if you
            lose it.
          </p>
          {notice && <p role="status">{notice}</p>}
        </Modal>
      )}
      {review && (
        <Modal
          title="Confirm this player"
          description={`${review.child_name} · ${review.team_name}`}
          close={() => {
            if (!busy) setReview(null);
          }}
        >
          <p>
            {review.parent_name} accepted this invitation. Confirm that you
            recognise the parent and child before granting access to your team’s
            schedule and feed.
          </p>
          <form
            className={s.form}
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void decide(review, "confirmed", String(f.get("player") || ""));
            }}
          >
            <label>
              Roster entry
              <select name="player" disabled={busy}>
                <option value="">
                  Create a new player for {review.child_name}
                </option>
                {players
                  .filter((v) => v.status === "active")
                  .map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.first_name} {v.last_name}
                    </option>
                  ))}
              </select>
            </label>
            <p>
              Select an existing unlinked roster entry if you already added this
              child. Linked entries or another athlete’s history cannot be
              reassigned.
            </p>
            <label className={s.checkboxLabel}>
              <input type="checkbox" required disabled={busy} /> I recognise
              this parent and child and confirm this is the correct player.
            </label>
            {error && (
              <p role="alert" className={s.formError}>
                {error}
              </p>
            )}
            <div className={p.actions}>
              <button className={s.primary} disabled={busy}>
                {busy ? "Saving…" : "Confirm and link player"}
              </button>
              <button
                type="button"
                className={s.secondary}
                disabled={busy}
                onClick={() => decide(review, "declined")}
              >
                Decline request
              </button>
            </div>
          </form>
        </Modal>
      )}
    </section>
  );
}
