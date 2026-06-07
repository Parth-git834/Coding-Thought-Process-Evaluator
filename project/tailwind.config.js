/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        'space-grotesk': ['Space Grotesk', 'monospace'],
        'inter': ['Inter', 'sans-serif'],
      },
      colors: {
        'deep-night': {
          50: '#0a0a0f',
          100: '#0f0f1a',
          200: '#1a1a2e',
          300: '#16213e',
          400: '#0f3460',
          500: '#533483',
          600: '#7209b7',
          700: '#8b5cf6',
          800: '#a855f7',
          900: '#c084fc',
        },
        'neon': {
          blue: '#00d4ff',
          purple: '#a855f7',
          pink: '#ec4899',
          green: '#10b981',
          yellow: '#f59e0b',
        },
        'glass': {
          white: 'rgba(255, 255, 255, 0.1)',
          dark: 'rgba(0, 0, 0, 0.2)',
        }
      },
      backgroundImage: {
        'deep-gradient': 'linear-gradient(135deg, #0a0a0f 0%, #16213e 50%, #0f3460 100%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
        'neon-glow': 'radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        'neon': '0 0 20px rgba(168, 85, 247, 0.5)',
        'soft': '0 4px 20px rgba(0, 0, 0, 0.1)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)' },
          '100%': { boxShadow: '0 0 30px rgba(168, 85, 247, 0.8)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
