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
        // Deep ink navy: dominant brand surface + heading ink.
        ink: {
          DEFAULT: "#0E1526",
          900: "#090E1B",
          800: "#0E1526",
          700: "#17203A",
          600: "#212C4B",
          500: "#33406A",
        },
        // Electric emerald: the "live / GO" signal. CTAs, highlights, indicators.
        accent: {
          DEFAULT: "#22E39A",
          500: "#22E39A",
          600: "#13C685",
          700: "#0E9E6B",
          ink: "#053B29", // deep green for text ON emerald where needed
          soft: "#D6FBEC",
        },
        // Cool off-white background, tinted toward the navy hue (NOT warm cream).
        paper: {
          DEFAULT: "#F4F6FB",
          alt: "#E8ECF5",
        },
        // Cool neutral ramp for text + borders (navy-tinted, not warm). Keyed as
        // `stone` (overriding Tailwind's warm default) so existing classes cool down.
        stone: {
          50: "#F1F4FA",
          100: "#E4E9F3",
          200: "#D2DAE8",
          300: "#B4BFD3",
          400: "#8B98B2",
          500: "#5B667F",
          600: "#4A5670",
          700: "#333E56",
          800: "#212B41",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(14,21,38,0.04), 0 14px 34px -20px rgba(14,21,38,0.28)",
        lift: "0 40px 80px -32px rgba(14,21,38,0.45)",
        tight: "0 1px 2px rgba(14,21,38,0.10), 0 2px 10px -4px rgba(14,21,38,0.16)",
        emerald: "0 16px 40px -18px rgba(19,198,133,0.55)",
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
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "blink": "blink 1s steps(1) infinite",
        "pulse-ring": "pulse-ring 1.8s ease-out infinite",
        "bubble-in": "bubble-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;
