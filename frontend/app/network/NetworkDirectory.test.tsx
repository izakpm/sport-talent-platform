import { render, screen, fireEvent } from "@testing-library/react";
import NetworkDirectory from "./NetworkDirectory";
import schools from "./schools.json";
import universities from "./universities.json";

describe("institution directory", () => {
  it("filters universities and finds institutions by team name", () => {
    render(<NetworkDirectory />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "university" },
    });
    expect(screen.getAllByRole("article")).toHaveLength(16);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "tuks" },
    });
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("article")).toHaveTextContent(
      "University of Pretoria",
    );
  });
  it("shows all schools with the confirmed partner first", () => {
    render(<NetworkDirectory />);
    expect(screen.getAllByRole("article")).toHaveLength(
      schools.length + universities.length,
    );
    expect(screen.getAllByRole("article")[0]).toHaveTextContent(
      "Hoërskool Garsfontein",
    );
    expect(screen.getAllByText("✓ Established partner")).toHaveLength(1);
    expect(
      screen.queryByRole("button", { name: "Show more schools" }),
    ).not.toBeInTheDocument();
  });
  it("combines name, school type and partnership filters without confusing the two Garsfontein schools", () => {
    render(<NetworkDirectory />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "garsfontein" },
    });
    expect(screen.getAllByRole("article")).toHaveLength(2);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "primary" },
    });
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("article")).toHaveTextContent(
      "Laerskool Garsfontein",
    );
    fireEvent.click(screen.getByRole("button", { name: /Partners 1/ }));
    expect(screen.getByText("No institutions found")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getAllByRole("article")).toHaveLength(
      schools.length + universities.length,
    );
  });
  it("supports accent-insensitive searches and has unique school identities", () => {
    render(<NetworkDirectory />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "hoerskool garsfontein" },
    });
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(new Set(schools.map((s) => s.slug)).size).toBe(schools.length);
    expect(schools.filter((s) => s.partner).map((s) => s.slug)).toEqual([
      "garsfontein",
    ]);
  });
});
