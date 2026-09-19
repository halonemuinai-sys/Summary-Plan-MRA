/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
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
