import { fireEvent, render, screen } from "@testing-library/react";
import Home from "./HomeLanding";
import Privacy from "./privacy/page";
import Register from "./RegisterForm";
import AthleteShowcase from "./AthleteShowcase";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));
it("flips the athlete photo and keeps the reverse interactive", () => {
  render(<AthleteShowcase />);
  const card = screen.getByRole("region", { name: "Athlete showcase" });
  expect(screen.getByRole("img")).toBeVisible();
  fireEvent.keyDown(card, { key: "Enter" });
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Performance record" }));
  expect(screen.getByText("Awaiting review")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Sporting profile" }));
  expect(screen.getByText("Primary position")).toBeVisible();
  fireEvent.keyDown(card, { key: "Escape" });
  expect(screen.getByRole("img")).toBeVisible();
  fireEvent.click(screen.getByRole("img"));
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
  fireEvent.keyDown(card, { key: "Escape" });
  expect(screen.getByRole("img")).toBeVisible();
});
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
    screen.getByText(
      /We’re developing performance records and coach verification/,
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("img", {
      name: "Rugby coach holding a ball beside yellow COACHES lettering",
    }),
  ).toBeVisible();
  const card = screen.getByRole("region", { name: "Coach showcase" });
  fireEvent.keyDown(card, { key: "Enter" });
  fireEvent.change(screen.getByLabelText("Preview team"), {
    target: { value: "u16" },
  });
  expect(screen.getByText("Passing under pressure")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Team roster" }));
  expect(screen.getByText("Taylor N.")).toBeVisible();
  expect(screen.queryByText("Passing under pressure")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Monthly plan" }));
  expect(screen.getByText("Passing under pressure")).toBeVisible();
  fireEvent.keyDown(card, { key: "Escape" });
  expect(
    screen.getByRole("img", {
      name: "Rugby coach holding a ball beside yellow COACHES lettering",
    }),
  ).toBeVisible();
});
it("lets visitors explore the organisation example without creating records", () => {
  render(<Home />);
  const showcase = screen.getByRole("region", {
    name: "Schools and clubs showcase",
  });
  expect(
    screen.getByRole("img", { name: /Rugby players in action/ }),
  ).toBeVisible();
  fireEvent.keyDown(showcase, { key: "Enter" });
  fireEvent.change(screen.getByLabelText("Organisation example team"), {
    target: { value: "u16" },
  });
  expect(screen.getByText("Riverside vs Northside")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Coaches", exact: true }));
  expect(screen.getByText("Lebo N.")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Competition log" }));
  expect(screen.getByRole("table")).toBeInTheDocument();
  expect(screen.queryByText("Lebo N.")).not.toBeInTheDocument();
  fireEvent.keyDown(showcase, { key: "Escape" });
  expect(
    screen.getByRole("img", { name: /Rugby players in action/ }),
  ).toBeVisible();
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
