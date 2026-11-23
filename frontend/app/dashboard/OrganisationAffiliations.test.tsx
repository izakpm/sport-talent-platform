import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OrganisationAffiliations from "./OrganisationAffiliations";
import { fetchWithAuth } from "../lib/api";
jest.mock("../lib/api", () => ({ fetchWithAuth: jest.fn() }));
const org = {
  id: "org",
  name: "Montana",
  type: "SCHOOL",
  location: "Pretoria",
};
const affiliation = {
  ...org,
  id: "link",
  organisation_id: "org",
  status: "requested",
  starts_on: "2026-01-01",
  role: "ATHLETE",
};
const response = (data: any) => ({ ok: true, json: async () => data });
beforeEach(() => jest.resetAllMocks());
it("searches canonical organisations and submits only the selected organisation", async () => {
  (fetchWithAuth as jest.Mock).mockImplementation(
    async (path: string, options: any) =>
      response(
        path.includes("organisations?")
          ? [org]
          : options.method === "POST"
            ? { affiliations: [affiliation], can_edit: true }
            : { affiliations: [], can_edit: true },
      ),
  );
  render(<OrganisationAffiliations />);
  fireEvent.click(await screen.findByText("Add school or club +"));
  fireEvent.change(screen.getByLabelText("Find your school or club"), {
    target: { value: "Mont" },
  });
  fireEvent.click(
    await screen.findByRole("button", { name: "Montana School · Pretoria" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Add affiliation" }));
  expect(await screen.findByText("Self-reported")).toBeInTheDocument();
  expect(fetchWithAuth).toHaveBeenCalledWith(
    "/affiliations",
    expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ organisation_id: "org" }),
    }),
  );
});
it("keeps linked older athletes read-only", async () => {
  (fetchWithAuth as jest.Mock).mockResolvedValue(
    response({ affiliations: [affiliation], can_edit: false }),
  );
  render(<OrganisationAffiliations />);
  expect(await screen.findByText("Montana")).toBeInTheDocument();
  expect(screen.queryByText("Add school or club +")).not.toBeInTheDocument();
  expect(screen.queryByText("End affiliation")).not.toBeInTheDocument();
});
it("confirms ending and retains affiliation history", async () => {
  (fetchWithAuth as jest.Mock).mockImplementation(async (path: string) =>
    response({
      affiliations: [
        path.endsWith("/end")
          ? { ...affiliation, status: "ended", ends_on: "2026-11-23" }
          : affiliation,
      ],
      can_edit: true,
    }),
  );
  render(<OrganisationAffiliations />);
  fireEvent.click(await screen.findByText("End affiliation"));
  expect(fetchWithAuth).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByText("Confirm end"));
  expect(
    await screen.findByText("Previous affiliations (1)"),
  ).toBeInTheDocument();
});
it("keeps failed saves open for retry", async () => {
  (fetchWithAuth as jest.Mock).mockImplementation(
    async (path: string, options: any) =>
      options.method === "POST"
        ? { ok: false, json: async () => ({ message: "Please retry" }) }
        : response(
            path.includes("organisations?")
              ? [org]
              : { affiliations: [], can_edit: true },
          ),
  );
  render(<OrganisationAffiliations />);
  fireEvent.click(await screen.findByText("Add school or club +"));
  fireEvent.change(screen.getByLabelText("Find your school or club"), {
    target: { value: "Mont" },
  });
  fireEvent.click(
    await screen.findByRole("button", { name: "Montana School · Pretoria" }),
  );
  fireEvent.click(screen.getByText("Add affiliation"));
  expect(await screen.findByRole("alert")).toHaveTextContent("Please retry");
  expect(screen.getByText("Selected: Montana")).toBeInTheDocument();
});
it("lets a parent switch between their own and a child’s affiliations without changing workspaces", async () => {
  (fetchWithAuth as jest.Mock).mockImplementation(async (path: string) =>
    response(
      path === "/guardian/children"
        ? [
            {
              id: "child",
              first_name: "Junior",
              last_name: "Meyer",
              status: "accepted",
              mode: "managed",
            },
          ]
        : { affiliations: [], can_edit: true },
    ),
  );
  render(<OrganisationAffiliations family />);
  await screen.findByRole("option", { name: "Junior Meyer" });
  fireEvent.change(screen.getByLabelText("Show affiliations for"), {
    target: { value: "child" },
  });
  await waitFor(() =>
    expect(fetchWithAuth).toHaveBeenCalledWith(
      "/affiliations",
      expect.objectContaining({ headers: { "X-Athlete-Id": "child" } }),
    ),
  );
  fireEvent.change(screen.getByLabelText("Show affiliations for"), {
    target: { value: "" },
  });
  await waitFor(() =>
    expect(fetchWithAuth).toHaveBeenLastCalledWith(
      "/affiliations",
      expect.objectContaining({ headers: { "X-Athlete-Id": "" } }),
    ),
  );
});
