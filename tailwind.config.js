/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./dashboard.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0e14',
        'background-secondary': '#111827', // A bit lighter for cards
        primary: '#22d3ee', // Cyan accent
        'primary-dark': '#0891b2',
        safe: '#10b981',
        warning: '#fbbf24',
        emergency: '#ef4444',
        investigation: '#d946ef', // Magenta/purple for Police view
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
