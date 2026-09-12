/** @type {import('tailwindcss').Config} */

// ISKS 2026 "Built to Last" palette — see huisstijl.md for usage ratios.
const isks = {
  teal: '#2BAF90',
  'teal-dark': '#175B57',
  mint: '#A1D4B1',
  orange: '#F1A512',
  'red-orange': '#DD4111',
  bordeaux: '#8C0027'
};

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { isks },
      fontFamily: {
        display: ['Archivo', 'Archivo Black', 'Helvetica Neue', 'Arial', 'sans-serif'],
        body: ['Inter', 'system-ui', 'Helvetica Neue', 'Arial', 'sans-serif']
      },
      backgroundImage: {
        // Ton-sur-ton dot texture for large teal surfaces.
        dots: 'radial-gradient(rgba(255,255,255,0.22) 1.5px, transparent 1.6px)',
        'dots-dark': 'radial-gradient(rgba(161,212,177,0.18) 1.5px, transparent 1.6px)'
      },
      backgroundSize: {
        dots: '18px 18px'
      },
      boxShadow: {
        'offset-lg': '14px 14px 0 0 #DD4111',
        'offset-sm': '5px 5px 0 0 #DD4111'
      }
    }
  },
  plugins: []
};
