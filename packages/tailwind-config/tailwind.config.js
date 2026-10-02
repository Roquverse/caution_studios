/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#090a0f',
          DEFAULT: '#000000',
          dark: '#000000',
          light: '#27272a'
        },
        dark: {
          950: '#000000',
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
        'glow-brand': '0 0 25px -5px rgba(0, 0, 0, 0.25)',
        'soft-card': '0 10px 30px -10px rgba(0, 0, 0, 0.05), 0 4px 12px -4px rgba(0, 0, 0, 0.03)',
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
