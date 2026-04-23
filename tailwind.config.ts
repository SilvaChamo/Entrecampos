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
        'entrecampos-green': '#2E7D32',
        'entrecampos-brown': '#795548',
        'entrecampos-bg': '#FAFAFA',
        'entrecampos-text': '#212121',
      },
    },
  },
  plugins: [],
};

export default config;