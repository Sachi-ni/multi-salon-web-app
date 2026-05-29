/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // Core dark surfaces
        primary: '#0a0a0a',
        surface: {
          DEFAULT: '#111111',
          2: '#1a1a1a',
          3: '#222222',
        },
        // Borders
        border: {
          DEFAULT: '#2a2a2a',
          hover: '#333333',
        },
        // Accent (yellow/gold)
        accent: {
          DEFAULT: '#f5c800',
          hover: '#ffd700',
          glow: 'rgba(245,200,0,0.25)',
          dim: 'rgba(245,200,0,0.1)',
          muted: 'rgba(245,200,0,0.15)',
        },
        // Semantic
        success: {
          DEFAULT: '#22c55e',
          dim: 'rgba(34,197,94,0.12)',
          border: 'rgba(34,197,94,0.25)',
        },
        danger: {
          DEFAULT: '#ef4444',
          dim: 'rgba(239,68,68,0.12)',
          border: 'rgba(239,68,68,0.25)',
        },
        info: {
          DEFAULT: '#38bdf8',
          dim: 'rgba(56,189,248,0.1)',
          border: 'rgba(56,189,248,0.25)',
        },
        warning: {
          DEFAULT: '#f97316',
          dim: 'rgba(249,115,22,0.1)',
          border: 'rgba(249,115,22,0.25)',
        },
        purple: {
          DEFAULT: '#a855f7',
          dim: 'rgba(168,85,247,0.1)',
          border: 'rgba(168,85,247,0.25)',
        },
        pink: {
          DEFAULT: '#f472b6',
          dim: 'rgba(244,114,182,0.1)',
        },
        // Text
        muted: {
          DEFAULT: '#555555',
          2: '#888888',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1' }],
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '18px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(245,200,0,0.15)',
        'glow-sm': '0 0 12px rgba(245,200,0,0.1)',
        'card': '0 8px 32px rgba(0,0,0,0.3)',
        'card-hover': '0 12px 40px rgba(0,0,0,0.5)',
        'modal': '0 24px 80px rgba(0,0,0,0.7)',
        'glass': '0 8px 32px rgba(0,0,0,0.2)',
      },
      backdropBlur: {
        'glass': '12px',
      },
      animation: {
        'fade-up': 'fadeUp 0.22s ease',
        'fade-in': 'fadeIn 0.3s ease',
        'slide-in-right': 'slideInRight 0.3s cubic-bezier(0.4,0,0.2,1)',
        'slide-in-left': 'slideInLeft 0.3s cubic-bezier(0.4,0,0.2,1)',
        'scale-in': 'scaleIn 0.2s ease',
        'pulse-dot': 'pulseDot 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideInRight: {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        slideInLeft: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        scaleIn: {
          from: { transform: 'scale(0.95)', opacity: '0' },
          to: { transform: 'scale(1)', opacity: '1' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', boxShadow: '0 0 0 0 rgba(34,197,94,0.4)' },
          '50%': { opacity: '0.6', boxShadow: '0 0 0 5px rgba(34,197,94,0)' },
        },
      },
      spacing: {
        'sidebar': '240px',
        'header': '64px',
      },
      transitionDuration: {
        '250': '250ms',
      },
    },
  },
  plugins: [],
};
