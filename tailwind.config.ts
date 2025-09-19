import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',   // <- TS + TSX
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'ui-sans-serif', 'Arial'],
      },
      colors: {
        // Paleta HomeClimate+ (eco/clima)
        hc: {
          sky:   '#6ec6ff',   // cielo claro
          deep:  '#0ea5e9',   // sky-500
          mint:  '#22d3ee',   // cyan-400
          leaf:  '#10b981',   // emerald-500
          moss:  '#065f46',   // emerald-900
          slate: '#0f172a',   // slate-900
          sand:  '#f8fafc',   // near white
          warn:  '#f59e0b',   // amber-500
          error: '#ef4444',   // red-500
        },
      },
      backgroundImage: {
        'hc-gradient':
          'linear-gradient(180deg, rgba(236,253,245,1) 0%, rgba(240,249,255,1) 50%, rgba(255,255,255,1) 100%)',
        'hc-night':
          'linear-gradient(180deg, #020617 0%, #0b1020 50%, #0f172a 100%)',
      },
      boxShadow: {
        'hc-soft': '0 6px 20px rgba(2, 132, 199, 0.10)',   // azul suave
        'hc-card': '0 8px 24px rgba(16, 185, 129, 0.12)',  // verde suave
      },
      borderRadius: {
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/line-clamp'),
  ],
} satisfies Config
