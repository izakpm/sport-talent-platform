import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import Page from "./page";
import SessionAttendance from "../../team-hub/SessionAttendance";
import { fetchWithAuth } from "../../../lib/api";
jest.mock("../../../lib/api", () => ({ fetchWithAuth: jest.fn() }));
const api = fetchWithAuth as jest.Mock;
const event = {
  id: "event",
  team_id: "team",
  team_name: "First XV",
  title: "Practice",
  date: "2026-11-11",
  start_time: "16:00",
  end_time: "17:00",
  starts_at: "2020-01-01T00:00:00Z",
  ends_at: "2020-01-01T01:00:00Z",
  cancelled: false,
};
const row = {
  event_id: "event",
  player_id: "player",
  first_name: "Izak",
  last_name: "Meyer",
  title: "Practice",
  team_name: "First XV",
  date: "2026-11-11",
  note: "I joined the full session.",
};
const ok = (data: unknown) => ({ ok: true, json: async () => data });
beforeEach(() => {
  window.history.replaceState(null, "", "/");
  api.mockReset();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
function setup(fail = false) {
  let pending = [row];
  api.mockImplementation(async (path: string, opts?: RequestInit) => {
    if (opts?.method && opts.method !== "GET") {
      if (fail)
        return { ok: false, json: async () => ({ message: "Unable to save" }) };
      pending = [];
      return ok({ status: "verified" });
    }
    return ok(
      path.endsWith("/pending")
        ? pending
        : path.endsWith("/sessions")
          ? [event]
          : path.endsWith("/teams")
            ? [{ id: "team", name: "First XV" }]
            : path.endsWith("/sessions/event")
              ? { event, players: [] }
              : [],
    );
  });
}
it("reviews a real request and updates the queue and sidebar notification", async () => {
  setup();
  const listener = jest.fn();
  window.addEventListener("attendance-updated", listener);
  render(<Page />);
  const card = await screen.findByRole("article", {
    name: "Izak Meyer attendance request",
  });
  fireEvent.change(screen.getByLabelText("Find an attendance request"), {
    target: { value: "Nobody" },
  });
  expect(screen.queryByRole("article")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
  fireEvent.click(
    within(screen.getByRole("article")).getByRole("button", {
      name: "Verify attendance",
    }),
  );
  await screen.findByText("Izak Meyer: attendance verified.");
  expect(api).toHaveBeenCalledWith(
    "/team-hub/sessions/event/players/player",
    expect.objectContaining({ body: JSON.stringify({ status: "verified" }) }),
  );
  expect(screen.queryByRole("article")).not.toBeInTheDocument();
  expect(listener).toHaveBeenCalled();
  window.removeEventListener("attendance-updated", listener);
});
it("keeps failed requests available to retry", async () => {
  setup(true);
  render(<Page />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Decline request" }),
  );
  await screen.findByText("Unable to save");
  expect(screen.getByRole("article")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Decline request" })).toBeEnabled();
});
it("filters session registers and opens the real attendance modal", async () => {
  setup();
  render(<Page />);
  await screen.findByRole("article");
  fireEvent.click(screen.getByRole("tab", { name: "Session registers" }));
  fireEvent.change(screen.getByLabelText("Sessions"), {
    target: { value: "upcoming" },
  });
  expect(screen.getByText("No sessions in this view.")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Sessions"), {
    target: { value: "recent" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Open register & QR" }));
  expect(
    await screen.findByRole("heading", { name: "Attendance register" }),
  ).toBeInTheDocument();
});
it("blocks attendance and QR actions before their time windows", async () => {
  api.mockResolvedValue(
    ok({
      event: {
        ...event,
        starts_at: "2099-01-01T00:00:00Z",
        ends_at: "2099-01-01T01:00:00Z",
      },
      players: [
        { id: "player", first_name: "Izak", last_name: "Meyer", linked: true },
      ],
    }),
  );
  render(<SessionAttendance sessionId="event" />);
  expect(
    await screen.findByRole("button", { name: "Attended" }),
  ).toBeDisabled();
  expect(
    screen.getByRole("button", { name: "Show check-in QR code" }),
  ).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Find a player"), {
    target: { value: "Nobody" },
  });
  expect(
    screen.getByText("No players match these filters."),
  ).toBeInTheDocument();
});

