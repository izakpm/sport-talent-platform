import { fireEvent, render, screen, within } from "@testing-library/react";
import { ParentTraining } from "./ParentTraining";
import { fetchWithAuth } from "../../lib/api";
import type { GuardianChild } from "../../lib/guardian-context";
import type { TrainingActivity } from "../team-hub/training-api";
jest.mock("../../lib/api", () => ({ fetchWithAuth: jest.fn() }));
const api = fetchWithAuth as jest.Mock;
const child: GuardianChild = {
  id: "junior",
  link_id: "link",
  first_name: "Junior",
  last_name: "Test",
  mode: "managed",
  status: "accepted",
};
const activity = {
  id: "session",
  title: "Rugby practice",
  date: "2026-11-10",
  time: "16:00",
  training_kind: "Practice",
  status: "self_reported",
  sport: "Rugby",
  sport_id: "rugby",
  duration_minutes: 60,
  effort: null,
  description: "",
  location: "",
} as TrainingActivity;
const options = {
  sports: [{ id: "rugby", name: "Rugby" }],
  kinds: ["Practice"],
  coaches: [{ id: "coach", name: "Leonard", teams: "U18" }],
};
const ok = (value: unknown) => ({ ok: true, json: async () => value });
beforeEach(() => {
  api.mockReset();
  sessionStorage.clear();
});
it("logs training for the specified child without switching workspace context", async () => {
  api.mockImplementation(async (path: string) =>
    ok(path.endsWith("/options") ? options : [activity]),
  );
  render(<ParentTraining child={child} activities={[]} />);
  fireEvent.click(screen.getByRole("button", { name: "Log training +" }));
  await screen.findByRole("dialog");
  fireEvent.change(screen.getByLabelText("Session title"), {
    target: { value: "Rugby practice" },
  });
  fireEvent.change(screen.getByLabelText("Start time (SAST)"), {
    target: { value: "16:00" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save session" }));
  await screen.findByText(/Session saved for Junior Test/);
  const call = api.mock.calls.find(
    ([path, init]) => path === "/activities" && init.method === "POST",
  );
  expect(call![1].headers["X-Athlete-Id"]).toBe("junior");
  expect(JSON.parse(call![1].body).title).toBe("Rugby practice");
  expect(sessionStorage.getItem("guardian-child")).toBeNull();
});
it("requests verification and withdraws it using the child's identity", async () => {
  api.mockImplementation(async (path: string, init: any) =>
    ok(
      path.endsWith("/options")
        ? options
        : [
            {
              ...activity,
              status: init.method === "POST" ? "pending" : "self_reported",
            },
          ],
    ),
  );
  render(<ParentTraining child={child} activities={[activity]} />);
  fireEvent.click(screen.getByRole("button", { name: "Request verification" }));
  const dialog = await screen.findByRole("dialog");
  expect(
    within(dialog).getByText("Junior Test · Rugby practice"),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Send request" }));
  await screen.findByText("Verification request sent for Junior Test.");
  expect(api).toHaveBeenCalledWith(
    "/activities/session/request",
    expect.objectContaining({
      method: "POST",
      headers: { "X-Athlete-Id": "junior" },
      body: JSON.stringify({ coach_id: "coach", note: "" }),
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Withdraw request" }));
  await screen.findByRole("dialog");
  fireEvent.click(
    within(screen.getByRole("dialog")).getByRole("button", {
      name: "Withdraw request",
    }),
  );
  await screen.findByText("Request withdrawn for Junior Test.");
  expect(api).toHaveBeenCalledWith(
    "/activities/session/request",
    expect.objectContaining({
      method: "DELETE",
      headers: { "X-Athlete-Id": "junior" },
    }),
  );
});
it("keeps errors in the form and hides controls for older linked athletes", async () => {
  api
    .mockResolvedValueOnce(ok(options))
    .mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Coach link no longer active." }),
    });
  const view = render(<ParentTraining child={child} activities={[activity]} />);
  fireEvent.click(screen.getByRole("button", { name: "Request verification" }));
  await screen.findByRole("dialog");
  fireEvent.click(screen.getByRole("button", { name: "Send request" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Coach link no longer active.",
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  view.unmount();
  render(
    <ParentTraining
      child={{ ...child, mode: "view" }}
      activities={[activity]}
    />,
  );
  expect(screen.queryByRole("button")).not.toBeInTheDocument();
});
