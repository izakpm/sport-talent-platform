import {
  childContext,
  childWorkspacePath,
  childRequestPath,
} from "./guardian-context";
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(
  /\/$/,
  "",
);

export const fetchWithAuth = async (url: string, options: any = {}) => {
  const token = localStorage.getItem("token");

  const child =
    childWorkspacePath(window.location.pathname) && childRequestPath(url)
      ? childContext()
      : null;
  const headers = {
    ...(child ? { "X-Athlete-Id": child.id } : {}),
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_URL}${url}`, {
    ...options,
    headers,
  });

  // ✅ AUTO LOGOUT ON 401
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
    return;
  }

  return res;
};
