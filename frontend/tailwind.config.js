/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        frappe: {
          bg: '#f8f9fa',
          sidebar: '#f3f4f6',
          border: '#e5e7eb',
          card: '#ffffff',
          primary: '#1d4ed8',
          text: '#111827',
          muted: '#6b7280'
        }
      }
    },
  },
  plugins: [],
}
