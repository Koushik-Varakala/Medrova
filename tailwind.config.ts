import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC",
        foreground: "#0F172A",
        card: "#FFFFFF",
        border: "#E2E8F0",
        input: "#E2E8F0",
        ring: "#1E40AF",
        primary: {
          DEFAULT: "#1E40AF",
          hover: "#1D4ED8",
          foreground: "#FFFFFF"
        },
        secondary: "#64748B",
        success: "#10B981",
        urgent: "#EF4444",
        warning: "#F59E0B"
      },
      borderRadius: {
        lg: "0.5rem",
        xl: "0.75rem"
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"]
      }
    }
  },
  plugins: [tailwindcssAnimate]
};

export default config;
