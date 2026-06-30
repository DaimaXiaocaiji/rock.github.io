export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        sans: ['IBM Plex Sans SC', 'system-ui', 'sans-serif']
      },
      colors: {
        steel: {
          900: '#081822',
          800: '#0F2837',
          700: '#143448',
          600: '#1B4560',
          500: '#245A7B',
          400: '#3D7AA1',
          300: '#6FA8C8'
        },
        tech: {
          DEFAULT: '#16A085',
          dark: '#0E705C',
          light: '#57E0C0'
        },
        amber: {
          DEFAULT: '#F39C12',
          dark: '#A8680A'
        },
        danger: {
          DEFAULT: '#C0392B',
          dark: '#8C281D'
        }
      },
      backgroundImage: {
        'grid-deep':
          'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        'grid-subtle':
          'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)'
      }
    }
  },
  plugins: []
}
