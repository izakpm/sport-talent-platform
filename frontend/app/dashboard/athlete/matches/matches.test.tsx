import { fireEvent, render, screen, within } from "@testing-library/react";
import Matches, { type Match, outcome } from "../../matches/MatchesWorkspace";
import { hub } from "../../team-hub/api";
jest.mock("../../team-hub/api", () => ({ hub: jest.fn() }));
const match: Match = {
  id: "m1",
  team_id: "t1",
  team_name: "First XV",
  title: "First XV vs North",
  date: "2025-05-14",
  start_time: "10:00",
  end_time: "12:00",
  starts_at: "2025-05-14T08:00:00Z",
  ends_at: "2025-05-14T10:00:00Z",
  venue: "Main field",
  notes: "Match kit",
  sport: "Rugby",
  timezone: "Africa/Johannesburg",
  cancelled: false,
  result: { opponent: "North", team_score: 28, opponent_score: 24 },
  stats: null,
};
beforeEach(() => {
  jest.clearAllMocks();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  (hub as jest.Mock).mockResolvedValue([
    match,
    {
      ...match,
      id: "future",
      title: "Future derby",
      date: "2099-06-01",
      starts_at: "2099-06-01T08:00:00Z",
      ends_at: "2099-06-01T10:00:00Z",
      result: null,
    },
  ]);
});
it("shows historical scores alongside upcoming fixtures without a month restriction", async () => {
  render(<Matches />);
  expect(await screen.findByText("28 – 24")).toBeInTheDocument();
  expect(screen.getByText("Win")).toBeInTheDocument();
  expect(screen.getAllByText("Future derby").length).toBeGreaterThan(0);
  expect(
    screen.queryByRole("button", { name: "Edit result" }),
  ).not.toBeInTheDocument();
  expect(outcome({ ...match.result!, team_score: 24 })).toBe("Draw");
  expect(outcome({ ...match.result!, team_score: 0 })).toBe("Loss");
});
it("saves athlete-owned stats with zero distinct from blank, and displays a video link", async () => {
  render(<Matches />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Add my performance" }),
  );
  const d = screen.getByRole("dialog");
  fireEvent.change(within(d).getByLabelText("Tries"), {
    target: { value: "0" },
  });
  fireEvent.change(within(d).getByLabelText("Match or highlights video"), {
    target: { value: "https://youtu.be/example" },
  });
  (hub as jest.Mock).mockResolvedValue({
    ...match,
    stats: {
      position: "",
      minutes: null,
      tries: 0,
      tackles: null,
      conversions: null,
      penalties: null,
      video_url: "https://youtu.be/example",
      notes: "",
    },
  });
  fireEvent.click(
    within(d).getByRole("button", { name: "Save my performance" }),
  );
  expect(
    await screen.findByRole("link", { name: "Watch my match video ↗" }),
  ).toHaveAttribute("href", "https://youtu.be/example");
  expect(hub).toHaveBeenLastCalledWith(
    "/matches/m1/stats",
    expect.objectContaining({ tries: 0, minutes: null }),
  );
});
it("allows coaches to edit scores but not athlete performance", async () => {
  render(<Matches coach />);
  fireEvent.click(await screen.findByRole("button", { name: "Edit result" }));
  const d = screen.getByRole("dialog");
  expect(within(d).getByLabelText("First XV score")).toHaveValue(28);
  expect(
    screen.queryByRole("button", { name: "Add my performance" }),
  ).not.toBeInTheDocument();
  (hub as jest.Mock).mockResolvedValue({
    ...match,
    result: { ...match.result!, team_score: 30 },
  });
  fireEvent.change(within(d).getByLabelText("First XV score"), {
    target: { value: "30" },
  });
  fireEvent.click(within(d).getByRole("button", { name: "Save result" }));
  expect(await screen.findByText("30 – 24")).toBeInTheDocument();
});
it("retains the edit when saving fails", async () => {
  render(<Matches coach />);
  fireEvent.click(await screen.findByRole("button", { name: "Edit result" }));
  (hub as jest.Mock).mockRejectedValue(new Error("Cannot save"));
  fireEvent.click(screen.getByRole("button", { name: "Save result" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Cannot save");
  expect(screen.getByLabelText("Opponent")).toHaveValue("North");
});
it("filters teams and cancelled matches", async () => {
  (hub as jest.Mock).mockResolvedValue([
    match,
    {
      ...match,
      id: "2",
      team_id: "t2",
      team_name: "U16",
      title: "Cancelled derby",
      cancelled: true,
      result: null,
    },
  ]);
  render(<Matches />);
  await screen.findByText("28 – 24");
  fireEvent.change(screen.getByLabelText("Team"), { target: { value: "t2" } });
  expect(screen.queryByText("28 – 24")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Show"), {
    target: { value: "cancelled" },
  });
  expect(screen.getByText("Cancelled derby")).toBeInTheDocument();
});
it("shows a recoverable loading error", async () => {
  (hub as jest.Mock).mockRejectedValue(new Error("Connection failed"));
  render(<Matches />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Connection failed",
  );
  (hub as jest.Mock).mockResolvedValue([]);
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(
    await screen.findByText("No previous matches yet"),
  ).toBeInTheDocument();
});
