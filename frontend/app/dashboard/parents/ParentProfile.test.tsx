import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ParentProfile from "./ParentProfile";
import { fetchWithAuth } from "../../lib/api";
jest.mock("../../lib/api", () => ({ fetchWithAuth: jest.fn() }));
const api = fetchWithAuth as jest.Mock;
const user = {
  id: "parent",
  role: "GUARDIAN",
  first_name: "Test",
  last_name: "Parent",
  email: "parent@test.com",
  phone: "",
  profile_image: "https://example.test/photo.jpg",
};
const ok = (data: unknown) => ({ ok: true, json: async () => data });
beforeEach(() => {
  api.mockReset();
  localStorage.clear();
  sessionStorage.clear();
});
it("shows the parent account and links child profiles under My children", async () => {
  api.mockResolvedValue(ok(user));
  render(<ParentProfile />);
  expect(await screen.findByLabelText("First name")).toHaveValue("Test");
  expect(screen.getByLabelText("Sign-in email")).toHaveAttribute("readonly");
  expect(
    screen.getByRole("link", { name: "View children's profiles ↗" }),
  ).toHaveAttribute("href", "/dashboard/parents/children/profiles");
  expect(screen.queryByLabelText("Show children")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Save changes" })).toBeDisabled();
});
it("saves changed parent fields only and refreshes the sidebar identity", async () => {
  api
    .mockResolvedValueOnce(ok(user))
    .mockResolvedValueOnce(
      ok({ ...user, first_name: "Updated", phone: "+27 82 123 4567" }),
    );
  const listener = jest.fn();
  window.addEventListener("profile-updated", listener);
  render(<ParentProfile />);
  await screen.findByLabelText("First name");
  listener.mockClear();
  fireEvent.change(screen.getByLabelText("First name"), {
    target: { value: "Updated" },
  });
  fireEvent.change(screen.getByLabelText("Phone number (optional)"), {
    target: { value: "+27 82 123 4567" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByText("Your profile has been updated.");
  expect(api).toHaveBeenLastCalledWith("/guardian/profile", {
    method: "PATCH",
    body: JSON.stringify({ first_name: "Updated", phone: "+27 82 123 4567" }),
  });
  expect(JSON.parse(localStorage.getItem("user")!)).toMatchObject({
    id: "parent",
    first_name: "Updated",
    role: "GUARDIAN",
  });
  expect(listener).toHaveBeenCalled();
  window.removeEventListener("profile-updated", listener);
});
it("retains edits on API failure and supports cancelling back to saved details", async () => {
  api
    .mockResolvedValueOnce(ok(user))
    .mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Enter a valid phone number." }),
    });
  render(<ParentProfile />);
  fireEvent.change(await screen.findByLabelText("Phone number (optional)"), {
    target: { value: "invalid" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("valid phone");
  expect(screen.getByLabelText("Phone number (optional)")).toHaveValue(
    "invalid",
  );
  fireEvent.click(screen.getByRole("button", { name: "Cancel changes" }));
  expect(screen.getByLabelText("Phone number (optional)")).toHaveValue("");
  expect(api).toHaveBeenCalledTimes(2);
});
it("removes photos only when saved and rejects unsupported uploads", async () => {
  api
    .mockResolvedValueOnce(ok(user))
    .mockResolvedValueOnce(ok({ ...user, profile_image: null }));
  render(<ParentProfile />);
  await screen.findByLabelText("First name");
  fireEvent.change(screen.getByLabelText("Profile photo"), {
    target: {
      files: [new File(["svg"], "unsafe.svg", { type: "image/svg+xml" })],
    },
  });
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "JPG, PNG or WebP",
  );
  fireEvent.click(screen.getByRole("button", { name: "Remove photo" }));
  expect(api).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByText("Your profile has been updated.");
  expect(api).toHaveBeenLastCalledWith("/guardian/profile", {
    method: "PATCH",
    body: JSON.stringify({ profile_image: null }),
  });
});
