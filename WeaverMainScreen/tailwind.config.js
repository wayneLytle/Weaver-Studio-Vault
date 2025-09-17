/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: '#e0c87a',
      },
    },
  },
  safelist: [
    'grid-cols-[420px_minmax(0,1fr)_420px]',
    'w-[calc(50%_-_0.375rem)]',
    'h-[68vh]'
  ],
  plugins: [],
};