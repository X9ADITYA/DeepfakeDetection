import { useNavigate } from 'react-router-dom';

import { FileDropzone } from '../components/FileDropzone';
import { useScan } from '../context/scan';

export function UploadPage() {
  const navigate = useNavigate();
  const { setUploadState } = useScan();

  function handleFileSelected(file: File) {
    const previewUrl = URL.createObjectURL(file);
    const mediaType = file.type.startsWith('video') ? 'video' : 'image';
    setUploadState({ file, previewUrl, mediaType });
    navigate('/processing');
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr,0.8fr]">
      <FileDropzone acceptLabel="video or image" onFileSelected={handleFileSelected} />

      <aside className="glass-card p-6">
        <p className="panel-title">Flow</p>
        <ol className="mt-5 space-y-4 text-sm leading-6 text-muted">
          <li className="rounded-2xl border border-border bg-surfaceAlt px-4 py-4">
            <span className="font-semibold text-text">1. Upload media.</span> Video is preferred, image is supported as a single-frame forensic pass.
          </li>
          <li className="rounded-2xl border border-border bg-surfaceAlt px-4 py-4">
            <span className="font-semibold text-text">2. Watch the analysis run.</span> The screen shows bounding boxes, frame scores, and pipeline logs as the scan progresses.
          </li>
          <li className="rounded-2xl border border-border bg-surfaceAlt px-4 py-4">
            <span className="font-semibold text-text">3. Review the verdict.</span> You get confidence, heatmap evidence, and the model transparency panel in the result view.
          </li>
        </ol>
      </aside>
    </section>
  );
}
