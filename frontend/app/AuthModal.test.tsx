import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AuthModal from "./AuthModal";
import RegisterForm from "./RegisterForm";

const push = jest.fn();
const replace = jest.fn();
jest.mock("next/navigation", () => ({ useRouter: () => ({ push, replace }) }));

beforeEach(() => {
  push.mockClear();
  replace.mockClear();
  window.history.replaceState({}, "", "/register?role=COACH");
});

it("locks scrolling and closes on Escape, backdrop, or close button without closing on form clicks", () => {
  const { unmount } = render(
    <AuthModal title="Join">
      <input aria-label="Email" />
    </AuthModal>,
  );
  expect(document.body.style.overflow).toBe("hidden");
  screen.getByLabelText("Email").focus();
  fireEvent.keyDown(screen.getByLabelText("Email"), { key: "Tab" });
  expect(
    screen.getByRole("button", { name: "Close sign-in window" }),
  ).toHaveFocus();
  fireEvent.keyDown(
    screen.getByRole("button", { name: "Close sign-in window" }),
    { key: "Tab", shiftKey: true },
  );
  expect(screen.getByLabelText("Email")).toHaveFocus();
  fireEvent.click(screen.getByLabelText("Email"));
  expect(push).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("dialog"));
  expect(push).toHaveBeenLastCalledWith("/", { scroll: false });
  fireEvent(
    screen.getByRole("dialog"),
    new Event("cancel", { bubbles: true, cancelable: true }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Close sign-in window" }));
  expect(push).toHaveBeenCalledTimes(3);
  unmount();
  expect(document.body.style.overflow).toBe("");
});

it("preserves the coach role and existing registration payload, then opens login", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true });
  render(<RegisterForm />);
  expect(
    screen.getByRole("button", { name: "Coach", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  fireEvent.change(screen.getByLabelText("First name"), {
    target: { value: "Test" },
  });
  fireEvent.change(screen.getByLabelText("Last name"), {
    target: { value: "Coach" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "Coach@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "example-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));
  await waitFor(() =>
    expect(replace).toHaveBeenCalledWith("/login?registered=1", {
      scroll: false,
    }),
  );
  expect(JSON.parse((fetch as jest.Mock).mock.calls[0][1].body)).toEqual({
    email: "coach@example.com",
    password: "example-password",
    first_name: "Test",
    last_name: "Coach",
    role: "COACH",
  });
});
