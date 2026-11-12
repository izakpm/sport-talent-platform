import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ResourceLibrary from "./ResourceLibrary";
import ResourceCard from "./ResourceCard";
import ResourceEditor from "./ResourceEditor";
import ResourceViewer, { embedUrl } from "./ResourceViewer";
import { resources, uploadFile, type Resource } from "./api";
const replace = jest.fn();
let routeId = "new";
jest.mock("next/navigation", () => ({
  useParams: () => ({ id: routeId }),
  useRouter: () => ({ replace }),
}));
jest.mock("./api", () => ({
  ...jest.requireActual("./api"),
  resources: jest.fn(),
  uploadFile: jest.fn(),
}));
const api = resources as jest.Mock;
it("plays inside the card and stops the previous video", async () => {
  api.mockImplementation(async () => ({
    ...row,
    media_url: "https://storage.example/video.mp4",
    transcript: "Transcript",
  }));
  const { container } = render(
    <>
      <ResourceCard resource={row} />
      <ResourceCard resource={{ ...row, id: "two", title: "Second video" }} />
    </>,
  );
  expect(api).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: `Watch video: ${row.title}` }),
  );
  await waitFor(() =>
    expect(container.querySelector("video")).toHaveAttribute(
      "src",
      "https://storage.example/video.mp4",
    ),
  );
  expect(api).toHaveBeenCalledWith("/one");
  expect(container.querySelector("video")).toHaveAttribute("controls");
  expect(screen.getByText("Read transcript")).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: row.title }),
  ).not.toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Watch video: Second video" }),
  );
  await waitFor(() =>
    expect(container.querySelector("video")).toHaveAttribute(
      "aria-label",
      "Second video",
    ),
  );
  expect(container.querySelectorAll("video")).toHaveLength(1);
});
it("retries inline playback after a failed request", async () => {
  api.mockRejectedValueOnce(new Error("Offline")).mockResolvedValueOnce(row);
  render(<ResourceCard resource={row} />);
  fireEvent.click(
    screen.getByRole("button", { name: `Watch video: ${row.title}` }),
  );
  await screen.findByRole("alert");
  fireEvent.click(
    screen.getByRole("button", { name: `Retry video: ${row.title}` }),
  );
  expect(await screen.findByTitle(row.title)).toHaveAttribute(
    "src",
    expect.stringContaining("youtube-nocookie.com"),
  );
});
const row: Resource = {
  id: "one",
  title: "Match-day mindset",
  summary: "Prepare for your next match.",
  topic: "mindset",
  format: "video",
  author: "Coach",
  duration_minutes: 8,
  status: "published",
  featured: true,
  version: 1,
  source_url: "https://youtu.be/abcdefghijk",
};
beforeEach(() => {
  jest.clearAllMocks();
  routeId = "new";
});
it("shows a featured resource and read-only cards with topic and format filtering", async () => {
  api.mockResolvedValue({
    items: [row],
    featured: row,
    total: 1,
    next_offset: null,
  });
  render(<ResourceLibrary />);
  expect(await screen.findByText("FEATURED RESOURCE")).toBeInTheDocument();
  expect(screen.queryByText("+ Add resource")).not.toBeInTheDocument();
  expect(
    screen.getAllByRole("button", { name: `Watch video: ${row.title}` }),
  ).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "Nutrition" }));
  fireEvent.change(screen.getByLabelText("Format"), {
    target: { value: "audio" },
  });
  await waitFor(() =>
    expect(api).toHaveBeenLastCalledWith(
      expect.stringContaining("topic=nutrition&format=audio"),
    ),
  );
});
it("shows an honest empty state and no fabricated resources", async () => {
  api.mockResolvedValue({
    items: [],
    featured: null,
    total: 0,
    next_offset: null,
  });
  render(<ResourceLibrary />);
  await screen.findByText("Your next edge is on its way.");
  expect(screen.queryByText("FEATURED RESOURCE")).not.toBeInTheDocument();
});
it("keeps upload controls out of unauthorized hands", async () => {
  api.mockResolvedValue({ can_publish: false });
  render(<ResourceEditor />);
  await screen.findByRole("alert");
  expect(screen.queryByLabelText("Title")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Publish resource" }),
  ).not.toBeInTheDocument();
});
it("saves a draft before publishing and preserves input on failed save", async () => {
  api.mockImplementation(async (path, method, body) =>
    path === "/capabilities"
      ? { can_publish: true, uploads_configured: true }
      : method === "POST" && path === "/admin"
        ? { ...row, status: "draft", ...body, version: 1 }
        : { ...row, version: 2 },
  );
  render(<ResourceEditor />);
  fireEvent.change(await screen.findByLabelText("Title"), {
    target: { value: "My new video" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Publish resource" }));
  await waitFor(() =>
    expect(api).toHaveBeenCalledWith("/admin/one/publish", "POST", {
      action: "publish",
      version: 1,
    }),
  );
  expect(replace).toHaveBeenCalledWith("/dashboard/resources-admin/one");
});
it("preserves the editor on API failure", async () => {
  api
    .mockResolvedValueOnce({ can_publish: true, uploads_configured: true })
    .mockRejectedValue(new Error("Unable to save"));
  render(<ResourceEditor />);
  fireEvent.change(await screen.findByLabelText("Title"), {
    target: { value: "Keep my work" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
  await screen.findByText("Unable to save");
  expect(screen.getByLabelText("Title")).toHaveValue("Keep my work");
});
it("uploads directly using a signed ticket and attaches the completed file", async () => {
  routeId = "one";
  const draft = { ...row, status: "draft" };
  api.mockImplementation(async (path) =>
    path === "/capabilities"
      ? { can_publish: true, uploads_configured: true }
      : path.endsWith("/uploads")
        ? { id: "asset", url: "https://storage.example/upload" }
        : { ...draft, version: path.endsWith("/complete") ? 2 : 1 },
  );
  (uploadFile as jest.Mock).mockResolvedValue(undefined);
  render(<ResourceEditor />);
  const file = new File(["video"], "practice.mp4", { type: "video/mp4" });
  fireEvent.change(await screen.findByLabelText("Upload media"), {
    target: { files: [file] },
  });
  await screen.findByText("File uploaded and attached to this draft.");
  expect(uploadFile).toHaveBeenCalledWith(
    "https://storage.example/upload",
    file,
    expect.any(Function),
  );
  expect(api).toHaveBeenCalledWith(
    "/admin/one/uploads/asset/complete",
    "POST",
    { version: 1 },
  );
});
it("only embeds recognised providers and starts playback on request", () => {
  expect(
    embedUrl("https://youtube.com.evil.test/watch?v=abcdefghijk"),
  ).toBeNull();
  expect(embedUrl("javascript:alert(1)")).toBeNull();
  render(<ResourceViewer resource={row} />);
  expect(screen.queryByTitle(row.title)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Watch video" }));
  expect(screen.getByTitle(row.title)).toHaveAttribute(
    "src",
    "https://www.youtube-nocookie.com/embed/abcdefghijk?autoplay=1",
  );
});
it("renders article content as text rather than executable markup", () => {
  render(
    <ResourceViewer
      resource={{
        ...row,
        format: "article",
        body: "<script>alert(1)</script>",
      }}
    />,
  );
  expect(screen.getByText("<script>alert(1)</script>")).toBeInTheDocument();
});
