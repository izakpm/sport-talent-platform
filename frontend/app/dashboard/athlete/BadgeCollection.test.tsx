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
  await screen.findByText("42h");
  expect(
    screen.getByRole("link", { name: "View all badges ↗" }),
  ).toHaveAttribute("href", "/dashboard/profile#achievement");
  expect(screen.getAllByRole("button", { name: /hour club/ })).toHaveLength(3);
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
