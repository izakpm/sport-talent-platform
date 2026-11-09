import { fireEvent, render, screen, within } from "@testing-library/react";
import TeamRoster from "./TeamRoster";
import { fetchWithAuth } from "../../lib/api";
jest.mock("../../lib/api", () => ({ fetchWithAuth: jest.fn() }));
const request = jest.mocked(fetchWithAuth);
const team = { id: "team", name: "First XV", age_group: "U18" };
const player = {
  id: "p1",
  team_id: "team",
  first_name: "Siya",
  last_name: "Kolisi",
  position: "Flanker",
  shirt_number: 6,
  is_captain: true,
  status: "active",
};
beforeEach(() => {
  request.mockReset();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
it("adds players without accounts and supports entering the next player", async () => {
  request.mockImplementation(
    async (_path, options) =>
      ({
        ok: true,
        json: async () => (options?.method ? player : { team, players: [] }),
      }) as Response,
  );
  render(<TeamRoster teamId="team" />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Add your first player" }),
  );
  const dialog = screen.getByRole("dialog");
  fireEvent.change(within(dialog).getByLabelText("First name"), {
    target: { value: "Siya" },
  });
  fireEvent.change(within(dialog).getByLabelText("Last name"), {
    target: { value: "Kolisi" },
  });
  fireEvent.click(
    within(dialog).getByLabelText("Keep adding players after saving"),
  );
  fireEvent.click(within(dialog).getByRole("button", { name: "Add player" }));
  expect(
    await within(dialog).findByText(/Ready for the next player/),
  ).toBeInTheDocument();
  expect(within(dialog).getByLabelText("First name")).toHaveValue("");
  const call = request.mock.calls.find(
    ([, options]) => options?.method === "POST",
  );
  expect(call![0]).toBe("/coach-planning/teams/team/players");
  expect(JSON.parse(call![1].body)).toMatchObject({
    first_name: "Siya",
    last_name: "Kolisi",
    shirt_number: null,
  });
});
it("filters inactive players and saves player edits", async () => {
  request.mockImplementation(
    async (_path, options) =>
      ({
        ok: true,
        json: async () =>
          options?.method
            ? { ...player, status: "inactive" }
            : { team, players: [player] },
      }) as Response,
  );
  render(<TeamRoster teamId="team" />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Edit Siya Kolisi" }),
  );
  fireEvent.change(screen.getByLabelText("Squad status"), {
    target: { value: "inactive" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(
    await screen.findByText("No players match this view."),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Show players"), {
    target: { value: "inactive" },
  });
  expect(screen.getByText("Siya Kolisi")).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Search players"), {
    target: { value: "scrum-half" },
  });
  expect(screen.queryByText("Siya Kolisi")).not.toBeInTheDocument();
});
it("requires confirmation to remove and keeps the player on API failure", async () => {
  request.mockImplementation(
    async (_path, options) =>
      ({
        ok: !options?.method,
        json: async () =>
          options?.method
            ? { message: "Unable to remove player." }
            : { team, players: [player] },
      }) as Response,
  );
  render(<TeamRoster teamId="team" />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Remove Siya Kolisi" }),
  );
  expect(
    request.mock.calls.some(([, options]) => options?.method === "DELETE"),
  ).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Remove player" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Unable to remove",
  );
  expect(screen.getByText("Siya Kolisi")).toBeInTheDocument();
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});
