import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        surfaceAlt: 'var(--color-surface-alt)',
        border: 'var(--color-border)',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
        accent: 'var(--color-accent)',
        accentSoft: 'var(--color-accent-soft)',
        glowBlue: 'var(--color-glow-blue)',
        glowTeal: 'var(--color-glow-teal)',
        glowViolet: 'var(--color-glow-violet)',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono: ['IBM Plex Mono', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.05), 0 20px 80px rgba(0, 0, 0, 0.35)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      backgroundImage: {
        'ambient-grid': 'radial-gradient(circle at top left, rgba(59,130,246,0.2), transparent 26%), radial-gradient(circle at bottom right, rgba(20,184,166,0.14), transparent 22%), linear-gradient(180deg, transparent, rgba(255,255,255,0.02))',
      },
    },
  },
  plugins: [],
} satisfies Config;
