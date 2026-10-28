import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./config/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm near-black ink: heading text + the dark brand surface.
        ink: {
          DEFAULT: "#1A1713",
          900: "#121009",
          800: "#1A1713",
          700: "#2A251D",
          600: "#3A342A",
          500: "#4E463A",
        },
        // Fen green: muted, deep, used sparingly. 300 is the light sage tone
        // for accent text ON dark ink surfaces (the deep green fails contrast there).
        accent: {
          DEFAULT: "#1F6B4E",
          300: "#A7C9B6",
          500: "#1F6B4E",
          600: "#185A41",
          700: "#124733",
          ink: "#F7F5F0", // text ON the deep green
          soft: "#E7EFE9",
        },
        // Warm off-white paper, matching the logo background.
        paper: {
          DEFAULT: "#F7F5F0",
          alt: "#EFEBE3",
        },
        // Warm neutral ramp (still keyed `stone` so existing classes just re-tint).
        stone: {
          50: "#F5F3EE",
          100: "#EAE6DE",
          200: "#DAD4C8",
          300: "#C0B8A8",
          400: "#9A9081",
          500: "#6E665A",
          600: "#5A5348",
          700: "#403A31",
          800: "#2B261F",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,23,19,0.04), 0 14px 34px -20px rgba(26,23,19,0.28)",
        lift: "0 40px 80px -32px rgba(26,23,19,0.45)",
        tight: "0 1px 2px rgba(26,23,19,0.10), 0 2px 10px -4px rgba(26,23,19,0.16)",
        soft: "0 16px 40px -18px rgba(26,23,19,0.35)",
      },
      borderRadius: {
        xl2: "1.5rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "blink": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.85)", opacity: "0.7" },
          "100%": { transform: "scale(1.7)", opacity: "0" },
        },
        "bubble-in": {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        // Hero ledger: the fix written in, settling out of a slight blur.
        "ink-in": {
          "0%": { opacity: "0", filter: "blur(4px)", transform: "translateY(3px)" },
          "100%": { opacity: "1", filter: "blur(0)", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "blink": "blink 1s steps(1) infinite",
        "pulse-ring": "pulse-ring 1.8s ease-out infinite",
        "bubble-in": "bubble-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "ink-in": "ink-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
