"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Stage = "intro" | "form" | "calculating" | "result";

type Result = {
  id: string;
  score: number;
  title: string;
  message: string;
};

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  about: "",
  dream: "",
};

export default function MotivationExperience() {
  const [stage, setStage] = useState<Stage>("intro");
  const [form, setForm] = useState(initialForm);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Cursor glow effect
  const cursorRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = cursorRef.current;
    if (!el) return;

    const handler = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      el.style.transform = `translate(${x - 80}px, ${y - 80}px)`;
    };

    window.addEventListener("pointermove", handler);
    return () => window.removeEventListener("pointermove", handler);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setImageBase64(base64);
      setPreviewUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // ---- REQUIRED IMAGE CHECK ----
    if (!imageBase64) {
      setError("Please upload a photo before running the scan.");
      return;
    }
    // -------------------------------

    setStage("calculating");
    setLoading(true);

    try {
      const res = await fetch("/api/motivation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          imageBase64,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit form");
      }

      const data = await res.json();
      setResult(data);
      setStage("result");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
      setStage("form");
    } finally {
      setLoading(false);
    }
  };

  const requiredFields = [
    form.fullName,
    form.email,
    form.phone,
    form.about,
    form.dream,
  ];
  const completedCount = requiredFields.filter((v) => v.trim().length > 0).length;
  const progress = Math.round((completedCount / requiredFields.length) * 100);
  const progressLabel =
    progress === 0
      ? "Scan idle"
      : progress < 40
      ? "Specimen detected..."
      : progress < 80
      ? "Brain patterns syncing..."
      : progress < 100
      ? "Finalizing human report..."
      : "Scan ready. Release results.";

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden bg-slate-950 text-white flex items-center justify-center px-4"
      style={{
        backgroundImage:
          "radial-gradient(circle at top, #4c1d95 0, transparent 55%), radial-gradient(circle at bottom, #0f766e 0, transparent 55%)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/80" />

      <div
        ref={cursorRef}
        className="pointer-events-none fixed top-0 left-0 w-40 h-40 rounded-full bg-violet-500/20 blur-3xl z-10"
      />

      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="w-full h-full bg-[radial-gradient(circle_at_center,#1f2937_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <div className="relative z-20 w-full max-w-5xl">
        <AnimatePresence mode="wait">
          {stage === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-6 max-w-3xl mx-auto"
            >
              <p className="text-xs tracking-[0.3em] text-violet-300 uppercase">
                COSMIC LAB · SCAN PROTOCOL 01
              </p>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Welcome to the{" "}
                <span className="text-violet-300">Human Vibe Scanner</span> 🧬
              </h1>
              <p className="text-gray-300">
                We'll analyze your face, your lore, and your main quest.
              </p>

              <motion.button
                onClick={() => setStage("form")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="mt-6 inline-flex items-center justify-center px-8 py-3 rounded-full bg-violet-500 hover:bg-violet-400 text-lg font-semibold shadow-lg shadow-violet-500/40 transition"
              >
                Enter the scan chamber →
              </motion.button>
            </motion.div>
          )}

          {stage === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.97 }}
              transition={{ duration: 0.4 }}
              className="bg-black/40 border border-violet-500/30 rounded-3xl p-6 md:p-8 backdrop-blur-2xl shadow-[0_0_60px_rgba(139,92,246,0.4)]"
            >
              <div className="flex flex-col md:flex-row gap-8">
                {/* LEFT SIDE PANEL */}
                <div className="md:w-1/3 space-y-6">
                  <div className="space-y-2">
                    <p className="text-xs tracking-[0.25em] text-violet-300 uppercase">
                      Step 1 · subject input
                    </p>
                    <h2 className="text-2xl font-semibold">
                      Who's entering the <span className="text-violet-300">simulation</span>?
                    </h2>
                    <p className="text-gray-300 text-sm">
                      Fill this out like a character creator.
                    </p>
                  </div>

                  <div className="relative mt-4 flex flex-col items-center">
                    <div className="relative w-32 h-32">
                      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-violet-500/60 via-transparent to-cyan-400/50 blur-lg" />
                      <div className="absolute inset-0 rounded-full border border-violet-400/60 animate-pulse" />
                      <div className="absolute inset-2 rounded-full bg-black/70 border border-white/10 overflow-hidden flex items-center justify-center text-xs text-gray-400">
                        {previewUrl ? (
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <>no face loaded</>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-3 px-4 py-2 rounded-full border border-violet-400/60 text-xs hover:bg-violet-500/20 transition"
                    >
                      {previewUrl ? "Change photo" : "Upload your face"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />

                    <p className="mt-2 text-[11px] text-gray-500">
                      Required for the vibe scan.
                    </p>
                  </div>

                  <div className="mt-6 space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-gray-400">
                      <span>{progressLabel}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ type: "spring", stiffness: 80, damping: 20 }}
                      />
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE FORM */}
                <form onSubmit={handleSubmit} className="md:w-2/3 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <InputField
                      label="Your full name"
                      required
                      value={form.fullName}
                      onChange={(v) => setForm((f) => ({ ...f, fullName: v }))}
                    />
                    <InputField
                      label="Email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(v) => setForm((f) => ({ ...f, email: v }))}
                    />
                    <InputField
                      label="Phone"
                      required
                      value={form.phone}
                      onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
                    />
                    <InputField
                      label="Location (optional)"
                      value={form.address}
                      onChange={(v) => setForm((f) => ({ ...f, address: v }))}
                    />
                  </div>

                  <TextareaField
                    label="Describe your character build"
                    required
                    placeholder="Coffee-fueled builder, part-time meme machine..."
                    value={form.about}
                    onChange={(v) => setForm((f) => ({ ...f, about: v }))}
                  />

                  <TextareaField
                    label="What's your current main quest?"
                    required
                    placeholder="Build a SaaS, escape 9–5..."
                    value={form.dream}
                    onChange={(v) => setForm((f) => ({ ...f, dream: v }))}
                  />

                  {error && <p className="text-sm text-red-400">{error}</p>}

                  <div className="flex items-center justify-between gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => setStage("intro")}
                      className="text-sm text-gray-300 hover:text-white"
                    >
                      ← Abort Mission
                    </button>

                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 hover:brightness-110 text-sm font-semibold shadow-md shadow-violet-500/40 disabled:opacity-60 disabled:cursor-not-allowed transition"
                    >
                      {loading ? "Sending to lab..." : "Run the vibe scan"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {stage === "calculating" && (
            <motion.div
              key="calculating"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-6 text-center"
            >
              <div className="relative w-48 h-48">
                <div className="absolute inset-0 rounded-full bg-violet-500/10 animate-ping" />
                <div className="absolute inset-4 rounded-full border-4 border-violet-400/60" />
                <div className="absolute inset-10 rounded-full bg-black/70 border border-violet-300/70 flex flex-col items-center justify-center text-xs text-violet-100 px-4 text-center">
                  <span className="mb-1 text-[10px] tracking-[0.3em] uppercase">
                    lab engine
                  </span>
                  <span className="text-sm font-semibold">Crunching your stats...</span>
                </div>
                <div className="absolute inset-4 rounded-full border-t-4 border-t-cyan-400 border-transparent animate-spin" />
              </div>

              <p className="text-lg text-gray-200 max-w-xl">
                Our AI scientists are zooming through your answers.
              </p>
            </motion.div>
          )}

          {stage === "result" && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.4 }}
              className="bg-black/60 border border-violet-500/40 rounded-3xl p-8 md:p-10 backdrop-blur-2xl shadow-[0_0_60px_rgba(139,92,246,0.6)]"
            >
              <p className="text-xs tracking-[0.3em] text-violet-300 uppercase text-center">
                COSMIC LAB · SUBJECT REPORT
              </p>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
                {/* LEFT — USER IMAGE */}
                <div className="flex justify-center">
                  {imageBase64 && (
                    <img
                      src={imageBase64}
                      alt="Uploaded Face"
                      className="w-64 h-64 md:w-80 md:h-80 rounded-2xl object-cover border border-violet-400/40 shadow-lg"
                    />
                  )}
                </div>

                {/* RIGHT — RESULT */}
                <div className="space-y-6 text-center md:text-left">
                  <div className="inline-flex items-end gap-2 mx-auto md:mx-0">
                    <span className="text-5xl font-extrabold text-violet-200">
                      {result.score}
                    </span>
                    <span className="text-gray-400 mb-2">/ 10 main character energy</span>
                  </div>

                  <p className="text-xl font-semibold text-violet-100">
                    {result.title}
                  </p>

                  <p className="text-gray-200 whitespace-pre-line">
                    {result.message}
                  </p>

                  <button
                    className="mt-4 px-6 py-3 rounded-full border border-violet-400/70 text-sm hover:bg-violet-500/20 transition"
                    onClick={() => {
                      setForm(initialForm);
                      setImageBase64(null);
                      setPreviewUrl(null);
                      setResult(null);
                      setStage("form");
                    }}
                  >
                    Run another scan
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

type InputProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
};

function InputField({ label, value, onChange, required, type = "text" }: InputProps) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-gray-300">
        {label}
        {required && " *"}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent placeholder:text-gray-500"
      />
    </label>
  );
}

type TextareaProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
};

function TextareaField({ label, value, onChange, required, placeholder }: TextareaProps) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-gray-300">
        {label}
        {required && " *"}
      </span>
      <textarea
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-sm h-24 resize-none focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent placeholder:text-gray-500"
      />
    </label>
  );
}
