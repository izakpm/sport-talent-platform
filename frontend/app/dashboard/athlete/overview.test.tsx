import { render, screen, waitFor } from "@testing-library/react";
import Overview from "./page";
import { hub } from "../team-hub/api";
jest.mock("../team-hub/api", () => ({
  hub: jest.fn(),
  attendanceLabel: (status: string) =>
    status === "verified" ? "Verified by coach" : "Not recorded",
}));
beforeEach(() => {
  localStorage.setItem("user", JSON.stringify({ first_name: "Izak" }));
  jest.clearAllMocks();
});
afterEach(() => localStorage.clear());
it("shows actionable empty guidance without invented statistics", async () => {
  (hub as jest.Mock).mockResolvedValue([]);
  render(<Overview />);
  expect(
    await screen.findByText("Your team journey starts here."),
  ).toBeInTheDocument();
  expect(screen.getByText("Welcome back, Izak.")).toBeInTheDocument();
  expect(screen.getAllByText("0")).toHaveLength(4);
  expect(screen.queryByText("86%")).not.toBeInTheDocument();
});
it("excludes cancellations and presents real upcoming sessions and team updates", async () => {
  const event = {
    id: "1",
    title: "Gym session",
    starts_at: new Date(Date.now() + 3600000).toISOString(),
    ends_at: new Date(Date.now() + 7200000).toISOString(),
    team_name: "U16",
    cancelled: false,
  };
  (hub as jest.Mock).mockImplementation(async (path: string) =>
    path === "/teams"
      ? [{ id: "team", name: "U16" }]
      : path === "/sessions"
        ? [
            event,
            { ...event, id: "2", title: "Cancelled practice", cancelled: true },
          ]
        : [
            {
              id: "post",
              title: "Bring boots",
              body: "Training is on grass.",
              team_name: "U16",
              created_at: new Date().toISOString(),
              category: "reminder",
            },
          ],
  );
  render(<Overview />);
  expect(await screen.findByText("Gym session")).toBeInTheDocument();
  expect(screen.queryByText("Cancelled practice")).not.toBeInTheDocument();
  expect(screen.getByText("Bring boots")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Session & attendance ↗" }),
  ).toHaveAttribute("href", "/dashboard/athlete/activities#attendance");
});
it("does not present a failed request as an empty team or zero attendance", async () => {
  (hub as jest.Mock).mockRejectedValue(new Error("offline"));
  render(<Overview />);
  await screen.findByRole("alert");
  expect(
    screen.queryByText("Your team journey starts here."),
  ).not.toBeInTheDocument();
  expect(screen.queryByText("0")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
});
