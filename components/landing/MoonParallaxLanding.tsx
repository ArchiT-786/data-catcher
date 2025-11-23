"use client";

import { motion } from "framer-motion";
import { useState } from "react";

export default function MoonParallaxLanding({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black text-white">
      
      {/* PARALLAX BACKGROUND */}
      <motion.div
        className="absolute inset-0 bg-[url('/images/background-landing.jpg')] bg-cover bg-center"
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{
          duration: 6,
          ease: "easeOut",
        }}
      />

      {/* Parallax fog layers */}
      <motion.div
        className="absolute inset-0 bg-[url('/images/fog-layer.png')] bg-cover bg-center opacity-40"
        animate={{ x: ["0%", "2%", "0%"] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* CONTENT */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="relative z-10 text-center px-6"
      >
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          Step Inside The  
          <span className="block bg-gradient-to-r from-violet-400 to-cyan-300 bg-clip-text text-transparent">
            Cosmic Analyzer
          </span>
        </h1>

        <p className="max-w-2xl mx-auto text-gray-300 mb-10 text-lg">
          A futuristic scanner that reads your vibe, your energy and your dreams.
          Not AI, not magic — just ✨delusion with good branding.
        </p>

        <motion.button
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.96 }}
          onClick={onStart}
          className="px-10 py-4 text-lg rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 shadow-lg shadow-violet-500/30 hover:brightness-110 transition"
        >
          Enter the Scanner →
        </motion.button>
      </motion.div>
    </div>
  );
}
