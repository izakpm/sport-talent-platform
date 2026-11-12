import { render, screen, fireEvent, within } from "@testing-library/react";
import TeamInvitations from "./TeamInvitations";
import { fetchWithAuth } from "../../lib/api";
jest.mock("../../lib/api", () => ({ fetchWithAuth: jest.fn() }));
const api = fetchWithAuth as jest.Mock;
const pending = {
  id: "invite",
  team_name: "U13",
  coach_name: "Leonard",
  parent_name: "Test Parent",
  child_name: "Junior Test",
  status: "pending",
  created_at: "2026-11-12",
  expires_at: "2026-11-19",
};
beforeEach(() => {
  api.mockReset();
  sessionStorage.clear();
});
it("keeps coach confirmation unavailable while parent approval is pending", async () => {
  api.mockResolvedValue({
    ok: true,
    json: async () => [
      {
        ...pending,
        status: "awaiting_parent",
        acceptance_mode: "athlete",
        parent_required: true,
      },
    ],
  });
  render(<TeamInvitations teamId="team" />);
  await screen.findByText(/Awaiting parent approval/);
  expect(
    screen.queryByRole("button", { name: "Review player" }),
  ).not.toBeInTheDocument();
});
it("lets a parent explicitly approve an athlete request for coach review", async () => {
  api.mockImplementation(async (_path: string, opts: any) => ({
    ok: true,
    json: async () =>
      opts?.method
        ? { status: "pending" }
        : [
            {
              ...pending,
              status: "awaiting_parent",
              acceptance_mode: "athlete",
              parent_required: true,
            },
          ],
  }));
  render(<TeamInvitations />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Review team invitation" }),
  );
  const modal = screen.getByRole("dialog");
  expect(within(modal).getByRole("checkbox")).toBeRequired();
  fireEvent.click(within(modal).getByRole("checkbox"));
  fireEvent.click(
    within(modal).getByRole("button", { name: "Approve for coach review" }),
  );
  await screen.findByText("Invitation updated.");
  expect(api).toHaveBeenCalledWith(
    "/guardian/team-invites/invite/parent-approval",
    expect.objectContaining({
      body: JSON.stringify({ status: "approved", guardian_confirmed: true }),
    }),
  );
});
it("gives athletes withdrawal rather than parent or coach approval controls", async () => {
  api.mockResolvedValue({
    ok: true,
    json: async () => [
      { ...pending, status: "awaiting_parent", acceptance_mode: "athlete" },
    ],
  });
  render(<TeamInvitations athlete />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Withdraw request" }),
  );
  await screen.findByText("Invitation updated.");
  expect(
    screen.queryByRole("button", { name: "Review team invitation" }),
  ).not.toBeInTheDocument();
  expect(api).toHaveBeenCalledWith(
    "/guardian/team-invites/athlete/invite/withdraw",
    expect.objectContaining({ method: "POST" }),
  );
});
it("filters parent invitations to the selected child", async () => {
  api.mockResolvedValue({
    ok: true,
    json: async () => [
      { ...pending, child_id: "one" },
      { ...pending, id: "other", child_id: "two", child_name: "Other Child" },
    ],
  });
  render(<TeamInvitations childId="one" />);
  await screen.findByText("Junior Test");
  expect(screen.queryByText("Other Child")).not.toBeInTheDocument();
});
it("creates a share link without automatically contacting WhatsApp", async () => {
  api.mockImplementation(async (_path: string, opts: any) => ({
    ok: true,
    json: async () =>
      opts?.method ? { token: "a".repeat(43), expires_at: "2026-11-19" } : [],
  }));
  render(<TeamInvitations teamId="team" teamName="U13" />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Invite player via WhatsApp" }),
  );
  const link = await screen.findByRole("link", { name: "Share via WhatsApp" });
  expect(link.getAttribute("href")).toContain("https://wa.me/?text=");
  expect(decodeURIComponent(link.getAttribute("href")!)).toContain(
    "/join-team#invite=" + "a".repeat(43),
  );
});
it("requires coach review before linking and supports an existing roster entry", async () => {
  api.mockImplementation(async (_path: string, opts: any) => ({
    ok: true,
    json: async () => (opts?.method ? { status: "confirmed" } : [pending]),
  }));
  const confirmed = jest.fn();
  render(
    <TeamInvitations
      teamId="team"
      onConfirmed={confirmed}
      players={[
        {
          id: "player",
          team_id: "team",
          first_name: "Junior",
          last_name: "Test",
          position: "Wing",
          shirt_number: null,
          is_captain: false,
          status: "active",
        },
      ]}
    />,
  );
  fireEvent.click(await screen.findByRole("button", { name: "Review player" }));
  const dialog = screen.getByRole("dialog");
  expect(api.mock.calls.some(([, opts]) => opts?.method === "POST")).toBe(
    false,
  );
  fireEvent.change(within(dialog).getByLabelText("Roster entry"), {
    target: { value: "player" },
  });
  fireEvent.click(within(dialog).getByRole("checkbox"));
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Confirm and link player" }),
  );
  await screen.findByText("Junior Test is now linked to U13.");
  expect(confirmed).toHaveBeenCalled();
  expect(api).toHaveBeenCalledWith(
    "/guardian/team-invites/teams/team/invite",
    expect.objectContaining({
      body: JSON.stringify({ status: "confirmed", player_id: "player" }),
    }),
  );
});
it("parents can withdraw but cannot confirm", async () => {
  api.mockResolvedValue({ ok: true, json: async () => [pending] });
  render(<TeamInvitations />);
  await screen.findByText("Junior Test");
  expect(
    screen.queryByRole("button", { name: "Review player" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Withdraw request" }));
  await screen.findByText("Invitation updated.");
  expect(api).toHaveBeenCalledWith(
    "/guardian/team-invites/invite/withdraw",
    expect.objectContaining({ method: "POST" }),
  );
});
