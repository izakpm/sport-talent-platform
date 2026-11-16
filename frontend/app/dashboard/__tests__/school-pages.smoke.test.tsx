import { fireEvent, render, screen } from "@testing-library/react";
import SchoolWorkspace from "../schools/SchoolWorkspace";
import { fetchWithAuth } from "../../lib/api";
jest.mock("../../lib/api", () => ({ fetchWithAuth: jest.fn() }));
const school = {
  id: "montana",
  name: "Montana",
  location: "Pretoria",
  province: "Gauteng",
  division: "plaat",
  is_demo: true,
  logo_url: null,
  source_url: "https://www.virsekernoordvaalcup.co.za/skole",
};
const base = {
  home_school_id: "montana",
  home_school: "Montana",
  away_school_id: "nelspruit",
  away_school: "Nelspruit",
  home_team_id: "u15",
  away_team_id: "opponent",
  home_team: "U15A",
  away_team: "U15A",
  division: "plaat",
  source_label: "Check-e-Log",
  source_url: "https://www.checkelog.co.za/",
  additional_sources: [],
  decision_note: null,
};
const fixtures = [
  {
    ...base,
    id: "one",
    match_date: "2026-08-22",
    home_score: 12,
    away_score: 8,
  },
  {
    ...base,
    id: "two",
    match_date: "2025-08-22",
    home_score: 0,
    away_score: 0,
  },
  {
    ...base,
    id: "three",
    match_date: "2026-08-01",
    home_score: null,
    away_score: null,
    decision_note: "Conflicting sources",
  },
];
beforeEach(() => {
  jest.mocked(fetchWithAuth).mockResolvedValue({
    ok: true,
    json: async () => ({
      school,
      teams: [
        { id: "u15", name: "U15A", season: 2026 },
        { id: "old", name: "U15A", season: 2025 },
      ],
      fixtures,
    }),
  } as any);
});
it("filters year without counting unknown scores", async () => {
  render(<SchoolWorkspace view="fixtures" />);
  expect(
    await screen.findByRole("heading", { name: "Montana" }),
  ).toBeInTheDocument();
  expect(screen.getByText("1 / 0 / 0")).toBeInTheDocument();
  expect(screen.getAllByText("U15A vs Nelspruit")).toHaveLength(2);
  fireEvent.change(screen.getByLabelText("Year"), {
    target: { value: "2025" },
  });
  expect(screen.getAllByText("U15A vs Nelspruit")).toHaveLength(1);
  expect(screen.getByText("0 / 1 / 0")).toBeInTheDocument();
});
it("filters opponents and preserves source details", async () => {
  render(<SchoolWorkspace view="fixtures" />);
  await screen.findByRole("heading", { name: "Montana" });
  expect(screen.getByText("Conflicting sources")).toBeInTheDocument();
  expect(
    screen.getAllByRole("link", {
      name: "Source: Check-e-Log ↗",
      hidden: true,
    })[0],
  ).toHaveAttribute("href", "https://www.checkelog.co.za/");
  fireEvent.change(screen.getByPlaceholderText("Search opponent or team"), {
    target: { value: "unknown school" },
  });
  expect(
    screen.getByText("No published fixtures match these filters."),
  ).toBeInTheDocument();
});
it.each([
  ["coaches", "No coaches linked yet"],
  ["achievements", "No school-confirmed achievements yet"],
] as const)("does not invent %s", async (view, title) => {
  render(<SchoolWorkspace view={view} />);
  expect(
    await screen.findByRole("heading", { name: title }),
  ).toBeInTheDocument();
  expect(screen.queryByText("John Smith")).not.toBeInTheDocument();
});
it("renders failure without sample records", async () => {
  jest.mocked(fetchWithAuth).mockRejectedValueOnce(Error("Unavailable"));
  render(<SchoolWorkspace />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Unavailable");
  expect(screen.queryByText("Montana")).not.toBeInTheDocument();
});
it("handles no school membership", async () => {
  jest
    .mocked(fetchWithAuth)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ school: null, teams: [], fixtures: [] }),
    } as any);
  render(<SchoolWorkspace />);
  expect(
    await screen.findByText(
      "Your school has not been connected to this account yet.",
    ),
  ).toBeInTheDocument();
});
