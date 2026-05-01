/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
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
      colors: {
        ink: {
          50: "#f7f7f8",
          100: "#eeeef1",
          200: "#d9d9e0",
          300: "#b6b6c2",
          400: "#8e8e9d",
          500: "#6c6c7c",
          600: "#525261",
          700: "#3f3f4c",
          800: "#2a2a35",
          900: "#1a1a22",
          950: "#0f0f15",
        },
        brand: {
          50: "#eef4ff",
          100: "#dbe6ff",
          200: "#bfd2ff",
          300: "#93b4ff",
          400: "#608cff",
          500: "#3a66ff",
          600: "#2347ee",
          700: "#1c37c8",
          800: "#1c30a0",
          900: "#1c2e7e",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,15,21,0.04), 0 4px 12px rgba(15,15,21,0.06)",
        cardHover:
          "0 2px 4px rgba(15,15,21,0.06), 0 12px 24px rgba(15,15,21,0.10)",
      },
      keyframes: {
        fadeIn: { "0%": { opacity: 0 }, "100%": { opacity: 1 } },
        scaleIn: {
          "0%": { opacity: 0, transform: "scale(0.96)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 150ms ease-out",
        scaleIn: "scaleIn 180ms ease-out",
      },
    },
  },
  plugins: [],
};
