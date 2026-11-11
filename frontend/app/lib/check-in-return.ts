const KEY = "playverified-check-in";
export function rememberCheckIn(code: string) {
  if (/^[A-Za-z0-9_-]{43}$/.test(code))
    sessionStorage.setItem(KEY, JSON.stringify({ code, at: Date.now() }));
}
export function pendingCheckIn() {
  try {
    const data = JSON.parse(sessionStorage.getItem(KEY) || "null");
    return data &&
      /^[A-Za-z0-9_-]{43}$/.test(data.code) &&
      Date.now() - data.at < 30 * 60 * 1000
      ? data.code
      : "";
  } catch {
    return "";
  }
}
export function checkInReturn() {
  const code = pendingCheckIn();
  return code ? `/check-in#code=${code}` : null;
}
export function clearCheckIn() {
  sessionStorage.removeItem(KEY);
}
