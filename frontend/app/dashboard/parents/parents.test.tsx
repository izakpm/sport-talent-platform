import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Parents from "./page";
import GuardianRequests from "./GuardianRequests";
import { fetchWithAuth } from "../../lib/api";
import { childContext, selectChild } from "../../lib/guardian-context";
import {
  normalizeDashboardRole,
  getDashboardRoleConfig,
  isDashboardPathAllowedForRole,
} from "../core/roles";
jest.mock("../../lib/api", () => ({ fetchWithAuth: jest.fn() }));
const api = fetchWithAuth as jest.Mock;
const ok = (data: any) => ({ ok: true, json: async () => data });
beforeEach(() => {
  api.mockReset();
  localStorage.clear();
  sessionStorage.clear();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
it("routes guardians to the parent workspace", () => {
  expect(normalizeDashboardRole("GUARDIAN")).toBe("GUARDIAN");
  expect(getDashboardRoleConfig("GUARDIAN").dashboardPath).toBe(
    "/dashboard/parents",
  );
  expect(isDashboardPathAllowedForRole("/dashboard/coaches", "GUARDIAN")).toBe(
    false,
  );
});
it("binds the selected child to the actual signed-in parent", () => {
  localStorage.setItem(
    "user",
    JSON.stringify({ id: "parent1", role: "GUARDIAN" }),
  );
  selectChild({
    id: "child",
    link_id: "link",
    mode: "managed",
    status: "accepted",
    first_name: "Child",
    last_name: "Test",
  });
  expect(childContext()?.id).toBe("child");
  localStorage.setItem(
    "user",
    JSON.stringify({ id: "parent2", role: "GUARDIAN" }),
  );
  expect(childContext()).toBeNull();
});
it("creates a child without an email and with guardian confirmation", async () => {
  api.mockResolvedValue(ok([]));
  render(<Parents />);
  await screen.findByText("Start with your first child.");
  fireEvent.click(screen.getByRole("button", { name: "Add a child +" }));
  expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("First name"), {
    target: { value: "Junior" },
  });
  fireEvent.change(screen.getByLabelText("Last name"), {
    target: { value: "Test" },
  });
  fireEvent.change(screen.getByLabelText("Date of birth"), {
    target: { value: "2016-03-12" },
  });
  fireEvent.click(screen.getByLabelText(/I am this child/));
  fireEvent.click(
    screen.getByRole("button", { name: "Add child", exact: true }),
  );
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith(
      "/guardian/children",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          first_name: "Junior",
          last_name: "Test",
          date_of_birth: "2016-03-12",
          guardian_confirmed: true,
        }),
      }),
    ),
  );
});
it("requires the athlete to approve a pending parent link", async () => {
  api.mockResolvedValue(
    ok([
      {
        id: "link",
        first_name: "Test",
        last_name: "Parent",
        email: "parent@test.com",
        status: "pending",
      },
    ]),
  );
  render(<GuardianRequests />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Approve parent link" }),
  );
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith(
      "/guardian/requests/link",
      expect.objectContaining({ body: JSON.stringify({ status: "accepted" }) }),
    ),
  );
});
