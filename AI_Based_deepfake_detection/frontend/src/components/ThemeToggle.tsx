import { useTheme } from '../context/theme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/90 px-4 py-2 text-sm font-medium text-text shadow-sm transition hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <span className="font-mono text-xs uppercase tracking-[0.24em] text-muted">{theme}</span>
      <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_0_6px_rgba(65,86,246,0.12)]" />
    </button>
  );
}
