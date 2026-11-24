/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        aparecer: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        // Muestra el indicador de carga solo si la espera dura mas de 200 ms
        "aparecer-tarde": "aparecer 0.2s ease-out 0.2s forwards",
      },
    },
  },
  plugins: [],
}

