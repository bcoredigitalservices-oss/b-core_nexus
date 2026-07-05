/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          primary: 'var(--accent-primary)',
          blue: 'var(--accent-blue)',
          green: 'var(--accent-green)',
          purple: 'var(--accent-purple)',
          danger: 'var(--accent-danger)',
          warning: 'var(--accent-warning)',
        },
        bg: {
          main: 'var(--bg-main)',
          card: 'var(--bg-card)',
          'card-hover': 'var(--bg-card-hover)',
          input: 'var(--bg-input)',
        },
        text: {
          main: 'var(--text-main)',
          muted: 'var(--text-muted)',
        },
        border: 'var(--border-color)',
      },
      backgroundColor: {
        main: 'var(--bg-main)',
        card: 'var(--bg-card)',
        'card-hover': 'var(--bg-card-hover)',
        input: 'var(--bg-input)',
        sidebar: 'var(--bg-sidebar)',
        header: 'var(--bg-header)',
      },
      textColor: {
        main: 'var(--text-main)',
        muted: 'var(--text-muted)',
      },
      borderColor: {
        DEFAULT: 'var(--border-color)',
        color: 'var(--border-color)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body: 'var(--font-body)',
        mono: 'var(--font-mono)',
      },
      keyframes: {
        slideDown: {
          'from': { opacity: '0', transform: 'translateY(-6px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        'orb-drift': {
          'from': { transform: 'translate(0, 0) scale(1)' },
          'to': { transform: 'translate(40px, 30px) scale(1.15)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
        fadeSlideIn: {
          'from': { opacity: '0', transform: 'translateY(-8px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        }
      },
      animation: {
        slideDown: 'slideDown 0.15s ease',
        'orb-drift': 'orb-drift 20s ease-in-out infinite alternate',
        shake: 'shake 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        fadeSlideIn: 'fadeSlideIn 0.3s ease',
      }
    },
  },
  plugins: [],
}
