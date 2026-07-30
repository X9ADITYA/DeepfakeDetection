import { Link, NavLink, Outlet } from 'react-router-dom';

import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { to: '/', label: 'Overview' },
  { to: '/upload', label: 'Upload' },
  { to: '/results', label: 'Results' },
  { to: '/history', label: 'History' },
];

export function Shell() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-12%] top-[-8%] h-72 w-72 rounded-full bg-glowBlue/10 blur-3xl" />
        <div className="absolute right-[-8%] top-[12%] h-80 w-80 rounded-full bg-glowTeal/10 blur-3xl" />
        <div className="absolute bottom-[-12%] left-[16%] h-96 w-96 rounded-full bg-glowViolet/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-border/70 bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <Link to="/" className="font-display text-lg tracking-wide text-text">
              Deepfake Forensics
            </Link>
            <p className="mt-1 text-xs uppercase tracking-[0.28em] text-muted">Video-first real-person misrepresentation detection</p>
          </div>

          <nav className="hidden items-center gap-1 rounded-full border border-border bg-surface/70 p-1 md:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => [
                  'rounded-full px-4 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
                  isActive
                    ? 'bg-accent text-white shadow-sm'
                    : 'text-muted hover:bg-surfaceAlt hover:text-text',
                ].join(' ')}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <ThemeToggle />
        </div>
      </header>

      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
