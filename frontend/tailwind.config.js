/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          blue: '#a7c7e7',
          green: '#b2d8b2',
          red: '#ffb3b3',
          yellow: '#ffe5b4',
          purple: '#d8b4fe',
          'blue-dark': '#4b88c5',
          'green-dark': '#5a9c5a',
          'red-dark': '#e67373',
          'yellow-dark': '#e6b873',
          'bg': '#f0f4f8',
        },
      }
    },
  },
  plugins: [],
}