import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import JoinTeam from "./JoinTeam";
import { fetchWithAuth } from "../lib/api";
import { pendingTeamInvite } from "../lib/team-invite-return";
jest.mock("../lib/api", () => ({ fetchWithAuth: jest.fn() }));
const api = fetchWithAuth as jest.Mock;
const token = "a".repeat(43);
beforeEach(() => {
  api.mockReset();
  localStorage.clear();
  sessionStorage.clear();
  window.history.replaceState({}, "", "/join-team#invite=" + token);
});
it("preserves an invite across parent registration and login without exposing it in the URL", async () => {
  render(<JoinTeam />);
  expect(
    await screen.findByRole("link", { name: "Log in as a parent" }),
  ).toHaveAttribute("href", "/login");
  expect(pendingTeamInvite()).toBe(token);
  expect(window.location.hash).toBe("");
  expect(api).not.toHaveBeenCalled();
});
it("requires selection and explicit acceptance; older view links are excluded", async () => {
  localStorage.setItem("token", "test");
  localStorage.setItem("user", JSON.stringify({ role: "GUARDIAN" }));
  api.mockImplementation(async (path: string) => ({
    ok: true,
    json: async () =>
      path.endsWith("/children")
        ? [
            {
              id: "child",
              first_name: "Junior",
              last_name: "Test",
              mode: "managed",
              status: "accepted",
            },
            {
              id: "older",
              first_name: "Senior",
              mode: "view",
              status: "accepted",
            },
          ]
        : {
            team_name: "U13 Rugby",
            coach_name: "Leonard",
            age_group: "U13",
            expires_at: "2026-12-01",
          },
  }));
  render(<JoinTeam />);
  await screen.findByRole("heading", { name: "U13 Rugby" });
  expect(
    screen.queryByRole("option", { name: /Senior/ }),
  ).not.toBeInTheDocument();
  expect(api.mock.calls.some(([path]) => path.endsWith("/accept"))).toBe(false);
  fireEvent.change(screen.getByLabelText("Choose your child"), {
    target: { value: "child" },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(
    screen.getByRole("button", { name: "Accept and request to join" }),
  );
  await screen.findByText("Request sent. Waiting for the coach to confirm.");
  expect(api).toHaveBeenCalledWith(
    "/guardian/team-invites/accept",
    expect.objectContaining({
      body: JSON.stringify({ token, child_id: "child", consent: true }),
    }),
  );
  expect(pendingTeamInvite()).toBe("");
});
