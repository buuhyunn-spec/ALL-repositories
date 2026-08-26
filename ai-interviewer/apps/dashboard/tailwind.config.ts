import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#00d4aa',
          dim:     '#00d4aa22',
          dark:    '#00a888',
        },
        surface: {
          0: '#0d1117',
          1: '#161b22',
          2: '#1e2530',
          3: '#252d3a',
        },
        ink: {
          DEFAULT: '#e6edf3',
          muted:   '#7d8590',
          faint:   '#4d5562',
        },
        edge: '#2a3141',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
