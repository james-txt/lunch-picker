/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        raleway: ['var(--font-raleway)'],
      },
      colors: {
        'background': '#FFF1F5',
        'primary': '#FF8FA3',
        'accent': '#B9FBC0',
        'soft': '#FFFACD',
        'foreground': '#2E2E2E',
        'secondary': '#9E768F',
        'card': '#FFFFFF',
        'card-shadow': '#EDEDED'
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
}