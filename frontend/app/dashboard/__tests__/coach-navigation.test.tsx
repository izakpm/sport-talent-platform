import { getDashboardRoleConfig } from "../core/roles";
import History from "../coaches/history/page";
import Achievements from "../coaches/achievements/page";
import Qualifications from "../coaches/qualifications/page";
import { redirect } from "next/navigation";
jest.mock("next/navigation", () => ({ redirect: jest.fn() }));
it("has the seven coach destinations in the agreed order", () => {
  expect(
    getDashboardRoleConfig("COACH").navGroups.flatMap((g) => g.items),
  ).toEqual([
    { name: "Dashboard", href: "/dashboard/coaches" },
    { name: "Profile", href: "/dashboard/profile" },
    { name: "Teams", href: "/dashboard/coaches/teams" },
    { name: "Schedule", href: "/dashboard/coaches/schedule" },
    { name: "Matches", href: "/dashboard/coaches/matches" },
    { name: "Team Feed", href: "/dashboard/coaches/feed" },
    { name: "Verification", href: "/dashboard/coaches/verification" },
  ]);
});
it("keeps legacy portfolio links working", () => {
  History();
  expect(redirect).toHaveBeenLastCalledWith("/dashboard/profile#history");
  Achievements();
  expect(redirect).toHaveBeenLastCalledWith("/dashboard/profile#achievements");
  Qualifications();
  expect(redirect).toHaveBeenLastCalledWith(
    "/dashboard/profile#qualifications",
  );
});
