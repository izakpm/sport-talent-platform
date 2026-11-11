import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CoachProfile from "./CoachProfile";
import { fetchWithAuth } from "../../lib/api";
jest.mock("../../lib/api", () => ({ fetchWithAuth: jest.fn() }));
const api = fetchWithAuth as jest.Mock;
const profile = {
  user: {
    id: "me",
    first_name: "Izak",
    last_name: "Meyer",
    email: "coach@example.com",
    role: "COACH",
  },
  details: { primary_sport: "Rugby", bio: "Developing players" },
  counts: { teams: 2, history: 3, achievements: 1, qualifications: 4 },
};
beforeEach(() => {
  window.history.replaceState(null, "", "/");
  api.mockReset();
  localStorage.clear();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  api.mockResolvedValueOnce({ ok: true, json: async () => profile });
});
it("shows real coaching information and portfolio links without athlete placeholders", async () => {
  render(<CoachProfile />);
  await screen.findByRole("heading", { name: "Izak Meyer" });
  expect(screen.getByText("Developing players")).toBeInTheDocument();
  expect(screen.queryByText("Guardian")).not.toBeInTheDocument();
  expect(screen.queryByText("Pending Verification")).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /4.*Qualifications/ }),
  ).toHaveAttribute("href", "#qualifications");
});
it("saves details and updates the remembered account and sidebar event", async () => {
  const listener = jest.fn();
  window.addEventListener("profile-updated", listener);
  render(<CoachProfile />);
  await screen.findByRole("heading", { name: "Izak Meyer" });
  fireEvent.click(
    screen.getByRole("button", { name: "Edit personal details" }),
  );
  fireEvent.change(screen.getByLabelText("First name"), {
    target: { value: "Isaac" },
  });
  api.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      ...profile,
      user: { ...profile.user, first_name: "Isaac" },
    }),
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByRole("heading", { name: "Isaac Meyer" });
  expect(JSON.parse(api.mock.calls[1][1].body)).toEqual({
    first_name: "Isaac",
    last_name: "Meyer",
    phone: "",
  });
  expect(JSON.parse(localStorage.getItem("user")!).first_name).toBe("Isaac");
  expect(listener).toHaveBeenCalled();
  window.removeEventListener("profile-updated", listener);
});
it("preserves edits on server error and confirms discard", async () => {
  render(<CoachProfile />);
  await screen.findByRole("heading", { name: "Izak Meyer" });
  fireEvent.click(
    screen.getByRole("button", { name: "Edit about my coaching" }),
  );
  fireEvent.change(screen.getByLabelText("My coaching philosophy"), {
    target: { value: "My new approach" },
  });
  api.mockResolvedValueOnce({
    ok: false,
    json: async () => ({ message: "Please try saving again." }),
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByText("Please try saving again.");
  expect(screen.getByLabelText("My coaching philosophy")).toHaveValue(
    "My new approach",
  );
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(screen.getByText("Discard your unsaved changes?")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
  expect(screen.getByText("Developing players")).toBeInTheDocument();
  expect(api).toHaveBeenCalledTimes(2);
});
it("handles failed initial load with a retry", async () => {
  window.history.replaceState(null, "", "/");
  api.mockReset();
  api.mockRejectedValueOnce(new Error("Unable to connect"));
  render(<CoachProfile />);
  await screen.findByRole("alert");
  api.mockResolvedValueOnce({ ok: true, json: async () => profile });
  fireEvent.click(screen.getByRole("button", { name: "Try again" }));
  await screen.findByRole("heading", { name: "Izak Meyer" });
});

it("removes a photo only after saving the draft", async () => {
  window.history.replaceState(null, "", "/");
  api.mockReset();
  api.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      ...profile,
      user: { ...profile.user, profile_image: "data:image/png;base64,test" },
    }),
  });
  render(<CoachProfile />);
  await screen.findByRole("heading", { name: "Izak Meyer" });
  fireEvent.click(screen.getByRole("button", { name: "Change profile photo" }));
  fireEvent.click(screen.getByRole("button", { name: "Remove photo" }));
  expect(api).toHaveBeenCalledTimes(1);
  api.mockResolvedValueOnce({ ok: true, json: async () => profile });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByText("Your profile has been updated.");
  expect(JSON.parse(api.mock.calls[1][1].body)).toEqual({
    profile_image: null,
  });
});
it("previews a selected photo before uploading it", async () => {
  render(<CoachProfile />);
  await screen.findByRole("heading", { name: "Izak Meyer" });
  fireEvent.click(screen.getByRole("button", { name: "Change profile photo" }));
  const file = new File(
    [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])],
    "photo.png",
    { type: "image/png" },
  );
  fireEvent.change(screen.getByLabelText("Choose photo"), {
    target: { files: [file] },
  });
  await screen.findByAltText("Profile photo preview");
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Save changes" })).toBeEnabled(),
  );
  expect(api).toHaveBeenCalledTimes(1);
  api.mockResolvedValueOnce({ ok: true, json: async () => profile });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await screen.findByText("Your profile has been updated.");
  expect(JSON.parse(api.mock.calls[1][1].body).profile_image).toMatch(
    /^data:image\/png;base64,/,
  );
});

it("opens portfolio deep links and switches tabs with keyboard and history", async () => {
  window.history.replaceState(null, "", "/#qualifications");
  api.mockResolvedValue({ ok: true, json: async () => [] });
  render(<CoachProfile />);
  await screen.findByRole("heading", {
    name: "Build your coaching credentials.",
  });
  expect(screen.getByRole("tab", { name: "Qualifications" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(screen.queryByText("Personal details")).not.toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole("tab", { name: "Qualifications" }), {
    key: "ArrowLeft",
  });
  await screen.findByRole("heading", {
    name: "Celebrate your first milestone.",
  });
  expect(api).toHaveBeenCalledWith("/coach-portfolio/achievements", undefined);
  fireEvent.click(screen.getByRole("tab", { name: "Coaching history" }));
  await screen.findByRole("heading", {
    name: "Where has your coaching taken you?",
  });
  fireEvent.keyDown(screen.getByRole("tab", { name: "Coaching history" }), {
    key: "Home",
  });
  expect(screen.getByText("Personal details")).toBeInTheDocument();
});
