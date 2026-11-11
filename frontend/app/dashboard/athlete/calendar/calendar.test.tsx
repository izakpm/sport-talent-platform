import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import Calendar from "./page";
import { filterEvents, monthDays, type CalendarEvent } from "./calendar";
import { todayDate, shiftMonth } from "../../coaches/planning";
import { hub } from "../../team-hub/api";
jest.mock("../../team-hub/api", () => ({ hub: jest.fn() }));
const month = todayDate().slice(0, 7);
const event = {
  id: "match",
  team_id: "one",
  team_name: "First XV",
  title: "Match vs North",
  kind: "match",
  date: month + "-14",
  start_time: "10:00",
  end_time: "12:00",
  starts_at: month + "-14T08:00:00Z",
  ends_at: month + "-14T10:00:00Z",
  venue: "Main field",
  notes: "Bring match kit",
  timezone: "Africa/Johannesburg",
  cancelled: false,
};
beforeEach(() => {
  jest.clearAllMocks();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  (hub as jest.Mock).mockImplementation(async (path: string) =>
    path === "/teams"
      ? [
          { id: "one", name: "First XV" },
          { id: "two", name: "U16" },
        ]
      : [
          event,
          {
            ...event,
            id: "gym",
            team_id: "two",
            team_name: "U16",
            title: "Gym session",
            kind: "gym",
            cancelled: true,
          },
        ],
  );
});
it("builds Monday-first months correctly including leap day", () => {
  const feb = monthDays("2028-02");
  expect(feb[0]).toBeNull();
  expect(feb[1]).toBe("2028-02-01");
  expect(feb.filter(Boolean)).toHaveLength(29);
  expect(feb).toContain("2028-02-29");
  expect(monthDays("2026-11").slice(0, 6)).toEqual(Array(6).fill(null));
});
it("filters by team, type, future end time and cancellation independently", () => {
  const cancelled = { ...event, id: "cancelled", cancelled: true };
  expect(
    filterEvents(
      [event, cancelled] as CalendarEvent[],
      "one",
      "match",
      true,
      false,
      Date.parse(event.starts_at),
    ),
  ).toEqual([event]);
  expect(
    filterEvents([event] as CalendarEvent[], "two", "", false, true, 0),
  ).toEqual([]);
  expect(
    filterEvents(
      [event] as CalendarEvent[],
      "",
      "",
      true,
      true,
      Date.parse(event.ends_at) + 1,
    ),
  ).toEqual([]);
});
it("opens real match details and supports a team filter", async () => {
  render(<Calendar />);
  await screen.findByRole("button", { name: /10:00 · Match Match vs North/ });
  fireEvent.change(screen.getByLabelText("Schedule"), {
    target: { value: "one" },
  });
  expect(
    screen.queryByRole("button", { name: /Cancelled · Gym Gym session/ }),
  ).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: /10:00 · Match Match vs North/ }),
  );
  expect(
    within(screen.getByRole("dialog")).getByText("Bring match kit"),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole("dialog")).getByText("Main field"),
  ).toBeInTheDocument();
});
it("loads the next month from the server", async () => {
  render(<Calendar />);
  await screen.findByRole("button", { name: /10:00 · Match Match vs North/ });
  fireEvent.click(screen.getByRole("button", { name: "Next month" }));
  await waitFor(() =>
    expect(hub).toHaveBeenCalledWith("/calendar?month=" + shiftMonth(month, 1)),
  );
});
it("provides onboarding guidance without sample events", async () => {
  (hub as jest.Mock).mockResolvedValue([]);
  render(<Calendar />);
  expect(
    await screen.findByText("Your team schedule starts here."),
  ).toBeInTheDocument();
  expect(screen.queryByText("Match vs North")).not.toBeInTheDocument();
});
it("shows load failures rather than pretending the month is empty", async () => {
  (hub as jest.Mock).mockRejectedValue(new Error("Connection unavailable"));
  render(<Calendar />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Connection unavailable",
  );
  expect(
    screen.queryByText("Your team schedule starts here."),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
});
