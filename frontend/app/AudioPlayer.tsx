"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import styles from "./audio-player.module.css";

const audioSource =
  "/audio/Make It Count! - The Most Powerful Sports Motivational Speech Ever!.mp3";

export default function AudioPlayer() {
  const audio = useRef<HTMLAudioElement>(null);
  const attempted = useRef(false);
  const pathname = usePathname();
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.35);
  const [message, setMessage] = useState("Motivation for your journey");

  useEffect(() => {
    const media = audio.current!;
    try {
      const saved = localStorage.getItem("playverified-audio-volume");
      if (saved !== null && Number.isFinite(Number(saved))) {
        const value = Math.max(0, Math.min(1, Number(saved)));
        media.volume = value;
        setVolume(value);
      } else media.volume = 0.35;
    } catch {
      media.volume = 0.35;
    }
    return () => media.pause();
  }, []);

  useEffect(() => {
    const media = audio.current!;
    if (pathname !== "/") {
      media.pause();
      return;
    }
    if (attempted.current) return;
    attempted.current = true;
    let disposed = false;
    const stopListening = () => {
      document.removeEventListener("click", startOnInteraction);
      document.removeEventListener("keydown", startOnInteraction);
    };
    const startOnInteraction = (event: Event) => {
      // The player's own controls handle their interaction directly.
      if (
        (event.target as Element)?.closest?.(
          '[aria-label="Motivational audio player"]',
        )
      )
        return;
      stopListening();
      void media.play().catch(() => {
        if (!disposed) setMessage("Press play to listen");
      });
    };
    media.addEventListener("play", stopListening);
    void media.play().catch((error: DOMException) => {
      if (disposed) return;
      if (error.name === "NotAllowedError") {
        setMessage("Press play to listen");
        document.addEventListener("click", startOnInteraction);
        document.addEventListener("keydown", startOnInteraction);
      } else if (error.name !== "AbortError")
        setMessage("Audio unavailable. Try again.");
    });
    return () => {
      disposed = true;
      stopListening();
      media.removeEventListener("play", stopListening);
    };
  }, [pathname]);

  async function toggle() {
    const media = audio.current!;
    if (!media.paused) {
      media.pause();
      return;
    }
    try {
      await media.play();
    } catch {
      setMessage("Unable to play. Please try again.");
    }
  }

  return (
    <aside
      className={styles.player}
      aria-label="Motivational audio player"
      hidden={pathname !== "/"}
    >
      <audio
        ref={audio}
        src={audioSource}
        preload="metadata"
        onPlay={() => {
          setPlaying(true);
          setMessage("Now playing");
        }}
        onPause={() => {
          setPlaying(false);
          setMessage("Paused");
        }}
        onEnded={() => {
          setPlaying(false);
          setMessage("Play again");
        }}
        onError={() => {
          setPlaying(false);
          setMessage("Audio unavailable. Try again.");
        }}
      />
      <button
        type="button"
        className={styles.play}
        onClick={() => void toggle()}
        aria-label={
          playing ? "Pause motivational audio" : "Play motivational audio"
        }
      >
        {playing ? (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M7 5h4v14H7zm6 0h4v14h-4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M8 4v16l13-8z" />
          </svg>
        )}
      </button>
      <div className={styles.track}>
        <strong>Make It Count!</strong>
        <span role="status">{message}</span>
      </div>
      <label className={styles.volume}>
        <span>Volume</span>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={Math.round(volume * 100)}
          aria-label="Audio volume"
          onChange={(event) => {
            const value = Number(event.target.value) / 100;
            audio.current!.volume = value;
            setVolume(value);
            try {
              localStorage.setItem("playverified-audio-volume", String(value));
            } catch {
              /* Storage can be unavailable. */
            }
          }}
        />
      </label>
    </aside>
  );
}
