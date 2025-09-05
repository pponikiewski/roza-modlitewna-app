// frontend/tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Tylko używane kolory - mniejszy CSS bundle
      colors: {
        primary: {
          50: '#eef2ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        }
      }
    },
  },
  plugins: [],
  // Optymalizacje dla mniejszego CSS
  corePlugins: {
    // Wyłączenie niepotrzebnych utilities
    ringOffsetColor: false,
    ringOffsetWidth: false,
    scrollSnapType: false,
    scrollSnapAlign: false,
    touchAction: false,
  }
}