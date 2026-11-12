import { fetchWithAuth } from "../../lib/api";
import type { GuardianChild } from "../../lib/guardian-context";
import type { CalendarEvent } from "../athlete/calendar/calendar";
import type { Match } from "../matches/MatchesWorkspace";
import type { FeedPost } from "../athlete/feed/page";
import type { TrainingActivity } from "../team-hub/training-api";
import type { HubEvent } from "../team-hub/api";
export type Section =
  | "overview"
  | "profile"
  | "activities"
  | "matches"
  | "calendar"
  | "feed"
  | "connections";
import type { Profile } from "../profile/AthleteProfile";
export type { Profile } from "../profile/AthleteProfile";
export type Network = {
  teams: { id: string; name: string }[];
  people: { id: string; name: string; role: string; team_ids: string[] }[];
};
export type ChildData = {
  child: GuardianChild;
  profile?: Profile;
  calendar?: CalendarEvent[];
  matches?: Match[];
  feed?: FeedPost[];
  activities?: TrainingActivity[];
  attendance?: HubEvent[];
  connections?: Network;
  error?: string;
};
export async function childRead<T>(
  child: GuardianChild,
  path: string,
): Promise<T> {
  const res = await fetchWithAuth(path, {
    headers: { "X-Athlete-Id": child.id },
    cache: "no-store",
  });
  if (!res?.ok)
    throw Error(
      "Unable to load this child's information. Refresh to check their link and try again.",
    );
  return res.json();
}
export async function loadChild(
  child: GuardianChild,
  section: Section,
  month: string,
): Promise<ChildData> {
  const result: ChildData = { child };
  // Every request is independently authorized by the backend. Never borrow another child's context.
  const jobs: Promise<void>[] = [];
  if (["overview", "profile"].includes(section))
    jobs.push(
      childRead<Profile>(child, "/athlete-profile").then((v) => {
        result.profile = v;
      }),
    );
  if (["overview", "calendar"].includes(section))
    jobs.push(
      childRead<CalendarEvent[]>(
        child,
        "/team-hub/calendar?month=" + month,
      ).then((v) => {
        result.calendar = v;
      }),
    );
  if (section === "matches")
    jobs.push(
      childRead<Match[]>(child, "/team-hub/matches").then((v) => {
        result.matches = v;
      }),
    );
  if (["overview", "feed"].includes(section))
    jobs.push(
      childRead<FeedPost[]>(child, "/team-hub/feed").then((v) => {
        result.feed = v;
      }),
    );
  if (section === "activities" && child.mode === "managed") {
    jobs.push(
      childRead<TrainingActivity[]>(child, "/activities").then((v) => {
        result.activities = v;
      }),
    );
    jobs.push(
      childRead<HubEvent[]>(child, "/team-hub/sessions").then((v) => {
        result.attendance = v;
      }),
    );
  }
  if (section === "connections" && child.mode === "managed")
    jobs.push(
      childRead<Network>(child, "/team-hub/connections").then((v) => {
        result.connections = v;
      }),
    );
  try {
    await Promise.all(jobs);
    return result;
  } catch (e) {
    return { child, error: (e as Error).message };
  }
}
export function mergeShared<T extends { id: string }>(
  rows: { child: GuardianChild; values: T[] }[],
) {
  const result = new Map<string, { item: T; children: GuardianChild[] }>();
  for (const row of rows)
    for (const item of row.values) {
      const old = result.get(item.id);
      if (old) {
        if (!old.children.some((c) => c.id === row.child.id))
          old.children.push(row.child);
      } else result.set(item.id, { item, children: [row.child] });
    }
  return [...result.values()];
}

export async function childWrite<T>(
  child: GuardianChild,
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  if (child.mode !== "managed" || child.status !== "accepted")
    throw Error("This athlete's information is read-only.");
  const res = await fetchWithAuth(path, {
    method,
    headers: { "X-Athlete-Id": child.id },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res) throw Error("Your session expired. Please sign in again.");
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw Error(
      typeof data.message === "string"
        ? data.message
        : "Unable to save. Please try again.",
    );
  return data;
}
