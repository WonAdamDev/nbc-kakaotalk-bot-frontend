/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          team: '#3B82F6',
        },
        white: {
          team: '#F3F4F6',
        }
      }
    },
  },
  plugins: [],
}
