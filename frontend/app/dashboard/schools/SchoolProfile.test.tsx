// Account security has its own API and interaction tests.
jest.mock("../AccountSecurity", () => ({ __esModule: true, default: () => <section aria-label="Account security" /> }));
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import SchoolProfile from "./SchoolProfile";
import { fetchWithAuth } from "../../lib/api";
jest.mock("../../lib/api", () => ({ fetchWithAuth: jest.fn() }));
const school = {
  id: "school",
  name: "Montana",
  type: "SCHOOL",
  location: "Pretoria",
  province: "Gauteng",
  can_edit_profile: true,
  is_demo: true,
};
beforeEach(() => {
  jest.mocked(fetchWithAuth).mockReset();
  jest
    .mocked(fetchWithAuth)
    .mockResolvedValue({ ok: true, json: async () => ({ school }) } as any);
});
it("views, edits and persists organisation details", async () => {
  render(<SchoolProfile />);
  const name = await screen.findByLabelText("Organisation name");
  expect(name).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Edit details" }));
  fireEvent.change(name, { target: { value: "Montana School" } });
  jest
    .mocked(fetchWithAuth)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...school, name: "Montana School" }),
    } as any);
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByText("Organisation details saved.");
  expect(fetchWithAuth).toHaveBeenLastCalledWith(
    "/schools/profile",
    expect.objectContaining({
      method: "PATCH",
      body: expect.stringContaining("Montana School"),
    }),
  );
  expect(name).toBeDisabled();
});
it("cancels edits without writing", async () => {
  render(<SchoolProfile />);
  const name = await screen.findByLabelText("Organisation name");
  fireEvent.click(screen.getByRole("button", { name: "Edit details" }));
  fireEvent.change(name, { target: { value: "Discard" } });
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(name).toHaveValue("Montana");
  expect(fetchWithAuth).toHaveBeenCalledTimes(1);
});
it("keeps edits and reports server errors", async () => {
  render(<SchoolProfile />);
  await screen.findByLabelText("Organisation name");
  fireEvent.click(screen.getByRole("button", { name: "Edit details" }));
  jest
    .mocked(fetchWithAuth)
    .mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Not allowed" }),
    } as any);
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByRole("alert");
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled(),
  );
  expect(screen.getByLabelText("Organisation name")).toBeEnabled();
});
