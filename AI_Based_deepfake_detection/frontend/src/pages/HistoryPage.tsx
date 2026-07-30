import { Link, useNavigate } from 'react-router-dom';

import { useScan } from '../context/scan';

export function HistoryPage() {
  const navigate = useNavigate();
  const { history, setCurrentScan } = useScan();

  return (
    <section className="space-y-6">
      <div className="glass-card flex flex-col gap-3 px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="panel-title">History</p>
          <h1 className="mt-2 text-3xl text-text">Previous scans for this session.</h1>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white"
        >
          New scan
        </Link>
      </div>

      {history.length === 0 ? (
        <div className="glass-card p-8 text-center text-muted">
          No scans yet. Upload a file to start building a session history.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {history.map((scan) => (
            <article key={scan.id} className="glass-card flex flex-col overflow-hidden">
              <div className="aspect-video bg-surfaceAlt">
                {scan.preview_url ? <img src={scan.preview_url} alt={scan.filename} className="h-full w-full object-cover" /> : null}
              </div>
              <div className="flex flex-1 flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-text">{scan.filename}</h2>
                    <p className="mt-1 text-sm text-muted">{new Date(scan.created_at).toLocaleString()}</p>
                  </div>
                  <div className={[
                    'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em]',
                    scan.verdict === 'fake' ? 'bg-red-500/10 text-red-600 dark:text-red-300' : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
                  ].join(' ')}>
                    {scan.verdict}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl border border-border bg-surfaceAlt px-4 py-3">
                    <div className="mono-label">Confidence</div>
                    <div className="mt-1 font-mono text-xl font-semibold text-text">{Math.round(scan.confidence * 100)}%</div>
                  </div>
                  <div className="rounded-2xl border border-border bg-surfaceAlt px-4 py-3">
                    <div className="mono-label">Frames</div>
                    <div className="mt-1 font-mono text-xl font-semibold text-text">{scan.frame_count}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentScan(scan);
                    navigate('/results');
                  }}
                  className="mt-auto inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-3 text-sm font-semibold text-text transition hover:border-accent/40 hover:text-accent"
                >
                  Re-open scan
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
