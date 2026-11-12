const KEY = "playverified-team-invite";
export function rememberTeamInvite(token: string) {
  if (/^[A-Za-z0-9_-]{43}$/.test(token))
    sessionStorage.setItem(KEY, JSON.stringify({ token, at: Date.now() }));
}
export function pendingTeamInvite(): string {
  try {
    const data = JSON.parse(sessionStorage.getItem(KEY) || "null");
    return data &&
      /^[A-Za-z0-9_-]{43}$/.test(data.token) &&
      Date.now() - data.at < 7 * 86400000
      ? data.token
      : "";
  } catch {
    return "";
  }
}
export function teamInviteReturn() {
  const token = pendingTeamInvite();
  return token ? `/join-team#invite=${token}` : null;
}
export function clearTeamInvite() {
  sessionStorage.removeItem(KEY);
}
