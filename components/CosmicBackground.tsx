"use client";

import { useMemo } from "react";

type Particle = {
  id: number;
  top: number;
  left: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
};

export default function CosmicBackground() {
  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 70 }).map((_, i) => ({
        id: i,
        top: Math.random() * 100, // in vh-ish
        left: Math.random() * 100,
        size: 2 + Math.random() * 3,
        delay: Math.random() * 10,
        duration: 12 + Math.random() * 10,
        opacity: 0.15 + Math.random() * 0.4,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* subtle radial glows */}
      <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full bg-cyan-400/20 blur-3xl" />

      {/* floating dust particles */}
      {particles.map((p) => (
        <span
          key={p.id}
          className="cosmic-particle absolute rounded-full bg-cyan-100"
          style={{
            top: `${p.top}vh`,
            left: `${p.left}vw`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}

      {/* holo panels */}
      <div className="cosmic-holo-panel absolute top-[15%] left-[8%] w-40 h-24 border border-violet-300/30 rounded-2xl bg-gradient-to-br from-violet-500/10 via-transparent to-cyan-500/10 backdrop-blur-sm" />
      <div className="cosmic-holo-panel absolute bottom-[12%] right-[10%] w-48 h-28 border border-cyan-300/30 rounded-2xl bg-gradient-to-tr from-cyan-500/10 via-transparent to-fuchsia-500/10 backdrop-blur-sm" />

      {/* vertical holo line */}
      <div className="cosmic-holo-line absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-violet-400/40 to-transparent" />
    </div>
  );
}
