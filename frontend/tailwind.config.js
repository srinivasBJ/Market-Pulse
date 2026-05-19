/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        shell: "#090f19",
        panel: "#0f1726",
        ink: "#d9e3f0",
        accent: "#5eead4",
        line: "#1d2a3f",
        danger: "#fb7185",
        glow: "#7dd3fc"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(0, 0, 0, 0.35)"
      },
      fontFamily: {
        display: ["Space Grotesk", "ui-sans-serif", "system-ui"],
        body: ["IBM Plex Sans", "ui-sans-serif", "system-ui"]
      }
    },
  },
  plugins: [],
};

