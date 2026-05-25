/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        gray: {
          850: "#1a1f2e",
          900: "#111827",
          950: "#0d1117",
        },
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
        "pulse-dot": "pulseDot 1.4s infinite ease-in-out",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideIn: { from: { transform: "translateX(-10px)", opacity: 0 }, to: { transform: "translateX(0)", opacity: 1 } },
        pulseDot: { "0%, 80%, 100%": { transform: "scale(0.6)", opacity: 0.4 }, "40%": { transform: "scale(1)", opacity: 1 } },
      },
    },
  },
  plugins: [],
};
