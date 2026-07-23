import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#0B0D12",
          soft: "#3A3F4B",
        },
        canvas: {
          DEFAULT: "#FFFFFF",
          dark: "#0B0D12",
        },
        surface: {
          DEFAULT: "#F6F7F9",
          dark: "#14161C",
          border: "#E4E6EB",
          "border-dark": "#22252E",
        },
        accent: {
          DEFAULT: "#5E6AD2",
          hover: "#4E59C0",
          soft: "#EEF0FD",
        },
        success: { DEFAULT: "#1F9254", soft: "#E7F6ED" },
        warning: { DEFAULT: "#B4740E", soft: "#FDF3E1" },
        danger: { DEFAULT: "#C0362C", soft: "#FBEAE9" },
        muted: { DEFAULT: "#6B7280" },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 8px -2px rgb(0 0 0 / 0.06)",
        popover: "0 4px 24px -4px rgb(0 0 0 / 0.12)",
      },
    },
  },
  plugins: [],
};

export default config;
