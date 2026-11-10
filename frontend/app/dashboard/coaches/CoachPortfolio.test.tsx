import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CoachPortfolio from "./CoachPortfolio";
import { fetchWithAuth } from "../../lib/api";
jest.mock("../../lib/api", () => ({ fetchWithAuth: jest.fn() }));
const api = fetchWithAuth as jest.Mock;
beforeEach(() => {
  api.mockReset();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
it("saves a coaching role and displays it", async () => {
  api.mockResolvedValueOnce({ ok: true, json: async () => [] });
  render(<CoachPortfolio kind="history" />);
  await screen.findByText("Where has your coaching taken you?");
  fireEvent.click(
    screen.getByRole("button", { name: "Add coaching role", exact: true }),
  );
  fireEvent.change(screen.getByLabelText("Team"), {
    target: { value: "First XV" },
  });
  fireEvent.change(screen.getByLabelText("Coaching role"), {
    target: { value: "Head coach" },
  });
  fireEvent.change(screen.getByLabelText("Start date"), {
    target: { value: "2018-01-01" },
  });
  api.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      id: "1",
      title: "First XV",
      role: "Head coach",
      start_date: "2018-01-01",
    }),
  });
  fireEvent.click(screen.getByRole("button", { name: "Save coaching role" }));
  await screen.findByRole("heading", { name: "First XV" });
  expect(JSON.parse(api.mock.calls[1][1].body)).toMatchObject({
    title: "First XV",
    role: "Head coach",
    end_date: null,
  });
});
it("keeps failed qualification edits open with the entered values", async () => {
  api.mockResolvedValueOnce({
    ok: true,
    json: async () => [
      {
        id: "1",
        title: "BokSmart",
        start_date: "2024-01-01",
        end_date: "2025-01-01",
      },
    ],
  });
  render(<CoachPortfolio kind="qualifications" />);
  await screen.findByText(/Expired/);
  fireEvent.click(screen.getByRole("button", { name: "Edit" }));
  api.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ message: "Unable to save certificate" }),
  });
  fireEvent.click(screen.getByRole("button", { name: "Save qualification" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Unable to save certificate",
  );
  expect(screen.getByLabelText("Qualification")).toHaveValue("BokSmart");
});
it("removes a record only after confirmation", async () => {
  api.mockResolvedValueOnce({
    ok: true,
    json: async () => [
      { id: "1", title: "League winners", start_date: "2024-01-01" },
    ],
  });
  render(<CoachPortfolio kind="achievements" />);
  await screen.findByText("League winners");
  fireEvent.click(screen.getByRole("button", { name: "Remove", exact: true }));
  expect(api).toHaveBeenCalledTimes(1);
  api.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ deleted: true }),
  });
  fireEvent.click(screen.getByRole("button", { name: "Remove record" }));
  await waitFor(() =>
    expect(screen.queryByText("League winners")).not.toBeInTheDocument(),
  );
});
