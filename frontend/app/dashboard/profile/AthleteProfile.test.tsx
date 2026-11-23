jest.mock("../OrganisationAffiliations", () => ({
  __esModule: true,
  default: () => <section aria-label="Schools and clubs" />,
}));
// Account security has its own API and interaction tests.
jest.mock("../AccountSecurity", () => ({
  __esModule: true,
  default: () => <section aria-label="Account security" />,
}));
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AthleteProfile from "./AthleteProfile";
import { fetchWithAuth } from "../../lib/api";
jest.mock("../../lib/api", () => ({ fetchWithAuth: jest.fn() }));
jest.mock("../coaches/CoachWorkspace", () => ({
  Modal: ({ title, children }: any) => (
    <div role="dialog" aria-label={title}>
      {children}
    </div>
  ),
}));
const profile = {
  user: {
    id: "u",
    first_name: "Izak",
    last_name: "Meyer",
    email: "izak@example.com",
    role: "ATHLETE",
    phone: "",
  },
  details: { province: "Gauteng" },
  sports: [],
  entries: [],
  catalog: {
    sports: [{ id: "rugby", name: "Rugby" }],
    positions: [
      { id: "8", name: "Eighth man", sport_id: "rugby" },
      { id: "6", name: "Flanker", sport_id: "rugby" },
    ],
    metrics: { "Bench press": "kg", "40 m sprint": "s" },
  },
};
beforeEach(() => {
  window.history.replaceState(null, "", "/");
  jest.clearAllMocks();
  (fetchWithAuth as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => profile,
  });
});
afterEach(() => localStorage.clear());
it("keeps affiliations and security only in My details", async () => {
  render(<AthleteProfile />);
  expect(
    await screen.findByRole("region", { name: "Schools and clubs" }),
  ).toBeInTheDocument();
  for (const name of [
    "Sports & positions",
    "Achievements",
    "Performance metrics",
  ]) {
    fireEvent.click(screen.getByRole("button", { name }));
    expect(
      screen.queryByRole("region", { name: "Schools and clubs" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Account security" }),
    ).not.toBeInTheDocument();
  }
  fireEvent.click(screen.getByRole("button", { name: "My details" }));
  expect(
    screen.getByRole("region", { name: "Schools and clubs" }),
  ).toBeInTheDocument();
});
it("groups metric history by test and keeps older records editable", async () => {
  (fetchWithAuth as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({
      ...profile,
      entries: [
        {
          id: "old",
          kind: "metric",
          title: "Bench press",
          date: "2026-01-01",
          value: 60,
          unit: "kg",
          notes: "Earlier test",
          organization: "",
        },
        {
          id: "new",
          kind: "metric",
          title: "Bench press",
          date: "2026-02-01",
          value: 70,
          unit: "kg",
          notes: "Latest test",
          organization: "",
        },
      ],
    }),
  });
  render(<AthleteProfile initialTab="metric" />);
  expect(
    await screen.findAllByRole("heading", { name: "Bench press" }),
  ).toHaveLength(1);
  expect(screen.getByText("Latest test")).toBeVisible();
  expect(screen.getByText("Earlier test")).not.toBeVisible();
  screen.getByText("Previous results (1)").closest("details")!.open = true;
  expect(screen.getByText("Earlier test")).toBeVisible();
  fireEvent.click(
    screen.getAllByRole("button", { name: "Edit Bench press" })[1],
  );
  expect(screen.getByLabelText("Result (kg)")).toHaveValue(60);
});
it("saves personal details and updates the sidebar event", async () => {
  const listener = jest.fn();
  window.addEventListener("profile-updated", listener);
  render(<AthleteProfile />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Edit my details ↗" }),
  );
  fireEvent.change(screen.getByLabelText("First name"), {
    target: { value: "New name" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() =>
    expect(fetchWithAuth).toHaveBeenCalledWith(
      "/athlete-profile",
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining("New name"),
      }),
    ),
  );
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(listener).toHaveBeenCalled();
  window.removeEventListener("profile-updated", listener);
});
it("saves primary and secondary positions together", async () => {
  render(<AthleteProfile initialTab="sports" />);
  fireEvent.click(await screen.findByRole("button", { name: "Add sport +" }));
  fireEvent.change(screen.getByLabelText("Sport"), {
    target: { value: "rugby" },
  });
  fireEvent.click(screen.getByLabelText("Eighth man"));
  fireEvent.click(screen.getByLabelText("Flanker"));
  fireEvent.change(screen.getByLabelText("Primary position"), {
    target: { value: "8" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() =>
    expect(fetchWithAuth).toHaveBeenCalledWith(
      "/athlete-profile/sport",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          sport_id: "rugby",
          position_ids: ["8", "6"],
          primary_position_id: "8",
          is_primary: true,
        }),
      }),
    ),
  );
});
it("keeps failed edits open with entered values", async () => {
  render(<AthleteProfile initialTab="metric" />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Record result +" }),
  );
  fireEvent.change(screen.getByLabelText("Result (kg)"), {
    target: { value: "80" },
  });
  fireEvent.change(screen.getByLabelText("Test date"), {
    target: { value: "2025-06-01" },
  });
  (fetchWithAuth as jest.Mock).mockResolvedValueOnce({
    ok: false,
    json: async () => ({ message: "Please retry" }),
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Please retry");
  expect(screen.getByLabelText("Result (kg)")).toHaveValue(80);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});

it("opens the profile section from legacy deep links", async () => {
  window.history.replaceState(null, "", "/#achievement");
  render(<AthleteProfile />);
  expect(
    await screen.findByRole("button", { name: "Achievements" }),
  ).toHaveAttribute("aria-pressed", "true");
});

it("saves selection and captaincy independently from one editor", async () => {
  render(<AthleteProfile initialTab="achievement" />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Add achievement +" }),
  );
  fireEvent.change(screen.getByLabelText("Achievement type"), {
    target: { value: "team_selection" },
  });
  fireEvent.change(screen.getByLabelText("Team / selection"), {
    target: { value: "Blue Bulls U15 Invitational" },
  });
  fireEvent.change(screen.getByLabelText("Selection date"), {
    target: { value: "2025-06-01" },
  });
  fireEvent.change(screen.getByLabelText("Leadership role"), {
    target: { value: "Captain" },
  });
  fireEvent.change(screen.getByLabelText(/Appointment date/), {
    target: { value: "2025-06-02" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() =>
    expect(fetchWithAuth).toHaveBeenCalledWith(
      "/athlete-profile/entries",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          kind: "achievement",
          organisation_id: null,
          achievement_type: "team_selection",
          leadership_role: "Captain",
          leadership_date: "2025-06-02",
          title: "Blue Bulls U15 Invitational",
          date: "2025-06-01",
          organization: "",
          notes: "",
        }),
      }),
    ),
  );
});
