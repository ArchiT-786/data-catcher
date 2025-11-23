"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";

export default function HomeWithQR() {
  const router = useRouter();
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const collectPrimaryData = async () => {
    const device = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screen: {
        width: window.screen.width,
        height: window.screen.height,
      },
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    const res = await fetch("/api/scan/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(device),
    });

    const json = await res.json();

    if (json?.scanEventId) {
      const url = `${window.location.origin}/watch`;
      setQrUrl(url);
    }
  };

  const handleGetStarted = async () => {
    setLoading(true);
    await collectPrimaryData();
    setLoading(false);
  };

  return (
    <div
      className="relative h-screen w-screen overflow-hidden bg-black text-white"
      style={{
        backgroundImage: "url('/images/background-landing.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-10">

        {/* QR / Start Button */}
        {!qrUrl ? (
          <motion.button
            onClick={handleGetStarted}
            disabled={loading}
            className="relative px-10 py-4 text-lg font-semibold rounded-full border border-white/30 
            bg-white/10 shadow-[0_0_40px_rgba(255,255,255,0.4)] backdrop-blur-xl overflow-hidden"
            whileHover={{ scale: 1.07 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.7),transparent,rgba(255,255,255,0.7))]"
              initial={{ x: "-140%" }}
              animate={{ x: ["-140%", "140%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />

            <span className="relative z-10">
              {loading ? "Processing..." : "Get Started"}
            </span>
          </motion.button>
        ) : (
          <div className="bg-white p-6 rounded-2xl shadow-xl">
            <QRCode value={qrUrl} size={220} />
          </div>
        )}

        {/* ✅ Skip button ALWAYS visible */}
        <button
          onClick={() => router.push("/magic-experience")}
          className="px-6 py-3 rounded-xl border border-white/40 bg-white/10 hover:bg-white/20 text-white text-lg transition"
        >
          Skip & Continue →
        </button>

      </div>
    </div>
  );
}
