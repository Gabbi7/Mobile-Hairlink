/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.tsx",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./lib/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FF1493",
        secondary: "#FF66B2",
        pink: {
          50: "#FFF4F8",
          100: "#FFF0F5",
          200: "#FFD6EF",
          300: "#FFB3E0",
          400: "#FF66B2",
          500: "#FF1493",
          600: "#E01282",
        },
        purple: {
          50: "#F9F4FC",
          100: "#F4ECF7",
          200: "#E8DAEF",
          300: "#D2B4DE",
          400: "#C39BD3",
          500: "#9B59B6",
          600: "#8E44AD",
        },
        blush: "#FFF4F8",
        borderPink: "#FFD6EF",
      },
    },
  },
  plugins: [],
}