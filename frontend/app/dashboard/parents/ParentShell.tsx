"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { fetchWithAuth } from "../../lib/api";
import {
  childContext,
  selectChild,
  childWorkspacePath,
  type GuardianChild,
} from "../../lib/guardian-context";
import { getDashboardRoleConfig } from "../core/roles";
import s from "../coach-shell.module.css";
import p from "./parents.module.css";
export default function ParentShell({
  children,
  name,
}: {
  children: ReactNode;
  name: string;
}) {
  const path = usePathname(),
    router = useRouter();
  const [child, setChild] = useState<GuardianChild | null>(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const inside = childWorkspacePath(path);
  useEffect(() => {
    let active = true;
    setReady(false);
    setError("");
    if (!inside) {
      setChild(null);
      setReady(true);
      return;
    }
    const load = async () => {
      try {
        const res = await fetchWithAuth("/guardian/children");
        if (!res?.ok) throw Error("Unable to check access to this child.");
        const rows: GuardianChild[] = await res.json();
        const id = path.startsWith("/dashboard/parents/view/")
          ? path.split("/").pop()
          : childContext()?.id;
        const current = rows.find(
          (c) => c.id === id && c.status === "accepted",
        );
        if (!active) return;
        if (!current) {
          setReady(false);
          router.replace("/dashboard/parents");
          return;
        }
        selectChild(current);
        setChild(current);
        if (
          current.mode === "view" &&
          !path.startsWith("/dashboard/parents/view/")
        ) {
          router.replace("/dashboard/parents/view/" + current.id);
          return;
        }
        setReady(true);
      } catch (e) {
        if (active) {
          setError((e as Error).message);
          setReady(false);
        }
      }
    };
    load();
    const timer = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [path, inside, router]);
  const items = getDashboardRoleConfig("GUARDIAN").navGroups[0].items;
  return (
    <div className={s.shell}>
      <a href="#coach-content" className={s.skip}>
        Skip to content
      </a>
      <aside className={s.sidebar}>
        <Link href="/dashboard/parents" className={s.brand}>
          <img
            src="/PlayVerified Logo.png"
            alt="PlayVerified"
            width="176"
            height="60"
          />
        </Link>
        <p className={s.label}>PARENT WORKSPACE</p>
        <nav
          className={`${s.nav} ${p.parentNav}`}
          aria-label="Parent navigation"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={path === item.href ? "page" : undefined}
            >
              <span>•</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className={s.account}>
          <span className={s.avatar}>{name[0]}</span>
          <div className={s.accountDetails}>
            <strong>{name}</strong>
            <small>Parent / Guardian</small>
          </div>
        </div>
        <button
          className={s.logout}
          onClick={() => {
            sessionStorage.removeItem("guardian-child");
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            router.push("/login");
          }}
        >
          Log out
        </button>
      </aside>
      <main id="coach-content" className={s.main}>
        {inside && child && (
          <div className={p.context}>
            <div>
              <strong>
                {child.first_name} {child.last_name}
              </strong>
              <span>
                {child.mode === "managed"
                  ? "Managing their athlete profile"
                  : "Read-only access approved by this athlete"}
              </span>
            </div>
            <Link href="/dashboard/parents/profile">
              Back to family profiles ↗
            </Link>
          </div>
        )}
        {error ? (
          <p role="alert">
            {error} <Link href="/dashboard/parents">Back to my children</Link>
          </p>
        ) : ready ? (
          children
        ) : (
          <p role="status">Opening your family workspace…</p>
        )}
      </main>
    </div>
  );
}
