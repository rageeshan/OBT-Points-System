/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Mission Impossible Palette
        mission: {
          black: '#080810',
          dark: '#0d0d1a',
          surface: '#111122',
          card: '#161628',
          border: '#1e1e3a',
          red: '#dc2626',
          'red-bright': '#ef4444',
          'red-glow': '#ff0000',
          amber: '#d97706',
          'amber-bright': '#f59e0b',
          'amber-glow': '#fbbf24',
          green: '#16a34a',
          'green-bright': '#22c55e',
          white: '#f8f8ff',
          muted: '#6b6b8a',
          dim: '#4a4a6a',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'scan': 'scan 3s linear infinite',
        'pulse-red': 'pulse-red 2s ease-in-out infinite',
        'pulse-amber': 'pulse-amber 2s ease-in-out infinite',
        'blink': 'blink 1s step-end infinite',
        'slide-up': 'slide-up 0.4s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'glitch': 'glitch 5s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'matrix': 'matrix 20s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'pulse-red': {
          '0%, 100%': { boxShadow: '0 0 5px #dc2626, 0 0 10px #dc262640' },
          '50%': { boxShadow: '0 0 15px #dc2626, 0 0 30px #dc262670' },
        },
        'pulse-amber': {
          '0%, 100%': { boxShadow: '0 0 5px #d97706, 0 0 10px #d9770640' },
          '50%': { boxShadow: '0 0 15px #d97706, 0 0 30px #d9770670' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        glitch: {
          '0%, 90%, 100%': { transform: 'translate(0)' },
          '91%': { transform: 'translate(-2px, 1px)' },
          '92%': { transform: 'translate(2px, -1px)' },
          '93%': { transform: 'translate(-1px, 2px)' },
          '94%': { transform: 'translate(1px, -2px)' },
          '95%': { transform: 'translate(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        matrix: {
          '0%': { backgroundPosition: '0% 0%' },
          '100%': { backgroundPosition: '0% 100%' },
        },
      },
      boxShadow: {
        'red-glow': '0 0 20px rgba(220, 38, 38, 0.4)',
        'amber-glow': '0 0 20px rgba(217, 119, 6, 0.4)',
        'green-glow': '0 0 20px rgba(22, 163, 74, 0.4)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.5)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
