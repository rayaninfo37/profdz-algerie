/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAFBFB', // Luxurious warm ivory / Mediterranean pearl light background
        surface: '#FFFFFF', // Pure pristine card surface
        card: '#FFFFFF', // Elevated white card container
        border: '#E2E8F0', // Subtle light border divider
        teal: {
          50: '#F0FDFA',
          100: '#CCFBF1',
          200: '#99F6E4',
          300: '#5EEAD4',
          400: '#2DD4BF',
          500: '#14B8A6',
          600: '#0D9488', // Mediterranean Turquoise Signature
          700: '#0F766E',
          800: '#115E59',
          900: '#134E4A',
          950: '#042F2E',
        },
        navy: {
          800: '#1E293B',
          900: '#0F172A',
          950: '#090D1A',
        },
        burgundy: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          600: '#E11D48',
          700: '#BE123C',
          800: '#9F1239',
          900: '#881337',
          950: '#4C0519',
        },
        gold: {
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
      },
      fontFamily: {
        sans: ['var(--font-tajawal)', 'Tajawal', 'Cairo', 'sans-serif'],
        heading: ['var(--font-cairo)', 'Cairo', 'Tajawal', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
