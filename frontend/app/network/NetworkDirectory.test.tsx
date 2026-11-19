import { render, screen, fireEvent, within } from "@testing-library/react";
import NetworkDirectory from "./NetworkDirectory";
import schools from "./schools.json";
import universities from "./universities.json";
import clubs from "./clubs.json";

describe("institution directory", () => {
  it("filters clubs, searches by sport and keeps their logos grey", () => {
    render(<NetworkDirectory />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "club" },
    });
    expect(screen.getAllByRole("article")).toHaveLength(clubs.length);
    expect(screen.queryByText("✓ Established partner")).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("img").every((img) => img.className === "grey"),
    ).toBe(true);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "tuks cricket" },
    });
    expect(screen.getAllByRole("article")).toHaveLength(1);
    expect(screen.getByRole("article")).toHaveTextContent("Tuks Cricket");
  });
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
  it("groups every institution once and puts partners first within their group", () => {
    render(<NetworkDirectory />);
    expect(screen.getAllByRole("article")).toHaveLength(
      schools.length + universities.length + clubs.length,
    );
    expect(
      within(screen.getByRole("region", { name: "High schools" })).getAllByRole(
        "article",
      )[0],
    ).toHaveTextContent("Hoërskool Garsfontein");
    expect(screen.getAllByText("✓ Established partner")).toHaveLength(1);
    const grouped = [
      "Primary schools",
      "Primary & high schools",
      "High schools",
      "Universities",
      "Clubs",
    ].flatMap((name) =>
      within(screen.getByRole("region", { name })).getAllByRole("article"),
    );
    expect(grouped).toHaveLength(253);
    expect(new Set(grouped).size).toBe(253);
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
      schools.length + universities.length + clubs.length,
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
