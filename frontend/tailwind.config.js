/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#7c3aed",
      },
      animation: {
        "pulse-dot": "pulseDot 1.4s infinite ease-in-out",
      },
      keyframes: {
        pulseDot: {
          "0%, 80%, 100%": { transform: "scale(0.55)", opacity: "0.4" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
