import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AudioPlayer from "./AudioPlayer";

let pathname = "/";
jest.mock("next/navigation", () => ({ usePathname: () => pathname }));
beforeEach(() => {
  localStorage.clear();
  pathname = "/";
});
afterEach(() => jest.restoreAllMocks());

it("offers play when autoplay is blocked, then supports playback, pause and volume", async () => {
  const play = jest
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockRejectedValueOnce(new DOMException("Blocked", "NotAllowedError"))
    .mockImplementation(function (this: HTMLMediaElement) {
      Object.defineProperty(this, "paused", {
        configurable: true,
        value: false,
      });
      this.dispatchEvent(new Event("play"));
      return Promise.resolve();
    });
  const pause = jest
    .spyOn(HTMLMediaElement.prototype, "pause")
    .mockImplementation(function (this: HTMLMediaElement) {
      Object.defineProperty(this, "paused", {
        configurable: true,
        value: true,
      });
      this.dispatchEvent(new Event("pause"));
    });
  const { container } = render(<AudioPlayer />);
  expect(await screen.findByText("Press play to listen")).toBeVisible();
  fireEvent.click(
    screen.getByRole("button", { name: "Play motivational audio" }),
  );
  expect(
    await screen.findByRole("button", { name: "Pause motivational audio" }),
  ).toBeVisible();
  fireEvent.change(screen.getByRole("slider", { name: "Audio volume" }), {
    target: { value: "20" },
  });
  expect(container.querySelector("audio")!.volume).toBe(0.2);
  expect(localStorage.getItem("playverified-audio-volume")).toBe("0.2");
  fireEvent.click(
    screen.getByRole("button", { name: "Pause motivational audio" }),
  );
  expect(pause).toHaveBeenCalled();
  expect(play).toHaveBeenCalledTimes(2);
  expect(
    screen.getByRole("button", { name: "Play motivational audio" }),
  ).toBeVisible();
});

it("restores volume and pauses for authentication without restarting on return", async () => {
  localStorage.setItem("playverified-audio-volume", "0.6");
  const play = jest
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockResolvedValue();
  const pause = jest
    .spyOn(HTMLMediaElement.prototype, "pause")
    .mockImplementation(() => {});
  const { container, rerender } = render(<AudioPlayer />);
  await waitFor(() => expect(play).toHaveBeenCalledTimes(1));
  expect(container.querySelector("audio")!.volume).toBe(0.6);
  pathname = "/login";
  rerender(<AudioPlayer />);
  expect(pause).toHaveBeenCalled();
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  pathname = "/";
  rerender(<AudioPlayer />);
  expect(play).toHaveBeenCalledTimes(1);
});

it("retries blocked autoplay on the first page interaction only", async () => {
  const play = jest
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockRejectedValueOnce(new DOMException("Blocked", "NotAllowedError"))
    .mockResolvedValue();
  jest.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
  render(<AudioPlayer />);
  await screen.findByText("Press play to listen");
  fireEvent.click(document.body);
  expect(play).toHaveBeenCalledTimes(2);
  fireEvent.click(document.body);
  fireEvent.keyDown(document.body, { key: "Enter" });
  expect(play).toHaveBeenCalledTimes(2);
});
