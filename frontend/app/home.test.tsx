import { fireEvent, render, screen } from "@testing-library/react";
import Home from "./page";
import Privacy from "./privacy/page";
import Register from "./register/page";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
it("introduces real coach tools, links to registration and distinguishes the roadmap", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    "performance",
  );
  expect(
    screen.getByRole("link", { name: /Create your coach account/ }),
  ).toHaveAttribute("href", "/register?role=COACH");
  expect(screen.getByRole("link", { name: "Privacy policy" })).toHaveAttribute(
    "href",
    "/privacy",
  );
  expect(
    screen.getByText(/These organisation tools are in development/),
  ).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Preview team"), {
    target: { value: "u16" },
  });
  expect(screen.getByText("Passing under pressure")).toBeInTheDocument();
  expect(
    screen.queryByText("Build the defensive line"),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Team roster" }));
  expect(screen.getByText("Taylor N.")).toBeInTheDocument();
  expect(screen.queryByText("Passing under pressure")).not.toBeInTheDocument();
});
it("lets visitors explore the organisation example without creating records", () => {
  render(<Home />);
  fireEvent.change(screen.getByLabelText("Organisation example team"), {
    target: { value: "u16" },
  });
  expect(screen.getByText("Riverside vs Northside")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Coaches", exact: true }));
  expect(screen.getByText("Lebo N.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Competition log" }));
  expect(screen.getByRole("table")).toBeInTheDocument();
  expect(screen.queryByText("Lebo N.")).not.toBeInTheDocument();
});
it("publishes operator details and accessible privacy contact methods", () => {
  render(<Privacy />);
  expect(
    screen.getByRole("heading", { level: 1, name: "Privacy policy" }),
  ).toBeInTheDocument();
  expect(screen.getByText(/232 Airport Road/)).toBeInTheDocument();
  expect(
    screen.getAllByRole("link", { name: "info@bulperd.com" })[0],
  ).toHaveAttribute("href", "mailto:info@bulperd.com");
  expect(
    screen.getByRole("heading", { name: "3. Google sign-in" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", {
      name: "10. Your choices, rights and privacy requests",
    }),
  ).toBeInTheDocument();
});
it("preselects the coach role from a landing-page link without starting registration", () => {
  window.history.replaceState({}, "", "/register?role=COACH");
  render(<Register />);
  expect(
    screen.getByRole("button", { name: /Continue with Google/ }),
  ).toBeEnabled();
  expect(screen.getByRole("link", { name: "Privacy policy" })).toHaveAttribute(
    "href",
    "/privacy",
  );
  window.history.replaceState({}, "", "/");
});
