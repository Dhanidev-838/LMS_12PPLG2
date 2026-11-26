"use client";

import { useEffect } from "react";

export default function PresenceHeartbeat() {
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    let visibilityHandler: (() => void) | undefined;
    let stopped = false;

    async function start() {
      try {
        const response = await fetch("/api/me");
        if (!response.ok || stopped) return;
        const { data } = await response.json();
        if (data?.role !== "GURU" && data?.role !== "SISWA") return;

        const heartbeat = () => {
          if (document.visibilityState === "visible") {
            void fetch("/api/presence", { method: "POST", keepalive: true });
          }
        };
        heartbeat();
        interval = setInterval(heartbeat, 60_000);
        visibilityHandler = heartbeat;
        document.addEventListener("visibilitychange", visibilityHandler);
      } catch {
        // Presence is best-effort; it should not affect page navigation.
      }
    }

    void start();
    return () => {
      stopped = true;
      if (interval) clearInterval(interval);
      if (visibilityHandler) document.removeEventListener("visibilitychange", visibilityHandler);
    };
  }, []);

  return null;
}
