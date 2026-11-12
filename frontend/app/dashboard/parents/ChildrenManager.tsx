"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { type GuardianChild } from "../../lib/guardian-context";
import { Modal } from "../coaches/CoachWorkspace";
import s from "../coaches/workspace.module.css";
import p from "./parents.module.css";
import { family } from "./family-api";
export default function Parents() {
  const [rows, setRows] = useState<GuardianChild[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [modal, setModal] = useState<"add" | "link" | null>(null),
    [busy, setBusy] = useState(false),
    [retry, setRetry] = useState(0),
    [code, setCode] = useState<{
      child: string;
      code: string;
      expires_at: string;
    } | null>(null);
  useEffect(() => {
    let active = true;
    family<GuardianChild[]>("/children")
      .then((r) => {
        if (active) {
          setRows(r);
          setError("");
        }
      })
      .catch((e) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [retry]);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (modal === "add") {
        await family("/children", {
          ...values,
          guardian_confirmed: values.guardian_confirmed === "on",
        });
        setNotice(
          "Child added. Their information is now included in your family pages.",
        );
      } else {
        const data = await family<{ message: string }>("/requests", values);
        setNotice(data.message);
      }
      setModal(null);
      setRetry((v) => v + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function makeCode(child: GuardianChild) {
    setBusy(true);
    setError("");
    try {
      const result = await family<{ code: string; expires_at: string }>(
        "/children/" + child.id + "/coach-code",
        {},
      );
      setCode({ ...result, child: child.first_name });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function remove(child: GuardianChild) {
    setBusy(true);
    setError("");
    try {
      await family("/links/" + child.link_id + "/remove", {});
      setRetry((v) => v + 1);
      setNotice("Link removed. You no longer have access to this athlete.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={`${s.workspace} ${p.page}`}>
      <header className={s.header}>
        <div>
          <p className={s.eyebrow}>YOUR FAMILY. THEIR SPORT.</p>
          <h1>My children</h1>
          <p className={s.subtitle}>Be part of their sporting journey.</p>
        </div>
        <div className={p.actions}>
          <button
            className={s.primary}
            onClick={() => {
              setError("");
              setModal("add");
            }}
          >
            Add a child +
          </button>
          <button
            className={s.secondary}
            onClick={() => {
              setError("");
              setModal("link");
            }}
          >
            Link an existing athlete
          </button>
        </div>
      </header>
      <section className={p.hero}>
        <span className={p.eyebrow}>Behind every young athlete</span>
        <h2>Help them build their sporting story.</h2>
        <p>
          Manage a younger child’s profile, training and team schedule without
          needing an email address. Stay connected to an older athlete’s
          progress once they approve your request.
        </p>
      </section>
      {notice && (
        <p className={s.notice} role="status">
          {notice}
        </p>
      )}
      {error && !modal && (
        <p className={s.error} role="alert">
          {error}
        </p>
      )}
      <div className={s.header}>
        <h2>Your family</h2>
        <button className={s.secondary} onClick={() => setRetry((v) => v + 1)}>
          Refresh links
        </button>
      </div>
      {loading ? (
        <p role="status">Loading your children…</p>
      ) : (
        <div className={p.grid}>
          {rows.map((child) => (
            <article className={p.card} key={child.link_id}>
              <div className={p.avatar}>
                {child.profile_image ? (
                  <img src={child.profile_image} alt="" />
                ) : (
                  child.first_name[0]
                )}
              </div>
              <h2>
                {child.first_name} {child.last_name}
              </h2>
              <p>
                {child.status === "pending"
                  ? "Waiting for the athlete to approve your request in Connections."
                  : child.mode === "managed"
                    ? "Managed by you · No email needed"
                    : "Linked athlete · Read-only access"}
              </p>
              {child.date_of_birth && (
                <p>
                  Born{" "}
                  {new Date(
                    child.date_of_birth + "T12:00:00",
                  ).toLocaleDateString("en-ZA")}
                </p>
              )}
              <div className={p.actions}>
                {child.status === "accepted" && (
                  <Link
                    className={s.primary}
                    href={"/dashboard/parents/profile?child=" + child.id}
                  >
                    View profile ↗
                  </Link>
                )}
                {child.mode === "managed" ? (
                  <button
                    className={s.secondary}
                    disabled={busy}
                    onClick={() => makeCode(child)}
                  >
                    Get coach sharing code
                  </button>
                ) : (
                  <button
                    className={s.textButton}
                    disabled={busy}
                    onClick={() => remove(child)}
                  >
                    {child.status === "pending"
                      ? "Cancel request"
                      : "Remove link"}
                  </button>
                )}
              </div>
            </article>
          ))}
          {!rows.length && (
            <section className={p.card}>
              <h2>Start with your first child.</h2>
              <p>
                Add a child under 18 who does not have an athlete account, or
                ask an existing athlete to approve a link. Each child keeps a
                separate sporting record.
              </p>
            </section>
          )}
        </div>
      )}
      {modal && (
        <Modal
          title={modal === "add" ? "Add a child" : "Link an existing athlete"}
          description={
            modal === "add"
              ? "For a child under 18 who does not have their own athlete account."
              : "The athlete must approve this request in Connections. You will be able to view their sporting profile, calendar, matches and team feed."
          }
          close={() => !busy && setModal(null)}
        >
          <form className={p.form} onSubmit={submit}>
            {modal === "add" ? (
              <>
                <label>
                  First name
                  <input name="first_name" required maxLength={80} />
                </label>
                <label>
                  Last name
                  <input name="last_name" required maxLength={80} />
                </label>
                <label>
                  Date of birth
                  <input name="date_of_birth" type="date" required />
                </label>
                <label className={p.check}>
                  <input name="guardian_confirmed" type="checkbox" required />I
                  am this child’s parent or legal guardian and can manage their
                  sporting information.
                </label>
              </>
            ) : (
              <label>
                Athlete’s email
                <input type="email" name="email" required maxLength={254} />
              </label>
            )}
            {error && (
              <p role="alert" className={s.error}>
                {error}
              </p>
            )}
            <div className={s.formFooter}>
              <button
                type="button"
                className={s.secondary}
                disabled={busy}
                onClick={() => setModal(null)}
              >
                Cancel
              </button>
              <button className={s.primary} disabled={busy}>
                {busy
                  ? "Saving…"
                  : modal === "add"
                    ? "Add child"
                    : "Send link request"}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {code && (
        <Modal
          title={"Coach sharing code for " + code.child}
          description="Give this code directly to your child’s coach. They can enter it in the team roster’s Athlete account option to link this child. Generating a new code replaces the previous code."
          close={() => setCode(null)}
        >
          <code className={p.code}>{code.code}</code>
          <p>
            Valid until{" "}
            {new Date(code.expires_at).toLocaleString("en-ZA", {
              timeZone: "Africa/Johannesburg",
            })}{" "}
            SAST. Only share it with a coach you trust.
          </p>
          <button className={s.primary} onClick={() => setCode(null)}>
            Done
          </button>
        </Modal>
      )}
    </div>
  );
}
