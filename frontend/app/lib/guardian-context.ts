export type GuardianChild = {
  id: string;
  link_id: string;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  profile_image?: string | null;
  mode: "managed" | "view";
  status: string;
  parent_id?: string;
};
export function childContext(): GuardianChild | null {
  if (typeof window === "undefined") return null;
  try {
    const parent = JSON.parse(localStorage.getItem("user") || "{}");
    const child = JSON.parse(
      sessionStorage.getItem("guardian-child") || "null",
    );
    return parent.role === "GUARDIAN" && child?.parent_id === parent.id
      ? child
      : null;
  } catch {
    return null;
  }
}
export function selectChild(child: GuardianChild) {
  const parent = JSON.parse(localStorage.getItem("user") || "{}");
  sessionStorage.setItem(
    "guardian-child",
    JSON.stringify({ ...child, parent_id: parent.id }),
  );
}
export function childWorkspacePath(path: string) {
  return (
    path === "/check-in" ||
    path.startsWith("/dashboard/athlete") ||
    path === "/dashboard/profile" ||
    path.startsWith("/dashboard/parents/view/")
  );
}
export function childRequestPath(path: string) {
  return /^\/(athlete-profile(?:\/|$)|activities(?:\/|$)|team-hub(?:\/|$)|resources(?:\/|$))/.test(
    path,
  );
}
