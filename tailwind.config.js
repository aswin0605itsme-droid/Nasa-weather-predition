/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // Explicitly list root files to avoid scanning node_modules
    "./App.tsx",
    "./index.tsx",
    // Strictly target source folders
    "./components/**/*.{js,ts,jsx,tsx}",
    "./services/**/*.{js,ts,jsx,tsx}",
    // EXCLUDED: ./data folder (contains massive string files that slow down the build)
  ],
  theme: {
    extend: {
      colors: {
        space: {
          950: '#05050A', // Deepest Void
          900: '#0B0E17', // Background
          800: '#151932', // Card Bg
          700: '#232946', // Border/Hover
          600: '#343B5F',
          
          // Accents
          accent: '#6366f1', // Indigo/Purple
          cyan: '#22d3ee',   // Cyan/Data
          rose: '#f43f5e',   // Heat/Alerts
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(99, 102, 241, 0.15)',
        'glow-cyan': '0 0 20px rgba(34, 211, 238, 0.15)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      }
    },
  },
  plugins: [],
}