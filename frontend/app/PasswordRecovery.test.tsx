import { StrictMode } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PasswordRecovery from "./PasswordRecovery";
jest.mock("./AuthModal", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
jest.mock("./lib/api", () => ({ API_URL: "/api" }));
beforeEach(() => {
  window.history.replaceState(null, "", "/forgot-password");
  global.fetch = jest.fn();
});
test("recovery sends an email request and displays a neutral confirmation", async () => {
  (fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({
      message:
        "If this email has an eligible account, you will receive instructions shortly.",
    }),
  });
  render(<PasswordRecovery />);
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "athlete@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send instructions" }));
  expect(await screen.findByRole("status")).toHaveTextContent("If this email");
  expect(fetch).toHaveBeenCalledWith(
    "/api/auth/forgot-password",
    expect.objectContaining({
      body: JSON.stringify({ email: "athlete@example.com" }),
    }),
  );
});
test("reset token is removed from the URL and survives strict effect replay", async () => {
  window.history.replaceState(
    null,
    "",
    `/reset-password#token=${"a".repeat(64)}`,
  );
  render(
    <StrictMode>
      <PasswordRecovery reset />
    </StrictMode>,
  );
  await waitFor(() => expect(window.location.hash).toBe(""));
  expect(screen.getByRole("button", { name: "Reset password" })).toBeEnabled();
  expect(screen.queryByText(/link is missing/)).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
test("missing tokens show a route to request a new link", async () => {
  render(<PasswordRecovery reset />);
  expect(
    await screen.findByRole("link", { name: "Request a new link" }),
  ).toHaveAttribute("href", "/forgot-password");
  expect(
    screen.queryByRole("button", { name: "Reset password" }),
  ).not.toBeInTheDocument();
});
