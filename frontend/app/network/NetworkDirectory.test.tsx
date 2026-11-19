import { render, screen, fireEvent } from "@testing-library/react";
import NetworkDirectory from "./NetworkDirectory";
import schools from "./schools.json";

describe("school directory", () => {
  it("keeps the confirmed partner first and progressively shows the directory", () => {
    render(<NetworkDirectory />);
    expect(screen.getAllByRole("article")).toHaveLength(24);
    expect(screen.getAllByRole("article")[0]).toHaveTextContent(
      "Hoërskool Garsfontein",
    );
    expect(screen.getAllByText("✓ Established partner")).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "Show more schools" }));
    expect(screen.getAllByRole("article")).toHaveLength(48);
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
    expect(screen.getByText("No schools found")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.getAllByRole("article")).toHaveLength(24);
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
