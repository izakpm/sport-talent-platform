import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AchievementVerification from "./AchievementVerification";
import AchievementRequests from "./AchievementRequests";
import { fetchWithAuth } from "../../lib/api";
jest.mock("../../lib/api", () => ({ fetchWithAuth: jest.fn() }));
jest.mock("../coaches/CoachWorkspace", () => ({
  Modal: ({ title, children }: any) => (
    <div role="dialog" aria-label={title}>
      {children}
    </div>
  ),
}));
const api = fetchWithAuth as jest.Mock;
const entry = {
  id: "entry",
  title: "U15 selection",
  verification_status: "self_reported",
};
beforeEach(() => jest.clearAllMocks());
it("sends the selected coach and note, then refreshes the profile", async () => {
  api.mockImplementation(async (path: string) => ({
    ok: true,
    json: async () =>
      path.endsWith("verification-coaches")
        ? [{ id: "coach", name: "Leonard", teams: "Rugby" }]
        : { status: "pending" },
  }));
  const changed = jest.fn();
  render(<AchievementVerification entry={entry} onChanged={changed} />);
  fireEvent.click(screen.getByRole("button", { name: "Request verification" }));
  fireEvent.change(await screen.findByLabelText("Coach"), {
    target: { value: "coach" },
  });
  fireEvent.change(screen.getByLabelText("Message to your coach (optional)"), {
    target: { value: "Please confirm" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send request" }));
  await waitFor(() => expect(changed).toHaveBeenCalled());
  expect(api).toHaveBeenCalledWith(
    "/athlete-profile/entries/entry/request",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ coach_id: "coach", note: "Please confirm" }),
    }),
  );
});
it("withdraws pending requests using the selected child context", async () => {
  api.mockResolvedValue({ ok: true, json: async () => ({}) });
  const changed = jest.fn();
  render(
    <AchievementVerification
      entry={{ ...entry, verification_status: "pending" }}
      childId="child"
      onChanged={changed}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "Withdraw request" }));
  await waitFor(() => expect(changed).toHaveBeenCalled());
  expect(api).toHaveBeenCalledWith(
    "/athlete-profile/entries/entry/request",
    expect.objectContaining({
      method: "DELETE",
      headers: { "X-Athlete-Id": "child" },
    }),
  );
});
it("shows verification without offering another request", () => {
  render(
    <AchievementVerification
      entry={{ ...entry, verification_status: "verified" }}
      onChanged={() => {}}
    />,
  );
  expect(screen.getByText("Coach verified")).toBeInTheDocument();
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
it("lets the coach review selection and captaincy together and save feedback", async () => {
  api.mockImplementation(async (_path: string, opts?: RequestInit) => ({
    ok: true,
    json: async () =>
      opts?.method === "POST"
        ? []
        : [
            {
              ...entry,
              date: "2026-06-01",
              athlete_name: "Izak Meyer",
              organization: "Blue Bulls",
              achievement_type: "team_selection",
              leadership_role: "Captain",
              leadership_date: "2026-06-02",
              notes: "Played lock",
              request_note: "Please confirm",
            },
          ],
  }));
  const count = jest.fn();
  render(<AchievementRequests onCount={count} />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Review achievement" }),
  );
  expect(screen.getByText("Captain: 02 Jun 2026")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Decision"), {
    target: { value: "declined" },
  });
  fireEvent.change(screen.getByLabelText("Feedback (required)"), {
    target: { value: "Check the date" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
  await screen.findByText(
    "Review saved. The athlete can see your decision and feedback.",
  );
  expect(api).toHaveBeenCalledWith(
    "/athlete-profile/entries/entry/review",
    expect.objectContaining({
      body: JSON.stringify({ status: "declined", note: "Check the date" }),
    }),
  );
  expect(count).toHaveBeenLastCalledWith(0);
});
