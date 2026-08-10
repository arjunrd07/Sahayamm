import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          hover: "#1D4ED8",
          light: "#3B82F6",
          soft: "#EFF6FF",
        },
        canvas: {
          DEFAULT: "#F7F9FC",
          cloud: "#F7F9FC",
          dark: "#0F172A",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          paper: "#FFFFFF",
          pebble: "#F1F5F9",
          dark: "#1E293B",
          border: "#E5E7EB",
          hairline: "rgba(15, 23, 42, 0.06)",
          "border-dark": "rgba(255, 255, 255, 0.1)",
        },
        ink: {
          DEFAULT: "#0F172A",
          navy: "#0F172A",
          slate: "#64748B",
          mist: "#94A3B8",
          carbon: "#020617",
          dark: "#F8FAFC",
        },
        signal: {
          DEFAULT: "#2563EB",
          blue: "#2563EB",
          hover: "#1D4ED8",
          soft: "#EFF6FF",
          cobalt: "#1E40AF",
        },
        success: { DEFAULT: "#22C55E", soft: "#F0FDF4" },
        warning: { DEFAULT: "#F59E0B", soft: "#FFFBEB" },
        danger: { DEFAULT: "#EF4444", soft: "#FEF2F2" },
        info: { DEFAULT: "#0EA5E9", soft: "#F0F9FF" },
        muted: { DEFAULT: "#64748B" },
      },
      backgroundImage: {
        hero: "linear-gradient(135deg, #2563EB 0%, #3B82F6 60%, #60A5FA 100%)",
        primary: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
        card: "linear-gradient(180deg, #FFFFFF 0%, #F7F9FC 100%)",
        "card-dark": "linear-gradient(180deg, #1E293B 0%, #0F172A 100%)",
        "emerald-gradient": "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
      },
      fontFamily: {
        sans: [
          "Inter",
          "Manrope",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        sm: "8px",
        md: "8px",
        lg: "8px",
        xl: "8px",
        "2xl": "8px",
        "3xl": "8px",
        "4xl": "8px",
        full: "9999px",
      },
      boxShadow: {
        card: "0 20px 40px rgba(15, 23, 42, 0.06)",
        "card-hover": "0 30px 60px rgba(15, 23, 42, 0.12)",
        button: "0 10px 30px rgba(37, 99, 235, 0.20)",
        glow: "0 0 30px rgba(37, 99, 235, 0.30)",
        elevated: "0 20px 40px rgba(15, 23, 42, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
