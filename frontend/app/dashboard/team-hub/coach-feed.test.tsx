import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from "@testing-library/react";
import TeamFeed from "./TeamFeed";
import { hub } from "./api";
import { planningRequest } from "../coaches/planning";
jest.mock("./api", () => ({ hub: jest.fn() }));
jest.mock("../coaches/planning", () => ({
  ...jest.requireActual("../coaches/planning"),
  planningRequest: jest.fn(),
}));
const teams = [
  { id: "one", name: "First XV", age_group: "U18" },
  { id: "two", name: "Second XV", age_group: "U16" },
];
beforeEach(() => {
  jest.clearAllMocks();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  (hub as jest.Mock).mockImplementation(async (path: string) =>
    path === "/teams" ? teams : [],
  );
  (planningRequest as jest.Mock).mockResolvedValue([
    {
      id: "event",
      team_id: "one",
      title: "Rugby practice",
      date: "2026-11-21",
      start_time: "16:00",
      end_time: "17:00",
      venue: "Main field",
    },
    {
      id: "other",
      team_id: "two",
      title: "Other team",
      date: "2026-11-21",
      start_time: "16:00",
    },
    {
      id: "cancelled",
      team_id: "one",
      title: "Cancelled session",
      cancelled: true,
    },
  ]);
});
it("posts session updates to the selected team and previews context", async () => {
  render(<TeamFeed coach />);
  await screen.findByText("No team updates yet.");
  fireEvent.click(screen.getByRole("button", { name: "Session update +" }));
  const d = screen.getByRole("dialog");
  await within(d).findByRole("option", { name: /Rugby practice/ });
  expect(
    within(d).queryByRole("option", { name: /Other team/ }),
  ).not.toBeInTheDocument();
  expect(
    within(d).queryByRole("option", { name: /Cancelled session/ }),
  ).not.toBeInTheDocument();
  fireEvent.change(within(d).getByLabelText("Scheduled session"), {
    target: { value: "event" },
  });
  fireEvent.change(within(d).getByLabelText("Subject"), {
    target: { value: "Bring boots" },
  });
  fireEvent.change(within(d).getByLabelText("Message"), {
    target: { value: "Boots and water please." },
  });
  fireEvent.click(within(d).getByRole("button", { name: "Preview update" }));
  expect(
    within(d).getByRole("region", { name: "Update preview" }),
  ).toHaveTextContent("Main field");
  fireEvent.click(within(d).getByRole("button", { name: "Post to team" }));
  await waitFor(() =>
    expect(hub).toHaveBeenCalledWith("/feed", {
      team_id: "one",
      category: "session_update",
      event_id: "event",
      title: "Bring boots",
      body: "Boots and water please.",
    }),
  );
  expect(
    await screen.findByText("Update posted to the team feed."),
  ).toBeInTheDocument();
});
it("resets the selected session on team change and keeps the written draft", async () => {
  render(<TeamFeed coach />);
  await screen.findByText("No team updates yet.");
  fireEvent.click(screen.getByRole("button", { name: "Session update +" }));
  const d = screen.getByRole("dialog");
  await within(d).findByRole("option", { name: /Rugby practice/ });
  fireEvent.change(within(d).getByLabelText("Scheduled session"), {
    target: { value: "event" },
  });
  fireEvent.change(within(d).getByLabelText("Message"), {
    target: { value: "Keep my draft" },
  });
  fireEvent.change(within(d).getByLabelText("Team"), {
    target: { value: "two" },
  });
  await within(d).findByRole("option", { name: /Other team/ });
  expect(within(d).getByLabelText("Scheduled session")).toHaveValue("");
  expect(within(d).getByLabelText("Message")).toHaveValue("Keep my draft");
  expect(
    within(d).getByRole("button", { name: "Post to team" }),
  ).toBeDisabled();
});
it("preserves removal confirmation and does not offer removal of cancellations", async () => {
  const p = {
    id: "p",
    team_id: "one",
    team_name: "First XV",
    title: "Reminder",
    body: "Kit",
    category: "reminder",
    created_at: "2026-11-11T10:00:00Z",
  };
  (hub as jest.Mock).mockImplementation(async (path: string) =>
    path === "/teams"
      ? teams
      : [p, { ...p, id: "c", title: "Cancelled", category: "cancellation" }],
  );
  render(<TeamFeed coach />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Remove", exact: true }),
  );
  const d = screen.getByRole("dialog");
  fireEvent.click(within(d).getByRole("button", { name: "Keep update" }));
  expect(hub).not.toHaveBeenCalledWith("/feed/p", undefined, "DELETE");
});
