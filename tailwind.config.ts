import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0b3558", // Ink Navy — primary text, headings, icons, dark CTAs
          navy: "#0b3558",
          slate: "#476788", // Slate Gray — secondary body copy, helper text, muted labels
          mist: "#a6bbd1",  // Mist Gray — disabled text, inactive feature labels
          carbon: "#0a0a0a",
        },
        signal: {
          DEFAULT: "#006bff", // Signal Blue — primary CTA fill, active nav, link accents
          blue: "#006bff",
          hover: "#0059d6",
          soft: "#e6f0ff",   // Pebble-tinted blue
          cobalt: "#004eba", // Deep Cobalt — badge text on Pebble fills
        },
        canvas: {
          DEFAULT: "#f8f9fb", // Cloud — page canvas, footer background, secondary surface
          cloud: "#f8f9fb",
          dark: "#071828",
        },
        surface: {
          DEFAULT: "#ffffff", // Paper — card surfaces, elevated panels
          paper: "#ffffff",
          pebble: "#f0f3f8",  // Pebble — badge backgrounds, input fills, subtle dividers
          dark: "#0d243a",
          border: "#d4e0ed",  // Hairline — card and input borders, dividers
          hairline: "#d4e0ed",
          "border-dark": "#1b3b59",
        },
        accent: {
          DEFAULT: "#006bff",
          hover: "#0059d6",
          soft: "#e6f0ff",
          magenta: "#e55cff", // Coral Magenta decorative accent blob
          cyan: "#0099ff",    // Sky Cyan decorative accent blob
        },
        success: { DEFAULT: "#10b981", soft: "#e6f4ea" },
        warning: { DEFAULT: "#f59e0b", soft: "#fef3c7" },
        danger: { DEFAULT: "#ef4444", soft: "#fee2e2" },
        muted: { DEFAULT: "#476788" },
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
        sm: "4px",
        md: "4px",
        lg: "8px",       // 8px button & input radius
        xl: "12px",
        "2xl": "16px",   // 16px product card radius
        "3xl": "24px",   // 24px main card radius
        full: "9999px",
      },
      boxShadow: {
        card: "rgba(71, 103, 136, 0.04) 0px 4px 5px 0px, rgba(71, 103, 136, 0.03) 0px 4px 10px 0px, rgba(71, 103, 136, 0.05) 0px 10px 20px 0px",
        elevated: "rgba(71, 103, 136, 0.04) 0px 4px 5px 0px, rgba(71, 103, 136, 0.03) 0px 8px 15px 0px, rgba(71, 103, 136, 0.08) 0px 30px 50px 0px",
        button: "rgba(71, 103, 136, 0.04) 0px 4px 5px 0px, rgba(71, 103, 136, 0.03) 0px 8px 15px 0px, rgba(71, 103, 136, 0.06) 0px 15px 30px 0px",
      },
    },
  },
  plugins: [],
};

export default config;
