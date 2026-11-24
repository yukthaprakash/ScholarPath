/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#FAF8F4',
          surface: '#FFFFFF',
          muted: '#F4F1EA',
        },
        ink: {
          DEFAULT: '#16202E',
          soft: '#2D3748',
        },
        muted: {
          DEFAULT: '#6B7585',
          light: '#9AA2B1',
        },
        line: {
          DEFAULT: '#E3E0D9',
          dark: '#D5D0C5',
        },
        green: {
          DEFAULT: '#1F6B57',
          surface: '#EBF4F0',
          hover: '#195545',
        },
        gold: {
          DEFAULT: '#D9A441',
          surface: '#FDF7EB',
          hover: '#C29135',
        },
      },
      fontFamily: {
        serif: ['Manrope', 'sans-serif'],
        sans: ['Inter', 'Noto Sans Kannada', 'Noto Sans Devanagari', 'sans-serif'],
      },
      boxShadow: {
        subtle: '0 1px 3px 0 rgba(22, 32, 46, 0.05)',
        card: '0 1px 4px 0 rgba(22, 32, 46, 0.07)',
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      }
    },
  },
  plugins: [],
};
