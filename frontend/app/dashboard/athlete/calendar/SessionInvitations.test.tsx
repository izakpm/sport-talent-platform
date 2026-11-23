import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PersonalEditor } from "./PersonalEditor";
import SessionInvitations from "./SessionInvitations";
import { hub } from "../../team-hub/api";
jest.mock("../../team-hub/api", () => ({ hub: jest.fn() }));
const guest = "22222222-2222-2222-2222-222222222222";
beforeEach(() => {
  jest.resetAllMocks();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
it("offers only returned connections and sends the selected guest", async () => {
  (hub as jest.Mock).mockImplementation(async (path) =>
    path.endsWith("connections")
      ? { people: [{ id: guest, name: "Leonard", role: "coach" }] }
      : { id: "new" },
  );
  const saved = jest.fn();
  render(
    <PersonalEditor
      event={null}
      date="2077-03-14"
      events={[]}
      saved={saved}
      close={() => {}}
    />,
  );
  await screen.findByRole("option", { name: "Leonard · Coach" });
  fireEvent.change(screen.getByLabelText("Session title"), {
    target: { value: "Kicking practice" },
  });
  fireEvent.change(screen.getByLabelText("Start time (SAST)"), {
    target: { value: "16:00" },
  });
  fireEvent.change(screen.getByLabelText("End time (SAST)"), {
    target: { value: "17:00" },
  });
  fireEvent.change(screen.getByLabelText("Invite a connection (optional)"), {
    target: { value: guest },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Save personal session" }),
  );
  await waitFor(() =>
    expect(hub).toHaveBeenCalledWith(
      "/personal-sessions",
      expect.objectContaining({ invitee_id: guest }),
      "POST",
    ),
  );
});
it("requires an explicit invitation response and includes the version reviewed", async () => {
  const event = {
    id: "session",
    title: "Kicking practice",
    team_name: "Izak Meyer",
    date: "2077-03-14",
    starts_at: "2077-03-14T14:00:00Z",
    start_time: "16:00",
    end_time: "17:00",
    invitation_status: "pending",
    invited_at: "2026-11-23T00:00:00Z",
  };
  (hub as jest.Mock).mockImplementation(async (path) =>
    path.endsWith("invitations") ? [event] : {},
  );
  const changed = jest.fn();
  render(<SessionInvitations onChanged={changed} />);
  await screen.findByText("Invited by Izak Meyer");
  expect(
    (hub as jest.Mock).mock.calls.every(([path]) => !path.endsWith("/respond")),
  ).toBe(true);
  fireEvent.click(screen.getByRole("button", { name: "Accept invitation" }));
  await waitFor(() => expect(changed).toHaveBeenCalled());
  expect(hub).toHaveBeenCalledWith("/personal-sessions/session/respond", {
    status: "accepted",
    invited_at: event.invited_at,
  });
});
it("does not allow a cancelled invitation to be accepted", async () => {
  (hub as jest.Mock).mockResolvedValue([
    {
      id: "session",
      title: "Cancelled practice",
      team_name: "Izak",
      date: "2077-03-14",
      starts_at: "2077-03-14T14:00:00Z",
      cancelled: true,
      invitation_status: "pending",
    },
  ]);
  render(<SessionInvitations />);
  await screen.findByText("Cancelled");
  expect(
    screen.queryByRole("button", { name: "Accept invitation" }),
  ).not.toBeInTheDocument();
});
