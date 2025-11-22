"use client";

import { useEffect } from "react";

export default function ScanPage({ searchParams }) {
  const scanEventId = searchParams.event;

  useEffect(() => {
    async function gatherSecondData() {
      const geo = await new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }),
          () => resolve(null)
        );
      });

      const battery =
        navigator.getBattery
          ? await navigator.getBattery().then((b) => ({
              level: b.level,
              charging: b.charging,
            }))
          : null;

      const secondData = {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screen: {
          width: window.screen.width,
          height: window.screen.height,
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        geolocation: geo,
        battery,
        timestamp: new Date().toISOString(),
      };

      await fetch("/api/scan/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanEventId,
          secondData,
        }),
      });

      // redirect user to unlocked content
      window.location.href = `/watch?event=${scanEventId}`;
    }

    gatherSecondData();
  }, []);

  return (
    <div className="h-screen w-screen bg-black text-white flex items-center justify-center">
      <p className="text-lg opacity-80">Processing your scan…</p>
    </div>
  );
}
