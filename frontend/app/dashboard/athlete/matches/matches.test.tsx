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
async function openMatch() {
  fireEvent.click(
    await screen.findByRole("button", {
      name: /View match: First XV vs North/,
    }),
  );
}
it("updates summary totals and rows for year, team and result-view filters", async () => {
  (hub as jest.Mock).mockResolvedValue([
    match,
    {
      ...match,
      id: "tie",
      result: {
        ...match.result!,
        team_score: 10,
        opponent_score: 10,
        outcome_override: "Win",
      },
    },
    {
      ...match,
      id: "loss",
      result: { ...match.result!, team_score: 0, opponent_score: 12 },
    },
    { ...match, id: "missing", result: null },
    { ...match, id: "cancelled", cancelled: true },
    { ...match, id: "other-team", team_id: "t2", team_name: "Second XV" },
    { ...match, id: "older", date: "2024-05-14" },
  ]);
  render(<Matches />);
  await screen.findByRole("region", { name: "Filtered match summary" });
  fireEvent.change(screen.getByLabelText("Year"), {
    target: { value: "2025" },
  });
  fireEvent.change(screen.getByLabelText("Team"), { target: { value: "t1" } });
  const summary = screen.getByRole("region", {
    name: "Filtered match summary",
  });
  const stat = (label: string) =>
    within(summary).getByText(label).parentElement!;
  expect(stat("Recorded results")).toHaveTextContent("3");
  expect(stat("Win rate")).toHaveTextContent("67%");
  expect(stat("Points scored")).toHaveTextContent("38");
  expect(stat("Points conceded")).toHaveTextContent("46");
  expect(stat("Points difference")).toHaveTextContent("-8");
  expect(summary).toHaveTextContent("1 completed fixture awaiting a result");
  expect(screen.getAllByRole("button", { name: /View match:/ })).toHaveLength(
    4,
  );
  fireEvent.change(screen.getByLabelText("Show"), {
    target: { value: "cancelled" },
  });
  expect(stat("Recorded results")).toHaveTextContent("0");
  expect(stat("Win rate")).toHaveTextContent("—");
  expect(stat("Points scored")).toHaveTextContent("—");
  expect(screen.getAllByRole("button", { name: /View match:/ })).toHaveLength(
    1,
  );
});
it("filters the next fixture by year and opens its details", async () => {
  render(<Matches />);
  await screen.findByText("Match summary");
  fireEvent.change(screen.getByLabelText("Year"), {
    target: { value: "2025" },
  });
  expect(
    screen.getByText("No upcoming matches in this selection"),
  ).toBeInTheDocument();
  expect(screen.queryByText("Future derby")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Year"), {
    target: { value: "2099" },
  });
  expect(
    screen.getByRole("region", { name: "Filtered match summary" }),
  ).toHaveTextContent("No recorded results in this view");
  fireEvent.click(screen.getByRole("button", { name: "Match details ↗" }));
  expect(screen.getByRole("dialog")).toHaveTextContent("Future derby");
});
it("saves athlete-owned stats with zero distinct from blank, and displays a video link", async () => {
  render(<Matches />);
  await openMatch();
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
  await openMatch();
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
  expect(
    await within(
      await screen.findByRole("dialog", { name: "Match details" }),
    ).findByText("30 – 24"),
  ).toBeInTheDocument();
});
it("retains the edit when saving fails", async () => {
  render(<Matches coach />);
  await openMatch();
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
it("shows competition branding and published provenance without implying coach verification", async () => {
  (hub as jest.Mock).mockResolvedValue([
    {
      ...match,
      competition_code: "virseker-noordvaal-2026",
      competition_label: "Virseker Noordvaal Cup — Plaat final",
      result: {
        ...match.result!,
        source_label: "Check-e-Log",
        source_url: "https://www.checkelog.co.za/match",
      },
    },
  ]);
  render(<Matches />);
  expect(
    await screen.findByRole("img", { name: "Virseker Noordvaal Cup 2026" }),
  ).toBeInTheDocument();
  await openMatch();
  expect(screen.getByText("Published result")).toBeInTheDocument();
  expect(screen.queryByText("Coach-recorded result")).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Check-e-Log ↗" })).toHaveAttribute(
    "href",
    "https://www.checkelog.co.za/match",
  );
});
it("distinguishes verified participation from result provenance and unknown times", async () => {
  (hub as jest.Mock).mockResolvedValue([
    {
      ...match,
      attendance_status: "verified",
      notes: "[TIME_NOT_RECORDED]",
      result: { ...match.result!, source_label: "Results image" },
    },
  ]);
  render(<Matches />);
  expect(await screen.findByText("Participation verified")).toBeInTheDocument();
  await openMatch();
  expect(screen.getByText("Published result")).toBeInTheDocument();
  expect(screen.getByText(/Kick-off time not recorded/)).toBeInTheDocument();
  expect(screen.queryByText("Coach-recorded result")).not.toBeInTheDocument();
});
it("counts an equal-score knockout decision as a win and explains it", async () => {
  const result = {
    ...match.result!,
    team_score: 10,
    opponent_score: 10,
    outcome_override: "Win" as const,
    decision_note: "Montana advanced on most tries scored.",
  };
  (hub as jest.Mock).mockResolvedValue([
    {
      ...match,
      competition_code: "nwu-prestige-2026",
      competition_label: "NWU Prestige Sportreeks",
      result,
    },
  ]);
  render(<Matches />);
  expect(await screen.findByText("10 – 10")).toBeInTheDocument();
  await openMatch();
  expect(screen.getByText(result.decision_note)).toBeInTheDocument();
  expect(outcome(result)).toBe("Win");
  expect(
    screen.queryByRole("img", { name: "Virseker Noordvaal Cup 2026" }),
  ).not.toBeInTheDocument();
});

it("keeps details out of the list and closes the popup without losing filters", async () => {
  render(<Matches readOnly />);
  await screen.findByText("28 – 24");
  expect(screen.queryByText("Match kit")).not.toBeInTheDocument();
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Show"), {
    target: { value: "results" },
  });
  await openMatch();
  expect(screen.getByRole("dialog")).toHaveTextContent("Match kit");
  expect(
    screen.queryByRole("button", { name: "Add my performance" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Show")).toHaveValue("results");
});
