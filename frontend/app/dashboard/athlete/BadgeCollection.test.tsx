import { render, screen, fireEvent, within } from "@testing-library/react";
import BadgeCollection from "./BadgeCollection";
import { fetchWithAuth } from "../../lib/api";
jest.mock("../../lib/api", () => ({ fetchWithAuth: jest.fn() }));
const data = {
  training: {
    verified_minutes: 2520,
    next_hours: 50,
    remaining_minutes: 480,
    milestones: [10, 25, 50, 100, 250].map((hours) => ({
      id: "training-" + hours,
      kind: "training",
      title: hours + "-hour club",
      hours,
      earned: hours < 50,
    })),
  },
  sporting: [
    {
      id: "provincial",
      kind: "provincial",
      title: "Provincial selection",
      earned: false,
      organisation: "Blue Bulls",
      achievement: "U15 selection",
      season: "2026",
      verification_status: "pending",
    },
  ],
};
beforeEach(() => {
  jest.resetAllMocks();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  (fetchWithAuth as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => data,
  });
});
it("shows verified progress and keeps pending selection badges unearned", async () => {
  render(<BadgeCollection />);
  expect(await screen.findByText("42h")).toBeInTheDocument();
  expect(screen.getByText("8h to your 50-hour badge")).toBeInTheDocument();
  expect(screen.getByRole("progressbar")).toHaveAttribute("value", "2520");
  expect(screen.getByRole("progressbar")).toHaveAttribute("max", "3000");
  const badge = screen.getByRole("button", {
    name: /Provincial selection.*Awaiting coach review/,
  });
  expect(badge).toHaveAttribute("data-earned", "false");
  fireEvent.click(badge);
  expect(
    within(screen.getByRole("dialog")).getByText(
      "Your coach is reviewing this achievement.",
    ),
  ).toBeInTheDocument();
});
it("keeps the overview compact and links to the full collection", async () => {
  render(<BadgeCollection compact />);
  const badge = await screen.findByRole("button", {
    name: "25-hour club · Earned",
  });
  expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: "Your badges" }),
  ).not.toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: /hour club/ })).toHaveLength(2);
  fireEvent.click(badge);
  expect(
    screen.getByRole("link", { name: "All badges & progress ↗" }),
  ).toHaveAttribute("href", "/dashboard/profile#achievement");
  expect(
    screen.queryByRole("button", { name: /Provincial selection/ }),
  ).not.toBeInTheDocument();
});
it("does not present a failed load as zero earned badges", async () => {
  (fetchWithAuth as jest.Mock).mockResolvedValue({ ok: false });
  render(<BadgeCollection />);
  await screen.findByRole("alert");
  expect(screen.queryByText(/0 earned/)).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Retry badges" }),
  ).toBeInTheDocument();
});

it("groups repeat awards and shows every distinct earned badge", async () => {
  (fetchWithAuth as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({
      ...data,
      training: {
        ...data.training,
        awards: [
          ...data.training.milestones
            .filter((b) => b.earned)
            .map((b) => ({ ...b, season: "2026" })),
          {
            ...data.training.milestones[0],
            id: "old-training",
            season: "2025",
          },
        ],
      },
      sporting: [
        { ...data.sporting[0], id: "bulls-1", earned: true, season: "2026" },
        { ...data.sporting[0], id: "bulls-2", earned: true, season: "2024" },
        ...[1, 2, 3].map((n) => ({
          id: "captain-" + n,
          kind: "captain",
          title: "Team captain",
          earned: true,
          season: "202" + n,
          achievement: "Captain " + n,
        })),
      ],
    }),
  });
  render(<BadgeCollection compact />);
  const bulls = await screen.findByRole("button", {
    name: /Provincial selection.*Earned 2 times/,
  });
  expect(screen.getAllByRole("button")).toHaveLength(4);
  expect(
    screen.getByRole("button", { name: /Team captain.*Earned 3 times/ }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /10-hour club.*Earned 2 times/ }),
  ).toBeInTheDocument();
  fireEvent.click(bulls);
  expect(
    within(screen.getByRole("dialog")).getByText(/2024 · U15 selection/),
  ).toBeInTheDocument();
});
