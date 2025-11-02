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
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
          950: '#3b0c66',
        },
        accent: {
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
          950: '#500724',
        },
        midnight: {
          50: '#f6f5ff',
          100: '#ece9ff',
          200: '#d7d3ff',
          300: '#b7aafb',
          400: '#8a77f2',
          500: '#5f4ecb',
          600: '#4337ad',
          700: '#342a88',
          800: '#201b57',
          900: '#140f36',
          950: '#08051d',
        },
      },
      boxShadow: {
        glow: '0 25px 65px rgba(147, 51, 234, 0.35)',
        'glow-sm': '0 18px 45px rgba(236, 72, 153, 0.25)',
        'inner-soft': 'inset 0 0 0 1px rgba(255, 255, 255, 0.06)',
      },
      backgroundImage: {
        'hero-glow':
          'radial-gradient(circle at 20% 20%, rgba(147, 51, 234, 0.35), transparent 45%), radial-gradient(circle at 85% 15%, rgba(236, 72, 153, 0.25), transparent 50%)',
        'mesh-purple':
          'linear-gradient(135deg, rgba(8, 5, 29, 1) 0%, rgba(39, 18, 82, 1) 45%, rgba(88, 28, 135, 1) 100%)',
        'midnight-radial':
          'radial-gradient(circle at top, rgba(147, 51, 234, 0.35), transparent 60%), radial-gradient(circle at bottom, rgba(24, 24, 27, 0.85), rgba(5, 3, 15, 0.95))',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 1.5s infinite',
        'gradient-slow': 'gradient-x 18s ease infinite',
        shimmer: 'shimmer 3s linear infinite',
        'fade-in-up': 'fade-in-up 0.8s ease forwards',
      },
    },
  },
  plugins: [],
}
