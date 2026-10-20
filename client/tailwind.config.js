/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060B18',
          900: '#0B132B',
          850: '#101B3B',
          800: '#16234D',
          750: '#1D2E63',
          700: '#25397A',
          600: '#344C9E',
          500: '#4662C2'
        },
        ivory: {
          50: '#FDFBF7',
          100: '#F7F4EC',
          200: '#EFECE2',
          300: '#E2DED2',
          400: '#C7C2B4',
          500: '#A49F90'
        },
        teal: {
          accent: '#0D9488',
          light: '#14B8A6',
          bright: '#2DD4BF',
          glow: '#0F766E'
        },
        amber: {
          accent: '#D97706',
          light: '#F59E0B',
          soft: '#FDE68A'
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Plus Jakarta Sans', 'sans-serif']
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(11, 19, 43, 0.04)',
        'premium': '0 10px 30px -10px rgba(11, 19, 43, 0.08)',
        'elevated': '0 20px 40px -15px rgba(11, 19, 43, 0.12)',
        'glow-teal': '0 0 25px -5px rgba(13, 148, 136, 0.25)',
        'glow-amber': '0 0 25px -5px rgba(217, 119, 6, 0.25)'
      }
    },
  },
  plugins: [],
}
