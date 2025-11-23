"use client";

import { useState } from "react";
import CursorGlow from "@/components/CursorGlow";
import MotivationExperience from "@/components/landing/MotivationExperience";
import MoonParallaxLanding from "@/components/landing/MoonParallaxLanding";
import CosmicBackground from "@/components/CosmicBackground";

export default function IndexPage() {
  const [started, setStarted] = useState(false);

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* GLOBAL CURSOR EFFECT */}
      <CursorGlow />

      {/* GLOBAL COSMIC PARTICLES + HOLOGRAMS */}
      <CosmicBackground />

      {/* PAGE CONTENT */}
      {!started ? (
        <MoonParallaxLanding onStart={() => setStarted(true)} />
      ) : (
        <MotivationExperience />
      )}
    </div>
  );
}
