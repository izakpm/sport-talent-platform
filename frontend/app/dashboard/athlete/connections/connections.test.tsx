import { render, screen, fireEvent } from "@testing-library/react";
import Connections from "./page";
import { hub } from "../../team-hub/api";
jest.mock("../../team-hub/api", () => ({ hub: jest.fn() }));
const data = {
  teams: [
    { id: "a", name: "First XV", age_group: "U18", sport: "Rugby" },
    { id: "b", name: "Club XV", age_group: "Senior", sport: "Rugby" },
  ],
  people: [
    {
      id: "c",
      name: "Real Coach",
      role: "coach",
      profile_image: null,
      team_ids: ["a", "b"],
    },
    {
      id: "p",
      name: "Real Player",
      role: "teammate",
      profile_image: null,
      team_ids: ["a"],
    },
  ],
};
beforeEach(() => {
  jest.clearAllMocks();
  (hub as jest.Mock).mockResolvedValue(data);
});
it("shows real unique connections and all shared teams", async () => {
  render(<Connections />);
  expect(
    await screen.findByRole("heading", { name: "Real Coach" }),
  ).toBeInTheDocument();
  expect(screen.getAllByRole("heading", { name: "Real Coach" })).toHaveLength(
    1,
  );
  expect(
    screen.getByRole("heading", { name: "Real Player" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Coach Taylor")).not.toBeInTheDocument();
  expect(hub).toHaveBeenCalledWith("/connections");
});
it("combines search, team and role filters and can clear them", async () => {
  render(<Connections />);
  await screen.findByText("Real Coach");
  fireEvent.change(screen.getByLabelText("Team"), { target: { value: "b" } });
  expect(screen.queryByText("Real Player")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Connection"), {
    target: { value: "teammate" },
  });
  expect(
    screen.getByText("No connections match these filters."),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  fireEvent.change(screen.getByLabelText("Search people"), {
    target: { value: "  player  " },
  });
  expect(screen.getByText("Real Player")).toBeInTheDocument();
  expect(screen.queryByText("Real Coach")).not.toBeInTheDocument();
});
it("explains how to connect when there is no linked team", async () => {
  (hub as jest.Mock).mockResolvedValue({ teams: [], people: [] });
  render(<Connections />);
  expect(
    await screen.findByText("Your team network starts here."),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText("Search people")).not.toBeInTheDocument();
});
it("recovers from an API failure", async () => {
  (hub as jest.Mock).mockRejectedValue(new Error("Unable to load"));
  render(<Connections />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Unable to load");
  (hub as jest.Mock).mockResolvedValue(data);
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  expect(await screen.findByText("Real Coach")).toBeInTheDocument();
});
it("falls back to initials when a photo fails", async () => {
  (hub as jest.Mock).mockResolvedValue({
    ...data,
    people: [{ ...data.people[0], profile_image: "/missing.png" }],
  });
  const { container } = render(<Connections />);
  await screen.findByText("Real Coach");
  fireEvent.error(container.querySelector("img")!);
  expect(screen.getByText("RC")).toBeInTheDocument();
});
