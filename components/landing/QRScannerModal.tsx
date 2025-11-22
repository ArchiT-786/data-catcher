"use client";

import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useRef } from "react";

export default function QRScannerModal({
  onClose,
  extraData
}: {
  onClose: () => void;
  extraData: any;
}) {
  const scannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    const scanner = new Html5QrcodeScanner("qr-reader", {
      fps: 10,
      qrbox: 250
    });

    scanner.render(
      async (decodedText) => {
        // send scan + extra device info to backend
        await fetch("/api/saveUserInfo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scanData: decodedText,
            extraDeviceInfo: extraData,
            timestamp: new Date().toISOString()
          }),
        });

        scanner.clear();
        onClose();
      },
      () => {}
    );

    return () => scanner.clear();
  }, []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl flex items-center justify-center z-50">
      <div className="bg-black/40 border border-white/20 rounded-2xl p-6 w-[90%] max-w-md text-center text-white shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Scan the QR Code</h2>

        <div id="qr-reader" className="rounded-lg overflow-hidden" />

        <button
          onClick={onClose}
          className="mt-6 px-6 py-2 rounded-full bg-white/10 border border-white/20"
        >
          Close
        </button>
      </div>
    </div>
  );
}
