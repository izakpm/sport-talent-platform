import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import CoachWorkspace from "./CoachWorkspace";
import { calendarDays, recurrenceCount, shiftMonth } from "./planning";
import { fetchWithAuth } from "../../lib/api";
jest.mock("../../lib/api", () => ({ fetchWithAuth: jest.fn() }));
const request = jest.mocked(fetchWithAuth);
const team = {
  id: "team-1",
  name: "First XV",
  age_group: "U18",
  venue: "Main field",
  sport: "Rugby",
  timezone: "Africa/Johannesburg",
};
beforeEach(() => {
  request.mockReset();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  request.mockImplementation(
    async (path) =>
      ({
        ok: true,
        json: async () => (path.endsWith("/teams") ? [team] : []),
      }) as Response,
  );
});
it("lays out leap February Monday-first and crosses year boundaries", () => {
  const days = calendarDays("2028-02");
  expect(days[0]).toBeNull();
  expect(days[1]).toBe("2028-02-01");
  expect(days.filter(Boolean)).toHaveLength(29);
  expect(days.length % 7).toBe(0);
  expect(shiftMonth("2026-12", 1)).toBe("2027-01");
  expect(recurrenceCount("2026-11-01", "2026-11-30", [1, 3])).toBe(9);
});
it("creates a team and refreshes the persisted team list", async () => {
  let saved = false;
  request.mockImplementation(async (path, options) => {
    if (options?.method === "POST") {
      saved = true;
      return { ok: true, json: async () => team } as Response;
    }
    return {
      ok: true,
      json: async () => (path.endsWith("/teams") && saved ? [team] : []),
    } as Response;
  });
  render(<CoachWorkspace mode="teams" />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Create your first team" }),
  );
  const dialog = screen.getByRole("dialog");
  fireEvent.change(within(dialog).getByLabelText("Team name"), {
    target: { value: "First XV" },
  });
  fireEvent.click(within(dialog).getByRole("button", { name: "Create team" }));
  expect(
    await screen.findByRole("heading", { name: "First XV" }),
  ).toBeInTheDocument();
  expect(request).toHaveBeenCalledWith(
    "/coach-planning/teams",
    expect.objectContaining({ method: "POST" }),
  );
});
it("sends weekly recurrence and keeps the form open on a conflict", async () => {
  request.mockImplementation(
    async (path, options) =>
      ({
        ok: !options?.method,
        json: async () =>
          options?.method
            ? { message: "This team already has a session at that time." }
            : path.endsWith("/teams")
              ? [team]
              : [],
      }) as Response,
  );
  render(<CoachWorkspace mode="schedule" />);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Add session" })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Add session" }));
  const dialog = screen.getByRole("dialog");
  fireEvent.click(within(dialog).getByLabelText(/Repeat weekly/));
  fireEvent.change(within(dialog).getByLabelText("Start date"), {
    target: { value: "2026-11-01" },
  });
  fireEvent.change(within(dialog).getByLabelText("Repeat until"), {
    target: { value: "2026-11-30" },
  });
  fireEvent.submit(
    within(dialog).getByLabelText("Session title").closest("form")!,
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "already has a session",
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  const call = request.mock.calls.find(
    ([, options]) => options?.method === "POST",
  );
  expect(JSON.parse(call![1].body).repeat.until).toBe("2026-11-30");
});
