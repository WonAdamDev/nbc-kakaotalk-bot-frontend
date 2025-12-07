/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        'team-blue': '#3B82F6',
        'team-white': '#F3F4F6',
      }
    },
  },
  plugins: [],
}
