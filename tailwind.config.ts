import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#04141b",
          900: "#08222e",
          800: "#0d3040",
          700: "#134152",
        },
        teal: {
          50: "#e9fbf8",
          100: "#c9f5ee",
          200: "#96ebe0",
          300: "#5cdccd",
          400: "#2ec4b6",
          500: "#14a89a",
          600: "#0d8a80",
          700: "#0f6e68",
          800: "#115853",
          900: "#124a47",
        },
        amber: {
          50: "#fff8ed",
          100: "#ffedcf",
          200: "#ffd89e",
          300: "#ffbe63",
          400: "#ffa02e",
          500: "#f9820a",
          600: "#dd6302",
          700: "#b74806",
        },
        sand: {
          50: "#fbfaf7",
          100: "#f5f2ea",
          200: "#eae4d5",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        arabic: ["var(--font-arabic)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(46,196,182,0.18), 0 20px 60px -18px rgba(20,168,154,0.45)",
        card: "0 1px 2px rgba(8,34,46,0.04), 0 12px 32px -16px rgba(8,34,46,0.18)",
        float: "0 30px 80px -30px rgba(8,34,46,0.35)",
      },
      backgroundImage: {
        aurora:
          "radial-gradient(60% 60% at 20% 20%, rgba(46,196,182,0.35), transparent 60%), radial-gradient(50% 50% at 80% 30%, rgba(249,130,10,0.22), transparent 60%), radial-gradient(60% 60% at 60% 90%, rgba(19,65,82,0.55), transparent 60%)",
        grid:
          "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-14px)" },
        },
        shimmer: { "100%": { transform: "translateX(100%)" } },
        auroraShift: {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "50%": { transform: "translate3d(2%,-2%,0) scale(1.08)" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.8)", opacity: "0.7" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        riseIn: {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.2s infinite",
        aurora: "auroraShift 14s ease-in-out infinite",
        pulseRing: "pulseRing 2.4s ease-out infinite",
        marquee: "marquee 32s linear infinite",
        riseIn: "riseIn 0.7s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
