import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0b3558", // Ink Navy — primary text & headings
          navy: "#0b3558",
          slate: "#476788", // Slate Gray — secondary text & labels
          mist: "#94a3b8",  // Mist Gray — muted text
          carbon: "#0a0a0a",
          dark: "#f8fafc",   // Soft light text in dark mode
        },
        signal: {
          DEFAULT: "#006bff", // Signal Blue — primary CTA
          blue: "#006bff",
          hover: "#0059d6",
          soft: "#e6f0ff",   // Soft blue tint
          cobalt: "#004eba", // Deep cobalt
        },
        brand: {
          emerald: "#14b8a6",
          emeraldSoft: "#ecfeff",
          emeraldDark: "#042f2e",
        },
        canvas: {
          DEFAULT: "#f8f9fb", // Cloud background
          cloud: "#f8f9fb",
          dark: "#0f172a",   // Slate-900 Rich Navy Canvas
        },
        surface: {
          DEFAULT: "#ffffff", // Paper card surface
          paper: "#ffffff",
          pebble: "#f0f3f8",  // Subtle pebble gray
          dark: "#1e293b",   // Slate-800 Card & Input Surface
          border: "#e2e8f0",  // Hairline light border
          hairline: "#e2e8f0",
          "border-dark": "#334155", // Slate-700 Hairline dark border
        },
        glass: {
          light: "rgba(255, 255, 255, 0.75)",
          dark: "rgba(30, 41, 59, 0.85)",
        },
        accent: {
          DEFAULT: "#006bff",
          hover: "#0059d6",
          soft: "#e6f0ff",
          magenta: "#e55cff",
          cyan: "#0099ff",
        },
        success: { DEFAULT: "#10b981", soft: "#ecfdf5" },
        warning: { DEFAULT: "#f59e0b", soft: "#fffbeb" },
        danger: { DEFAULT: "#ef4444", soft: "#fef2f2" },
        muted: { DEFAULT: "#476788" },
      },
      backgroundImage: {
        hero: "linear-gradient(135deg, #006bff 0%, #3b82f6 60%, #7dd3fc 100%)",
        primary: "linear-gradient(90deg, #006bff 0%, #0059d6 100%)",
        card: "linear-gradient(180deg, #ffffff 0%, #f8f9fb 100%)",
        "card-dark": "linear-gradient(180deg, #1e293b 0%, #0f172a 100%)",
        "emerald-gradient": "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      },
      fontFamily: {
        sans: [
          "Manrope",
          "Gilroy",
          "Inter",
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
        sm: "6px",
        md: "8px",
        lg: "10px",
        xl: "12px",     // 12px Button & Input radius
        "2xl": "20px",   // 20px Card radius
        "3xl": "28px",   // 28px Modal radius
        full: "9999px",
      },
      boxShadow: {
        card: "0 1px 3px rgba(0, 0, 0, 0.05), 0 8px 24px rgba(0, 0, 0, 0.06)",
        elevated: "0 10px 40px rgba(0, 0, 0, 0.08)",
        button: "0 4px 14px rgba(0, 107, 255, 0.25)",
        glow: "0 0 25px rgba(0, 107, 255, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
