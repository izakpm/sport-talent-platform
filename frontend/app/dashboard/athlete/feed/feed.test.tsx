import { fireEvent, render, screen, within } from "@testing-library/react";
import Feed from "./page";
import { hub } from "../../team-hub/api";
jest.mock("../../team-hub/api", () => ({ hub: jest.fn() }));
const team = { id: "one", name: "First XV", age_group: "U18" };
const post = {
  id: "1",
  team_id: "one",
  team_name: "First XV",
  title: "Practice cancelled",
  body: "Heavy rain. Stay home.",
  category: "cancellation",
  created_at: new Date().toISOString(),
  coach_first_name: "Coach",
  coach_last_name: "Meyer",
};
beforeEach(() => {
  jest.clearAllMocks();
  (hub as jest.Mock).mockImplementation(async (path: string) =>
    path === "/teams"
      ? [team]
      : [
          post,
          {
            ...post,
            id: "2",
            title: "Old reminder",
            category: "reminder",
            created_at: "2020-01-01T10:00:00Z",
          },
          {
            ...post,
            id: "3",
            title: "Season update",
            category: "announcement",
          },
        ],
  );
});
it("highlights recent important updates without resurfacing old reminders", async () => {
  render(<Feed />);
  const priority = await screen.findByRole("region", {
    name: "Recent changes and reminders",
  });
  expect(
    within(priority).getByRole("link", { name: /Practice cancelled/ }),
  ).toHaveAttribute("href", "#update-1");
  expect(within(priority).queryByText("Old reminder")).not.toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Old reminder" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Open calendar ↗" })).toHaveAttribute(
    "href",
    "/dashboard/athlete/calendar",
  );
  expect(
    screen.queryByRole("button", { name: "+ Post an update" }),
  ).not.toBeInTheDocument();
});
it("filters by type and search, with an easy reset", async () => {
  render(<Feed />);
  await screen.findByRole("heading", { name: "Season update" });
  fireEvent.click(screen.getByRole("button", { name: "Announcements (1)" }));
  expect(
    screen.queryByRole("heading", { name: "Practice cancelled" }),
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Search updates"), {
    target: { value: "missing" },
  });
  expect(
    screen.getByText("No updates match your filters."),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(
    screen.getByRole("heading", { name: "Practice cancelled" }),
  ).toBeInTheDocument();
});
it("clears old team content when the new team request fails", async () => {
  (hub as jest.Mock).mockImplementation(async (path: string) =>
    path === "/teams"
      ? [team, { ...team, id: "two", name: "Second XV" }]
      : path.includes("?team=")
        ? Promise.reject(new Error("Team unavailable"))
        : [post],
  );
  render(<Feed />);
  await screen.findByRole("heading", { name: "Practice cancelled" });
  fireEvent.change(screen.getByLabelText("Team"), { target: { value: "two" } });
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Team unavailable",
  );
  expect(
    screen.queryByRole("heading", { name: "Practice cancelled" }),
  ).not.toBeInTheDocument();
});
it("expands long messages and retains line breaks", async () => {
  (hub as jest.Mock).mockImplementation(async (path: string) =>
    path === "/teams"
      ? [team]
      : [{ ...post, body: "A".repeat(410) + "\nBring boots" }],
  );
  render(<Feed />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Read full update" }),
  );
  expect(screen.getByText(/Bring boots/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Show less" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
});
it("explains missing team links", async () => {
  (hub as jest.Mock).mockResolvedValue([]);
  render(<Feed />);
  expect(
    await screen.findByText("Your team updates start here."),
  ).toBeInTheDocument();
});
