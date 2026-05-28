/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        wdw: {
          bg: '#0b1220',
          card: '#111a2e',
          line: '#1f2a44',
          ink: '#e6ecff',
          mute: '#8595b8',
          accent: '#fcd34d',
        },
      },
    },
  },
  plugins: [],
};
