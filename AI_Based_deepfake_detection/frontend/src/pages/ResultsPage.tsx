import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

import { EvidenceOverlay } from '../components/EvidenceOverlay';
import { useScan } from '../context/scan';
import type { ScanResult } from '../lib/types';

export function ResultsPage() {
  const navigate = useNavigate();
  const { currentScan, history, modelTransparency, setCurrentScan } = useScan();
  const scan = currentScan ?? history[0] ?? null;

  const chartData = useMemo(
    () =>
      (scan?.per_frame_scores ?? []).map((score, index) => ({
        frame: index + 1,
        score: Math.round(score * 100),
      })),
    [scan],
  );

  if (!scan) {
    return (
      <section className="glass-card p-8 text-center">
        <h1 className="text-3xl text-text">No scan ready yet.</h1>
        <p className="mt-3 text-muted">Upload media first so the results view has a verdict to display.</p>
        <Link className="mt-6 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white" to="/upload">
          Upload media
        </Link>
      </section>
    );
  }

  const verdictLabel = scan.verdict === 'fake' ? 'Likely manipulated' : 'Likely authentic';
  const scorePercent = Math.round(scan.confidence * 100);

  return (
    <section className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[1.05fr,0.95fr]">
        <div className="glass-card p-6">
          <p className="panel-title">Verdict</p>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-4xl text-text sm:text-5xl">{verdictLabel}</h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
                The model confidence is displayed alongside the evidence overlay so the result stays readable and defensible.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surfaceAlt px-5 py-4 text-right">
              <div className="mono-label">Confidence</div>
              <div className="mt-1 font-mono text-4xl font-semibold text-accent">{scorePercent}%</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surfaceAlt px-4 py-4">
              <div className="mono-label">Media type</div>
              <div className="mt-2 text-lg font-semibold text-text">{scan.media_type}</div>
            </div>
            <div className="rounded-2xl border border-border bg-surfaceAlt px-4 py-4">
              <div className="mono-label">Frames checked</div>
              <div className="mt-2 text-lg font-semibold text-text">{scan.frame_count}</div>
            </div>
          </div>
        </div>

        <EvidenceOverlay
          previewUrl={scan.preview_url}
          heatmapUrl={scan.heatmap_url}
          verdict={scan.verdict}
          confidence={scan.confidence}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="glass-card p-6">
          <p className="panel-title">Frame-level confidence</p>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.22)" />
                <XAxis dataKey="frame" stroke="var(--color-muted)" tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted)" tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '16px',
                    color: 'var(--color-text)',
                  }}
                />
                <Line type="monotone" dataKey="score" stroke="var(--color-accent)" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-6">
            <p className="panel-title">Model transparency</p>
            <div className="mt-4 space-y-4 text-sm text-muted">
              <div>
                <div className="mono-label">Backbone</div>
                <div className="mt-1 text-text">{modelTransparency?.backbone ?? 'Unavailable'}</div>
              </div>
              <div>
                <div className="mono-label">Training dataset</div>
                <div className="mt-1 text-text">{modelTransparency?.training_dataset ?? 'Unavailable'}</div>
              </div>
              <div>
                <div className="mono-label">Evaluation dataset</div>
                <div className="mt-1 text-text">{modelTransparency?.evaluation_dataset ?? 'Unavailable'}</div>
              </div>
              <div>
                <div className="mono-label">Cross-dataset AUC</div>
                <div className="mt-1 font-mono text-2xl font-semibold text-text">{modelTransparency ? `${Math.round(modelTransparency.cross_dataset_auc * 100)}%` : '--'}</div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <p className="panel-title">Notes</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
              {scan.analysis_notes.map((note) => (
                <li key={note} className="rounded-2xl border border-border bg-surfaceAlt px-4 py-3">{note}</li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/upload"
                className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white"
              >
                Scan another file
              </Link>
              <button
                type="button"
                onClick={() => {
                  setCurrentScan(scan);
                  navigate('/history');
                }}
                className="inline-flex items-center justify-center rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-text"
              >
                Open history
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
