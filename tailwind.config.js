/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Theme variables mapping
        bg:       'var(--color-bg)',
        surface:  'var(--color-surface)',
        card:     'var(--color-card)',
        subcard:  'var(--color-subcard)',
        teal:     '#2DD4BF',   // teal accent
        muted:    'var(--color-muted)',
        main:     'var(--color-main)',
        bline:    'var(--color-border)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      animation: {
        bounce: 'bounce 1s infinite',
      },
    },
  },
  plugins: [],
};
