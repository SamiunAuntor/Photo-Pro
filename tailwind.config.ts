import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        mist: "#F4F3FF",
        surface: {
          base: "#f9f9ff",
          low: "#f0f3ff",
          high: "#e2e8f8",
          line: "#dce2f3",
        },
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
        },
      },
      fontFamily: {
        geist: ["var(--font-geist-sans)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        card: "0 24px 60px rgba(79, 70, 229, 0.12)",
      },
      backgroundImage: {
        "hero-grid":
          "radial-gradient(circle at top left, rgba(99,102,241,0.18), transparent 30%), linear-gradient(135deg, rgba(255,255,255,0.9), rgba(238,242,255,0.92))",
      },
    },
  },
  plugins: [],
};

export default config;
