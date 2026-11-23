import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useState } from "react";
import Picker, {
  type AchievementOrganisation,
} from "./AchievementOrganisationPicker";
import { fetchWithAuth } from "../../lib/api";
jest.mock("../../lib/api", () => ({ fetchWithAuth: jest.fn() }));
function Harness() {
  const [value, setValue] = useState<AchievementOrganisation>({
    id: null,
    name: "",
  });
  const [pending, setPending] = useState(false);
  return (
    <>
      <Picker value={value} onChange={setValue} onPendingChange={setPending} />
      <output data-testid="state">{JSON.stringify({ value, pending })}</output>
    </>
  );
}
beforeEach(() => jest.clearAllMocks());
it("selects the directory ID and logo, and clears them when switching to manual entry", async () => {
  (fetchWithAuth as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => [
      {
        id: "school-id",
        name: "Montana",
        type: "SCHOOL",
        logo_url: "/schools/montana.png",
      },
    ],
  });
  render(<Harness />);
  fireEvent.change(screen.getByLabelText("Find a school or club"), {
    target: { value: "Montana" },
  });
  expect(screen.getByTestId("state").textContent).toContain('"pending":true');
  fireEvent.click(
    await screen.findByRole("button", { name: /Montana School/ }),
  );
  expect(screen.getByRole("img", { name: "Montana" })).toHaveAttribute(
    "src",
    "/schools/montana.png",
  );
  expect(screen.getByTestId("state").textContent).toContain('"id":"school-id"');
  fireEvent.click(screen.getByRole("button", { name: "Change" }));
  fireEvent.click(
    screen.getByRole("button", { name: "Enter a name manually" }),
  );
  fireEvent.change(screen.getByLabelText("School, club or competition"), {
    target: { value: "Tournament award" },
  });
  expect(screen.getByTestId("state").textContent).toContain('"id":null');
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});
it("reports search errors without linking typed text", async () => {
  (fetchWithAuth as jest.Mock).mockResolvedValue({ ok: false });
  render(<Harness />);
  fireEvent.change(screen.getByLabelText("Find a school or club"), {
    target: { value: "Missing" },
  });
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "could not be loaded",
  );
  expect(screen.getByTestId("state").textContent).toContain('"id":null');
});
