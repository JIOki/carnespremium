/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/hooks/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        // Paleta principal Carnes Premium - Claret Red
        primary: {
          50: '#fdf2f5',
          100: '#fce7ee',
          200: '#f9d0dd',
          300: '#f4a8c0',
          400: '#ec7599',
          500: '#8B1E3F', // Claret Red principal
          600: '#7a1b38',
          700: '#681831',
          800: '#58162d',
          900: '#4d152a',
          950: '#2a0a16',
        },
        // Acento dorado premium
        accent: {
          50: '#fdfcf7',
          100: '#fbf7ec',
          200: '#f6efd3',
          300: '#ede1b0',
          400: '#e0cd85',
          500: '#B9975B', // Gold principal
          600: '#a8864f',
          700: '#8d6e42',
          800: '#745939',
          900: '#5f4a30',
          950: '#362718',
        },
        // Neutros elegantes
        neutral: {
          50: '#FDFCFB', // Page Background
          100: '#FFFFFF', // Card/Surface Background
          200: '#EAEAEA', // Border/Subtle
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#404040', // Body Text
          800: '#1f2937',
          900: '#1C1C1C', // Heading Text
        },
        // Estados
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        error: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Body & UI Font
        serif: ['Lora', 'serif'], // Heading Font  
        mono: ['Fira Code', 'monospace'],
      },
      fontSize: {
        // Escala Major Third (1.250) según especificaciones
        'xs': '0.75rem',     // 12px
        'sm': '0.875rem',    // 14px - Small/Label
        'base': '1rem',      // 16px - UI/Button  
        'lg': '1.125rem',    // 18px - Body
        'xl': '1.25rem',     // 20px
        '2xl': '1.5rem',     // 24px - H3 (Card)
        '3xl': '1.875rem',   // 30px
        '4xl': '3.0625rem',  // 49px - H2 (Section)
        '5xl': '3.8125rem',  // 61px - H1 (Hero)
      },
      spacing: {
        // Sistema de 8px grid según especificaciones
        'xs': '0.5rem',   // 8px - space-xs
        'sm': '1rem',     // 16px - space-sm
        'md': '1.5rem',   // 24px - space-md
        'lg': '2rem',     // 32px - space-lg
        'xl': '3rem',     // 48px - space-xl
        '2xl': '4rem',    // 64px - space-xxl
        '3xl': '6rem',    // 96px - space-xxxl
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      borderRadius: {
        'xs': '0.125rem',
        'sm': '0.25rem',
        'DEFAULT': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        'inner': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        // Sombras específicas según diseño
        'card': '0px 4px 12px rgba(0, 0, 0, 0.05)', // Shadow (Subtle) para cards en rest
        'card-hover': '0px 8px 24px rgba(0, 0, 0, 0.08)', // Shadow (Hover) para cards en hover
        'premium': '0 25px 50px -12px rgba(139, 30, 63, 0.25)', // Sombra con primary color
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-up': 'scaleUp 0.2s ease-out',
        'bounce-gentle': 'bounceGentle 0.6s ease-in-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
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
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleUp: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(-5%)' },
          '50%': { transform: 'translateY(0)' },
        },
      },
      screens: {
        'xs': '475px',
        '3xl': '1680px',
      },
      backdropBlur: {
        'xs': '2px',
      },
      gridTemplateColumns: {
        'auto-fit': 'repeat(auto-fit, minmax(280px, 1fr))',
        'auto-fill': 'repeat(auto-fill, minmax(280px, 1fr))',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
    require('@tailwindcss/typography'),
    // Plugin personalizado para utilidades adicionales
    function({ addUtilities, theme }) {
      addUtilities({
        '.glass': {
          background: 'rgba(255, 255, 255, 0.1)',
          'backdrop-filter': 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.1)',
          'backdrop-filter': 'blur(10px)',
          '-webkit-backdrop-filter': 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.gradient-primary': {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        },
        '.gradient-secondary': {
          background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
        },
        '.gradient-accent': {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        },
        '.text-gradient': {
          'background-clip': 'text',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none'
          }
        }
      })
    }
  ],
}