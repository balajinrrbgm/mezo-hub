/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        btc: '#F7931A',
        mezo: '#6B4EFF',
        hub: {
          bg: '#08101A',
          dark: '#0F1C2D',
          card: '#122035',
          border: '#1A3050',
          purple: '#6B4EFF',
          violet: '#9B76FF',
          green: '#00D68F',
          red: '#FF4D4D',
          yellow: '#FFAA00',
          gold: '#FFD700',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
