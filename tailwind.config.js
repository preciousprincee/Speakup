export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#f0eeff',
          100: '#e4e0ff',
          200: '#cdc5ff',
          300: '#ad9fff',
          400: '#8b73ff',
          500: '#6C63FF',
          600: '#5a4de6',
          700: '#4a3dc9',
          800: '#3d33a4',
          900: '#332d83',
        },
        ink: {
          50:  '#f5f5fa',
          100: '#ebebf5',
          200: '#d0d0e5',
          300: '#a8a8c9',
          400: '#7878a8',
          500: '#55558a',
          600: '#3e3e6e',
          700: '#2a2a52',
          800: '#1a1a38',
          900: '#0F0F1A',
        },
        accent: {
          gold:  '#F5C842',
          mint:  '#3ECFB2',
          coral: '#FF6B6B',
          sky:   '#38BDF8',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(16px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      }
    }
  },
  plugins: []
}
