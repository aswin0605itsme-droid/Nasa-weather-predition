/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          900: '#0b0d17',
          800: '#151932',
          700: '#202646',
          accent: '#d0d6f9',
        }
      }
    },
  },
  plugins: [],
}