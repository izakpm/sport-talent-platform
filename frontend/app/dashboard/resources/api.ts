import { fetchWithAuth } from "../../lib/api";
export const topics: Record<string, string> = {
  mindset: "Mindset & Motivation",
  nutrition: "Nutrition",
  training: "Training & Skills",
  recovery: "Recovery",
  life: "Life Beyond Sport",
};
export const formats: Record<string, string> = {
  video: "Video",
  audio: "Podcast / Audio",
  article: "Article",
  guide: "Guide",
};
export type Resource = {
  id: string;
  title: string;
  summary: string;
  topic: string;
  format: string;
  author: string;
  duration_minutes: number | null;
  body?: string;
  transcript?: string;
  source_url?: string;
  status: string;
  featured: boolean;
  version: number;
  thumbnail_url?: string | null;
  media_url?: string | null;
  captions_url?: string | null;
  published_at?: string;
  assets?: {
    id: string;
    name: string;
    mime: string;
    size: number;
    purpose: string;
  }[];
};
export type ResourceList = {
  items: Resource[];
  featured: Resource | null;
  total: number;
  next_offset: number | null;
};
export async function resources<T>(
  path = "",
  method = "GET",
  body?: unknown,
): Promise<T> {
  const res = await fetchWithAuth(`/resources${path}`, {
    method,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res) throw new Error("Your session expired. Please sign in again.");
  const data = await res.json().catch(() => ({}));
  if (!res.ok)
    throw new Error(
      typeof data.message === "string"
        ? data.message
        : "Unable to load resources. Please try again.",
    );
  return data;
}
export const actionLabel = (r: Resource) =>
  r.format === "video"
    ? "Watch video"
    : r.format === "audio"
      ? "Listen now"
      : r.format === "guide"
        ? "Read guide"
        : "Read article";
export const durationLabel = (r: Resource) =>
  r.duration_minutes
    ? `${r.duration_minutes} min ${r.format === "video" ? "watch" : r.format === "audio" ? "listen" : "read"}`
    : formats[r.format];
export function uploadFile(
  url: string,
  file: File,
  onProgress: (progress: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader(
      "Content-Type",
      file.type || "application/octet-stream",
    );
    xhr.setRequestHeader("x-upsert", "false");
    xhr.timeout = 600000;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable)
        onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error("Upload failed. Please retry with the same file."));
    xhr.onerror = () =>
      reject(new Error("Connection lost during upload. Please retry."));
    xhr.ontimeout = () =>
      reject(
        new Error("Upload timed out. Please retry on a faster connection."),
      );
    xhr.send(file);
  });
}
