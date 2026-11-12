import { fetchWithAuth } from "../../lib/api";
export async function family<T>(path: string, body?: object): Promise<T> {
  const res = await fetchWithAuth(
    "/guardian" + path,
    body ? { method: "POST", body: JSON.stringify(body) } : {},
  );
  const data = await res?.json();
  if (!res?.ok)
    throw Error(data?.message || "Unable to load your family workspace.");
  return data;
}
