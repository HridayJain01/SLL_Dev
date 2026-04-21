/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F59E0B',
          dark: '#D97706',
          light: '#FCD34D',
        },
        secondary: {
          DEFAULT: '#3B82F6',
          dark: '#2563EB',
        },
        accent: {
          DEFAULT: '#10B981',
          dark: '#059669',
        },
        danger: {
          DEFAULT: '#EF4444',
          dark: '#DC2626',
        },
        surface: '#FFFFFF',
        background: '#FFFBF0',
        text: {
          DEFAULT: '#1F2937',
          muted: '#6B7280',
        },
      },
      fontFamily: {
        heading: ['Nunito', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
