import { Link } from 'react-router-dom';

import { modelTransparency } from '../lib/mockScan';

export function LandingPage() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr] lg:items-center">
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted">
          Forensic media verification
        </div>

        <div className="space-y-4">
          <h1 className="max-w-3xl text-4xl leading-tight text-text sm:text-5xl lg:text-6xl">
            Detect when video content misrepresents a real person.
          </h1>
          <p className="max-w-2xl text-base leading-7 text-muted sm:text-lg">
            Upload a video or a still frame. The system traces faces, scores forensic artifacts frame by frame, and shows exactly where the model found evidence.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/upload"
            className="inline-flex items-center justify-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Upload media
          </Link>
          <Link
            to="/history"
            className="inline-flex items-center justify-center rounded-full border border-border bg-surface/90 px-6 py-3 text-sm font-semibold text-text transition hover:border-accent/40 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Review history
          </Link>
        </div>
      </div>

      <aside className="glass-card p-6">
        <p className="panel-title">Model transparency</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mono-label">Backbone</div>
            <div className="mt-2 text-lg font-semibold text-text">{modelTransparency.backbone}</div>
          </div>
          <div>
            <div className="mono-label">Training set</div>
            <div className="mt-2 text-lg font-semibold text-text">{modelTransparency.training_dataset}</div>
          </div>
          <div>
            <div className="mono-label">Eval set</div>
            <div className="mt-2 text-lg font-semibold text-text">{modelTransparency.evaluation_dataset}</div>
          </div>
          <div>
            <div className="mono-label">Cross-dataset AUC</div>
            <div className="mt-2 font-mono text-3xl font-semibold text-accent">{Math.round(modelTransparency.cross_dataset_auc * 100)}%</div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-surfaceAlt px-4 py-4 text-sm leading-6 text-muted">
          The transparency panel is part of the product surface, not hidden in documentation. It will stay visible next to the verdict and confidence score.
        </div>
      </aside>
    </section>
  );
}
