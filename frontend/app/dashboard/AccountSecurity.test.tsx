import { render, screen, fireEvent } from "@testing-library/react";
import AccountSecurity from "./AccountSecurity";
import { fetchWithAuth } from "../lib/api";
import { childContext } from "../lib/guardian-context";
jest.mock("../lib/api", () => ({ fetchWithAuth: jest.fn() }));
jest.mock("../lib/guardian-context", () => ({
  childContext: jest.fn(),
  childWorkspacePath: () => true,
}));
const request = fetchWithAuth as jest.Mock;
beforeEach(() => {
  jest.clearAllMocks();
  (childContext as jest.Mock).mockReturnValue(null);
});
test("shows password controls for password accounts", async () => {
  request.mockResolvedValue({
    ok: true,
    json: async () => ({
      email: "test@example.com",
      password: "enabled",
      google: false,
      managed: false,
    }),
  });
  render(<AccountSecurity />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Change password" }),
  );
  expect(screen.getByLabelText("Current password")).toBeInTheDocument();
  expect(request).toHaveBeenCalledWith("/auth/security");
});
test("Google-only users are directed to Google", async () => {
  request.mockResolvedValue({
    ok: true,
    json: async () => ({
      email: "test@example.com",
      password: "disabled",
      google: true,
      managed: false,
    }),
  });
  render(<AccountSecurity />);
  expect(
    await screen.findByRole("link", { name: /Google account/ }),
  ).toHaveAttribute("href", "https://myaccount.google.com/security");
  expect(
    screen.queryByRole("button", { name: "Change password" }),
  ).not.toBeInTheDocument();
});
test.each(["managed", "view"])(
  "child %s workspace never requests parent credentials",
  async (mode) => {
    (childContext as jest.Mock).mockReturnValue({ mode });
    render(<AccountSecurity />);
    expect(
      await screen.findByRole("link", { name: "Manage your own account" }),
    ).toHaveAttribute("href", "/dashboard/parents/profile");
    expect(request).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: "Change password" }),
    ).not.toBeInTheDocument();
  },
);
