import {
  rememberTeamInvite,
  teamInviteReturn,
  clearTeamInvite,
} from "./team-invite-return";
beforeEach(() => sessionStorage.clear());
it("preserves only safe invitation tokens through login", () => {
  rememberTeamInvite("a".repeat(43));
  expect(teamInviteReturn()).toBe("/join-team#invite=" + "a".repeat(43));
  clearTeamInvite();
  expect(teamInviteReturn()).toBeNull();
  rememberTeamInvite("https://evil.test");
  expect(teamInviteReturn()).toBeNull();
});
it("expires saved invitation context", () => {
  sessionStorage.setItem(
    "playverified-team-invite",
    JSON.stringify({ token: "a".repeat(43), at: Date.now() - 8 * 86400000 }),
  );
  expect(teamInviteReturn()).toBeNull();
});
