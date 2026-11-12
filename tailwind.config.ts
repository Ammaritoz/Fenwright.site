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
        // Deep navy ink: heading text on light surfaces + the dark brand surface.
        ink: {
          DEFAULT: "#07182A",
          900: "#040E1C",
          800: "#07182A",
          700: "#0E2439",
          600: "#17334E",
          500: "#254A6B",
        },
        // Fen green, the single accent. DEFAULT is for light surfaces; 300 is
        // the mint tone for accent text ON navy (the deep green fails contrast there).
        accent: {
          DEFAULT: "#1F6B4E",
          300: "#7FD1AE",
          500: "#1F6B4E",
          600: "#185A41",
          700: "#124733",
          ink: "#FFFFFF", // text ON the deep green
          soft: "#E6F2EC",
        },
        // Light surface: white, with a cool grey alternate.
        paper: {
          DEFAULT: "#FFFFFF",
          alt: "#F2F4F7",
        },
        // Cool slate ramp (still keyed `stone` so existing classes just re-tint).
        stone: {
          50: "#F5F7FA",
          100: "#E9EDF2",
          200: "#D8DEE7",
          300: "#B8C2D0",
          400: "#8A97AA",
          500: "#5F6C80",
          600: "#4A566A",
          700: "#344054",
          800: "#1F2A3C",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      // Flat by design: hairlines and tone carry depth, not drop shadows.
      boxShadow: {
        card: "0 1px 2px rgba(7,24,42,0.04)",
        lift: "0 30px 70px -40px rgba(7,24,42,0.45)",
        tight: "0 1px 2px rgba(7,24,42,0.06)",
        soft: "0 12px 32px -20px rgba(7,24,42,0.30)",
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
        // Hero backdrop: a very slow push-in so a still frame never sits dead.
        "drift": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.08)" },
        },
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
        "drift": "drift 24s ease-out both",
        "ink-in": "ink-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
