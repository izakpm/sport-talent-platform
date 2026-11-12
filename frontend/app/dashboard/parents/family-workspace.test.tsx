import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FamilyContent } from "./FamilyWorkspace";
import { fetchWithAuth } from "../../lib/api";
import { loadChild, mergeShared } from "./family-data";
import { getDashboardRoleConfig } from "../core/roles";
import type { GuardianChild } from "../../lib/guardian-context";
jest.mock("../../lib/api", () => ({ fetchWithAuth: jest.fn() }));
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));
const api = fetchWithAuth as jest.Mock;
const child = (
  id: string,
  name: string,
  mode: "managed" | "view" = "managed",
): GuardianChild => ({
  id,
  link_id: id,
  first_name: name,
  last_name: "Test",
  mode,
  status: "accepted",
});
const children = [child("one", "Junior"), child("two", "Senior", "view")];
const ok = (value: unknown) => ({ ok: true, json: async () => value });
beforeEach(() => {
  api.mockReset();
  sessionStorage.clear();
  localStorage.setItem(
    "user",
    JSON.stringify({ id: "parent", role: "GUARDIAN" }),
  );
});
it("shows the standard menu without requiring a child selection", () => {
  expect(
    getDashboardRoleConfig("GUARDIAN").navGroups[0].items.map((i) => i.name),
  ).toEqual([
    "Dashboard",
    "Profile",
    "Activities",
    "Matches",
    "Calendar",
    "Team Feed",
    "Connections",
    "Resources",
    "My children",
  ]);
});
it("shows achievements for all children and filters in place", async () => {
  api.mockImplementation(async (path: string, options: any) =>
    path === "/guardian/children"
      ? ok(children)
      : ok({
          details: {},
          sports: [],
          entries: [
            {
              id: options.headers["X-Athlete-Id"],
              kind: "achievement",
              title:
                options.headers["X-Athlete-Id"] === "one"
                  ? "Junior award"
                  : "Senior award",
            },
          ],
        }),
  );
  render(<FamilyContent section="profile" />);
  await screen.findByRole("heading", { name: "Junior Test" });
  fireEvent.click(screen.getByRole("button", { name: "Achievements" }));
  expect(screen.getByText("Junior award")).toBeInTheDocument();
  expect(screen.getByText("Senior award")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Edit Senior/ }),
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Show children"), {
    target: { value: "two" },
  });
  expect(screen.queryByText("Junior award")).not.toBeInTheDocument();
  expect(screen.getByText("Senior award")).toBeInTheDocument();
  expect(sessionStorage.getItem("family-filter:parent")).toBe("two");
  fireEvent.change(screen.getByLabelText("Show children"), {
    target: { value: "" },
  });
  expect(screen.getByText("Junior award")).toBeInTheDocument();
});
it("deduplicates shared sessions while retaining both child labels", () => {
  const result = mergeShared(
    children.map((c) => ({
      child: c,
      values: [{ id: "session", title: "Practice" }],
    })),
  );
  expect(result).toHaveLength(1);
  expect(result[0].children.map((c) => c.id)).toEqual(["one", "two"]);
});
it("never requests private activity data for an older linked athlete", async () => {
  expect(await loadChild(children[1], "activities", "2026-11")).toEqual({
    child: children[1],
  });
  expect(api).not.toHaveBeenCalled();
});
it("does not mix child identity in concurrent requests", async () => {
  api.mockResolvedValue(ok([]));
  await Promise.all(children.map((c) => loadChild(c, "calendar", "2026-11")));
  expect(api.mock.calls.map((c) => c[1].headers["X-Athlete-Id"])).toEqual([
    "one",
    "two",
  ]);
});
it("clears a child's data when refresh finds its link revoked", async () => {
  let revoked = false;
  api.mockImplementation(async (path: string) =>
    path === "/guardian/children"
      ? ok(revoked ? [] : [children[0]])
      : ok({ details: {}, sports: [], entries: [] }),
  );
  render(<FamilyContent section="profile" />);
  await screen.findByRole("heading", { name: "Junior Test" });
  revoked = true;
  fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("heading", { name: "Junior Test" }),
    ).not.toBeInTheDocument(),
  );
});

it("opens and closes shared session details", async () => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  api.mockImplementation(async (path: string) =>
    path === "/guardian/children"
      ? ok(children)
      : ok([
          {
            id: "gym",
            title: "Gym session",
            date: "2026-11-17",
            start_time: "15:00",
            end_time: "16:00",
            starts_at: "2026-11-17T13:00:00Z",
            ends_at: "2026-11-17T14:00:00Z",
            timezone: "Africa/Johannesburg",
            kind: "gym",
          },
        ]),
  );
  render(<FamilyContent section="calendar" />);
  const buttons = await screen.findAllByRole("button", { name: /Gym session/ });
  fireEvent.click(buttons[0]);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
