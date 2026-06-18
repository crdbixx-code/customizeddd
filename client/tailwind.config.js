/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        base: '#070d18',
        surface: '#0c1626',
        panel: '#101e34',
        'panel-hi': '#152844',
        line: 'rgba(120,170,220,0.10)',
        'line-hi': 'rgba(120,170,220,0.20)',
        cyan: {
          DEFAULT: '#2dd4ff',
          dim: '#1a9bc4',
        },
        teal: '#2de8c0',
        amber: '#f5a623',
        coral: '#ff6b5e',
        violet: '#8b7cff',
        ink: {
          1: '#eaf3ff',
          2: '#8fa8c4',
          3: '#516a87',
          4: '#2c3e54',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(45,212,255,0.15), 0 8px 30px -10px rgba(45,212,255,0.25)',
        'glow-sm': '0 0 0 1px rgba(45,212,255,0.12)',
      },
      borderRadius: {
        xl2: '14px',
      },
    },
  },
  plugins: [],
};
