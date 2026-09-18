/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          bg: '#0f172a',
          grid: '#1e293b',
        },
        panel: {
          bg: '#1e293b',
          border: '#334155',
          header: '#0f172a',
        },
      },
    },
  },
  plugins: [],
}
