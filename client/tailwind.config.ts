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
          DEFAULT: '#EF692B',
          dark: '#D4571E',
          light: '#FE753B',
        },
        secondary: {
          DEFAULT: '#6C6CF0',
          dark: '#5151D8',
        },
        accent: {
          DEFAULT: '#1F9D74',
          dark: '#158260',
        },
        danger: {
          DEFAULT: '#EF4444',
          dark: '#DC2626',
        },
        // Brand specifics from the Figma design system
        ink: '#26332D',
        navy: '#002B51',
        cream: '#F9F6EF',
        // Account / box / wishlist screens (Figma "Section 9")
        night: '#1A1A2E',
        clay: '#8A8070',
        sand: '#F0EAD6',
        lagoon: {
          DEFAULT: '#3DB9A8',
          deep: '#3A9E8F',
          darkest: '#1A5C4A',
        },
        cerulean: '#0F9CCB',
        periwinkle: '#5E66DA',
        coral: '#FF6467',
        slate: {
          label: '#62748E',
          muted: '#6B6F85',
        },
        // Pastel chip / card backgrounds
        chip: {
          indigo: '#E4E6FF',
          mint: '#E8F5F3',
          sky: '#DFF7FF',
          rose: '#FBE6E6',
          butter: '#FFF6DC',
          peach: '#FFE8DE',
          blush: '#FDE8E2',
        },
        surface: '#FFFFFF',
        background: '#FAF7EF',
        text: {
          DEFAULT: '#26332D',
          muted: '#4A5565',
        },
      },
      fontFamily: {
        heading: ['Nunito', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        display: ['Fredoka', 'Nunito', 'sans-serif'],
        jakarta: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
