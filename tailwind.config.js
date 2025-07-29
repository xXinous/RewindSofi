/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './public/index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      // Configurações de acessibilidade modernas
      colors: {
        // Cores com melhor contraste para acessibilidade
        'accessible': {
          'primary': '#2563eb',
          'secondary': '#475569',
          'success': '#059669',
          'warning': '#d97706',
          'error': '#dc2626',
        }
      },
      // Configurações de foco melhoradas
      ringColor: {
        'accessible': '#2563eb',
      },
      // Configurações de transição suaves
      transitionProperty: {
        'all': 'all',
      },
      // Configurações de animação
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [
    // Plugin para melhorar acessibilidade
    function({ addUtilities, theme }) {
      const newUtilities = {
        '.focus-visible': {
          outline: '2px solid transparent',
          outlineOffset: '2px',
          '&:focus-visible': {
            outline: `2px solid ${theme('colors.accessible.primary')}`,
            outlineOffset: '2px',
          },
        },
        '.sr-only': {
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: '0',
        },
        '.high-contrast': {
          filter: 'contrast(1.2) brightness(1.1)',
        },
        '.reduced-motion': {
          '@media (prefers-reduced-motion: reduce)': {
            animation: 'none !important',
            transition: 'none !important',
          },
        },
      }
      addUtilities(newUtilities)
    }
  ],
}; 