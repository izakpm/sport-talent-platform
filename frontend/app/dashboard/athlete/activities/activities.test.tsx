import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import Activities from "./page";
import TrainingRequests from "../../team-hub/TrainingRequests";
import { fetchWithAuth } from "../../../lib/api";
jest.mock("../../../lib/api", () => ({ fetchWithAuth: jest.fn() }));
const api = fetchWithAuth as jest.Mock;
const ok = (data: any) => ({ ok: true, json: async () => data });
const options = {
  kinds: ["Gym / strength", "Practice", "Recovery"],
  sports: [{ id: "rugby", name: "Rugby" }],
  coaches: [{ id: "coach", name: "Coach One", teams: "First XV" }],
};
const activity = {
  id: "one",
  title: "Gym session",
  sport: "Rugby",
  sport_id: "rugby",
  training_kind: "Gym / strength",
  date: "2025-06-01",
  time: "16:00",
  duration_minutes: 60,
  effort: 7,
  description: "Squats",
  location: "School gym",
  status: "self_reported",
};
it("opens compact rows without exposing notes or actions in the list", async () => {
  api.mockImplementation(async (path: string) =>
    ok(
      path.endsWith("/options")
        ? options
        : [
            {
              ...activity,
              description:
                "[WA-U15-2026] internal-reference\nSource: Training announcement",
            },
            {
              ...activity,
              id: "legacy",
              title: "Earlier confirmed session",
              status: "legacy_verified",
            },
          ],
    ),
  );
  render(<Activities />);
  const row = await screen.findByRole("button", {
    name: /Gym session.*Unverified/,
  });
  expect(
    screen.getByRole("button", { name: /Earlier confirmed session.*Verified/ }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText(/Source: Training announcement/),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Request verification" }),
  ).not.toBeInTheDocument();
  fireEvent.click(row);
  expect(
    within(screen.getByRole("dialog")).getByText(
      "Source: Training announcement",
    ),
  ).toBeInTheDocument();
  expect(screen.queryByText(/internal-reference/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
beforeEach(() => {
  api.mockReset();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  api.mockImplementation(async (path: string) =>
    ok(path === "/activities/options" ? options : [activity]),
  );
});
it("logs completed training with duration and no client-provided ownership", async () => {
  render(<Activities />);
  await screen.findByText("Gym session");
  fireEvent.click(
    screen.getByRole("button", { name: "Log training session +" }),
  );
  fireEvent.change(screen.getByLabelText("Session title"), {
    target: { value: "Practice" },
  });
  fireEvent.change(screen.getByLabelText("Date"), {
    target: { value: "2025-06-01" },
  });
  fireEvent.change(screen.getByLabelText("Start time (SAST)"), {
    target: { value: "16:00" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save session" }));
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith(
      "/activities",
      expect.objectContaining({ method: "POST" }),
    ),
  );
  const call = api.mock.calls.find(([, o]) => o?.method === "POST");
  expect(JSON.parse(call![1].body)).toMatchObject({
    title: "Practice",
    duration_minutes: 60,
    date: "2025-06-01",
    time: "16:00",
  });
  expect(JSON.parse(call![1].body)).not.toHaveProperty("athlete_id");
});
it("sends a request to a selected linked coach", async () => {
  render(<Activities />);
  fireEvent.click(await screen.findByRole("button", { name: /Gym session/ }));
  fireEvent.click(
    await screen.findByRole("button", { name: "Request verification" }),
  );
  fireEvent.change(screen.getByLabelText("Note to coach (optional)"), {
    target: { value: "You supervised this session." },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send request" }));
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith(
      "/activities/one/request",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          coach_id: "coach",
          note: "You supervised this session.",
        }),
      }),
    ),
  );
});
it("keeps a failed training draft", async () => {
  render(<Activities />);
  fireEvent.click(await screen.findByRole("button", { name: /Gym session/ }));
  fireEvent.click(screen.getByRole("button", { name: "Edit", exact: true }));
  fireEvent.change(screen.getByLabelText("Session title"), {
    target: { value: "Updated practice" },
  });
  api.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ message: "Try saving again" }),
  });
  fireEvent.click(screen.getByRole("button", { name: "Save session" }));
  expect(
    await within(screen.getByRole("dialog")).findByRole("alert"),
  ).toHaveTextContent("Try saving again");
  expect(screen.getByLabelText("Session title")).toHaveValue(
    "Updated practice",
  );
});
it("protects pending and verified logs from editing", async () => {
  api.mockImplementation(async (path: string) =>
    ok(
      path.endsWith("/options")
        ? options
        : [
            { ...activity, status: "pending" },
            {
              ...activity,
              id: "two",
              title: "Confirmed session",
              status: "verified",
            },
          ],
    ),
  );
  render(<Activities />);
  await screen.findByText("Confirmed session");
  fireEvent.click(screen.getByRole("button", { name: /Gym session/ }));
  expect(
    screen.queryByRole("button", { name: "Edit", exact: true }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Delete", exact: true }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Withdraw request" }),
  ).toBeInTheDocument();
});
it("explains missing coach links without preventing logging", async () => {
  api.mockImplementation(async (path: string) =>
    ok(path.endsWith("/options") ? { ...options, coaches: [] } : [activity]),
  );
  render(<Activities />);
  fireEvent.click(await screen.findByRole("button", { name: /Gym session/ }));
  fireEvent.click(
    await screen.findByRole("button", { name: "Request verification" }),
  );
  expect(screen.getByText(/No linked coach yet/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Send request" })).toBeDisabled();
});
it("lets coaches review the full session and return feedback", async () => {
  api.mockResolvedValue(
    ok([
      {
        ...activity,
        athlete_name: "Izak Meyer",
        request_note: "Please confirm",
      },
    ]),
  );
  render(<TrainingRequests />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Review session" }),
  );
  expect(screen.getByText("Squats")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Decision"), {
    target: { value: "declined" },
  });
  expect(screen.getByLabelText("Feedback (required)")).toBeRequired();
  fireEvent.change(screen.getByLabelText("Feedback (required)"), {
    target: { value: "Please add sets and reps." },
  });
  api.mockResolvedValueOnce(ok([]));
  fireEvent.click(screen.getByRole("button", { name: "Send feedback" }));
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith(
      "/activities/one/review",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          status: "declined",
          note: "Please add sets and reps.",
        }),
      }),
    ),
  );
  await screen.findByText("No training logs are waiting for your review.");
});

it("uses the same combined filters for the summary and activity list", async () => {
  api.mockImplementation(async (path: string) =>
    ok(
      path.endsWith("/options")
        ? options
        : [
            activity,
            {
              ...activity,
              id: "two",
              title: "Field practice",
              training_kind: "Practice",
              date: "2025-06-02",
              duration_minutes: 90,
              status: "verified",
            },
            {
              ...activity,
              id: "three",
              title: "Old practice",
              training_kind: "Practice",
              date: "2024-06-02",
              duration_minutes: 120,
              status: "legacy_verified",
            },
            {
              ...activity,
              id: "four",
              title: "Pending gym",
              duration_minutes: null,
              status: "pending",
            },
          ],
    ),
  );
  render(<Activities />);
  await screen.findByText("Field practice");
  const summary = screen.getByRole("region", {
    name: "Filtered training summary",
  });
  expect(within(summary).getByText("4h 30m")).toBeInTheDocument();
  expect(
    within(summary).getByText("50% of selected sessions"),
  ).toBeInTheDocument();
  expect(within(summary).getByText(/Missing duration: 1/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("From"), {
    target: { value: "2025-01-01" },
  });
  fireEvent.change(screen.getByLabelText("Session type"), {
    target: { value: "Practice" },
  });
  expect(within(summary).getByText("1h 30m")).toBeInTheDocument();
  expect(
    within(summary).getByText("100% of selected sessions"),
  ).toBeInTheDocument();
  expect(screen.queryByText("Old practice")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Search"), {
    target: { value: "No matching title" },
  });
  expect(within(summary).getByText("0h 0m")).toBeInTheDocument();
  expect(within(summary).queryByRole("progressbar")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  expect(within(summary).getByText("4h 30m")).toBeInTheDocument();
});

it("recalculates verification statistics when status changes", async () => {
  api.mockImplementation(async (path: string) =>
    ok(
      path.endsWith("/options")
        ? options
        : [
            activity,
            {
              ...activity,
              id: "pending",
              title: "Pending session",
              status: "pending",
            },
          ],
    ),
  );
  render(<Activities />);
  await screen.findByText("Pending session");
  fireEvent.change(screen.getByLabelText("Status"), {
    target: { value: "pending" },
  });
  const summary = screen.getByRole("region", {
    name: "Filtered training summary",
  });
  expect(within(summary).getByText("1h 0m")).toBeInTheDocument();
  expect(
    within(summary).getByText(
      "0 self-reported · 1 awaiting coach · 0 changes requested",
    ),
  ).toBeInTheDocument();
  expect(within(summary).getByRole("progressbar")).toHaveAttribute("max", "1");
});
