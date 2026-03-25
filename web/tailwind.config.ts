import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#14213d',
        slate: '#5c677d',
        sand: '#f7f3eb',
        line: '#d9d4ca',
        accent: '#c97b39',
        success: '#2d6a4f',
        danger: '#b42318',
      },
      boxShadow: {
        panel: '0 18px 48px rgba(20, 33, 61, 0.08)',
      },
      borderRadius: {
        xl: '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
