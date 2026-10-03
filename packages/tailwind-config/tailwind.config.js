/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        /* Design Tokens from Spec Section 3 */
        bg: '#0B0C0C',
        surface: '#121414',
        'surface-2': '#181B1B',
        border: '#26292A',

        text: '#F5F5F2',
        'text-muted': '#A9ABA8',
        'text-faint': '#6B6E6C',

        accent: '#0F4F49',
        'accent-live': '#3DBFA8',

        sold: '#8A867E',
        danger: '#C0563F',

        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#3DBFA8',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0F4F49',
          800: '#0b3c37',
          900: '#082a27',
          950: '#041614',
          DEFAULT: '#0F4F49',
          dark: '#0b3c37',
          light: '#3DBFA8'
        }
      },
      borderRadius: {
        sm: '6px',
        pill: '999px'
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif'
        ],
        display: [
          'Inter',
          'system-ui',
          'sans-serif'
        ]
      },
      letterSpacing: {
        display: '-0.03em'
      },
      boxShadow: {
        /* Spec: shadow ONLY under the hero search bar */
        'hero-search': '0 20px 40px -15px rgba(0, 0, 0, 0.7)'
      }
    }
  },
  plugins: []
};
