import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Matches from "./page";
import { hub } from "../../team-hub/api";
import { todayDate } from "../../coaches/planning";
jest.mock("../../team-hub/api", () => ({ hub: jest.fn() }));
const month = todayDate().slice(0, 7);
const match = {
  id: "m",
  kind: "match",
  title: "First XV vs North",
  team_id: "one",
  team_name: "First XV",
  date: month + "-14",
  start_time: "10:00",
  end_time: "12:00",
  starts_at: month + "-14T08:00:00Z",
  ends_at: month + "-14T10:00:00Z",
  venue: "Main field",
  notes: "Bring match kit",
  timezone: "Africa/Johannesburg",
  source: "team",
  cancelled: false,
};
beforeEach(() => {
  jest.clearAllMocks();
  (hub as jest.Mock).mockImplementation(async (path: string) =>
    path === "/teams"
      ? [{ id: "one", name: "First XV" }]
      : [
          match,
          { ...match, id: "g", kind: "gym", title: "Gym session" },
          { ...match, id: "c", title: "Cancelled derby", cancelled: true },
          {
            ...match,
            id: "p",
            title: "Personal match",
            team_id: "personal",
            team_name: "Personal session",
            source: "personal",
          },
        ],
  );
});
it("shows real match fixtures and notes without sample results or other training", async () => {
  render(<Matches />);
  expect(
    await screen.findByRole("heading", { name: match.title, level: 3 }),
  ).toBeInTheDocument();
  expect(
    screen.getAllByText("Bring match kit", { selector: "p" })[0],
  ).toBeInTheDocument();
  expect(screen.queryByText("Gym session")).not.toBeInTheDocument();
  expect(screen.queryByText("South Africa U20")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Status"), {
    target: { value: "cancelled" },
  });
  expect(
    screen.getByRole("heading", { name: "Cancelled derby", level: 3 }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: match.title, level: 3 }),
  ).not.toBeInTheDocument();
});
it("filters personal plans and loads a selected month", async () => {
  render(<Matches />);
  await screen.findByRole("heading", { name: match.title, level: 3 });
  fireEvent.change(screen.getByLabelText("Team"), {
    target: { value: "personal" },
  });
  expect(
    screen.getByRole("heading", { name: "Personal match", level: 3 }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("heading", { name: match.title, level: 3 }),
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Match month"), {
    target: { value: "2027-04" },
  });
  await waitFor(() =>
    expect(hub).toHaveBeenCalledWith("/calendar?month=2027-04"),
  );
});
it("shows an honest empty state", async () => {
  (hub as jest.Mock).mockResolvedValue([]);
  render(<Matches />);
  expect(
    await screen.findByRole("heading", { name: "No matches to show" }),
  ).toBeInTheDocument();
});
it("recovers from a failed request", async () => {
  (hub as jest.Mock).mockRejectedValue(new Error("Unable to load fixtures"));
  render(<Matches />);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Unable to load fixtures",
  );
  (hub as jest.Mock).mockResolvedValue([]);
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(
    await screen.findByRole("heading", { name: "No matches to show" }),
  ).toBeInTheDocument();
});
