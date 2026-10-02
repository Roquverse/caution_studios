/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb', // Electric royal blue matching the reference design
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#172554',
          DEFAULT: '#1E50FF',
          dark: '#143cc9',
          light: '#3d6cff'
        },
        dark: {
          950: '#060709',
          900: '#090A0F',
          850: '#0f1118',
          800: '#151722',
          700: '#1e2230',
          600: '#2d3345'
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ]
      },
      boxShadow: {
        'glow-brand': '0 0 25px -5px rgba(37, 99, 235, 0.4)',
        'glow-purple': '0 0 35px -5px rgba(168, 85, 247, 0.35)',
        'soft-card': '0 10px 30px -10px rgba(0, 0, 0, 0.06), 0 4px 12px -4px rgba(0, 0, 0, 0.04)',
        'premium': '0 20px 40px -15px rgba(0, 0, 0, 0.08)'
      },
      animation: {
        'wave': 'wave 1.2s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite'
      },
      keyframes: {
        wave: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '0.9' }
        }
      }
    }
  },
  plugins: []
};
