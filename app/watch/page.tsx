"use client";

export default function WatchPage() {
  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center">
      <video
        autoPlay
        controls
        playsInline
        className="w-full h-full object-cover"
      >
        <source src="/videos/unlock.mp4" type="video/mp4" />
      </video>
    </div>
  );
}
