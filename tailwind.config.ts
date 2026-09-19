import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        boardroom: {
          bg: "#0B0F19",
          card: "#111827",
          border: "#1F2937",
          accent: "#2563EB",
          highlight: "#10B981",
        }
      },
      aspectRatio: {
        "16/9": "16 / 9",
      }
    },
  },
  plugins: [],
};
export default config;
