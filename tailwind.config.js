/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Baloo 2"', 'system-ui', 'sans-serif'],
        sans: ['Nunito', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#17324d',
        leaf: { 50: '#ecfdf3', 100: '#d1fadf', 400: '#34d399', 500: '#10b981', 600: '#059669', 700: '#047857' },
        sky2: { 100: '#e0f2fe', 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7' },
        sun: { 100: '#fef3c7', 400: '#fbbf24', 500: '#f59e0b' },
        coral: { 100: '#ffe4e6', 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48' },
        grape: { 100: '#ede9fe', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed' },
        cream: '#fffaf2',
      },
      boxShadow: {
        pop: '0 4px 0 0 rgba(23,50,77,0.9)',
        popsm: '0 3px 0 0 rgba(23,50,77,0.9)',
        soft: '0 10px 30px -12px rgba(23,50,77,0.25)',
      },
      borderRadius: { '4xl': '2rem' },
    },
  },
  plugins: [],
}
