import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#ffffff',
        primary: '#17171c',
        ink: '#212121',
        'deep-green': '#003c33',
        'dark-navy': '#071829',
        'soft-stone': '#eeece7',
        coral: '#ff7759',
        'coral-soft': '#ffad9b',
        muted: '#93939f',
        slate: '#75758a',
        'body-muted': '#616161',
        'action-blue': '#1863dc',
        hairline: '#d9d9dd',
        'card-border': '#f2f2f2',
        error: '#b30000',
      },
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['var(--font-inter)', 'Arial', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '22px',
        xl: '30px',
        pill: '32px',
      },
      maxWidth: {
        container: '1180px',
      },
    },
  },
  plugins: [],
}

export default config
