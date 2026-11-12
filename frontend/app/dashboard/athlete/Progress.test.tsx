import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Progress from "./Progress";
import { fetchWithAuth } from "../../lib/api";
jest.mock("../../lib/api", () => ({ fetchWithAuth: jest.fn() }));
const request = jest.mocked(fetchWithAuth);
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date("2026-11-12T12:00:00Z"));
  request.mockReset();
});
afterEach(() => jest.useRealTimers());
it("shows real summaries, day details and selectable metric history", async () => {
  request.mockImplementation(
    async (path) =>
      ({
        ok: true,
        json: async () =>
          path === "/activities"
            ? [
                {
                  id: "1",
                  date: "2026-11-09",
                  time: "16:00",
                  title: "Strength training",
                  training_kind: "Gym / strength",
                  duration_minutes: 90,
                  status: "verified",
                },
              ]
            : {
                entries: [
                  {
                    id: "m1",
                    kind: "metric",
                    title: "Bench press",
                    date: "2026-10-01",
                    value: 70,
                    unit: "kg",
                  },
                  {
                    id: "m2",
                    kind: "metric",
                    title: "Bench press",
                    date: "2026-11-01",
                    value: 80,
                    unit: "kg",
                  },
                ],
              },
      }) as Response,
  );
  render(<Progress />);
  await screen.findByRole("img", { name: /Bench press: 2 results/ });
  expect(
    screen.getByText(
      new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 1 }).format(1.5),
    ),
  ).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: /9 Nov: 1 sessions, 90 minutes/ }),
  );
  expect(screen.getByText("Strength training")).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Sessions", exact: true }),
  );
  expect(screen.getByText("Sessions completed · peak 1")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Previous week" }));
  expect(screen.getByText(/No completed training logged/)).toBeInTheDocument();
});
it("offers empty prompts without fake performance", async () => {
  request.mockImplementation(
    async (path) =>
      ({
        ok: true,
        json: async () => (path === "/activities" ? [] : { entries: [] }),
      }) as Response,
  );
  render(<Progress />);
  expect(
    await screen.findByText("Start with your first benchmark."),
  ).toBeInTheDocument();
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});
it("keeps training available if performance fails and supports retry", async () => {
  request.mockImplementation(
    async (path) =>
      ({ ok: path === "/activities", json: async () => [] }) as Response,
  );
  render(<Progress />);
  expect(await screen.findByRole("alert")).toHaveTextContent("performance");
  expect(screen.getByText(/No completed training logged/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry progress" }));
  await waitFor(() => expect(request).toHaveBeenCalledTimes(4));
});
