import { useRef, useState, type DragEvent, type ChangeEvent } from 'react';

interface FileDropzoneProps {
  acceptLabel: string;
  onFileSelected: (file: File) => void;
}

export function FileDropzone({ acceptLabel, onFileSelected }: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);

  function handleFile(file: File | undefined) {
    if (!file) {
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      setValidationMessage('Use an image or video file.');
      return;
    }

    setValidationMessage(null);
    onFileSelected(file);
  }

  function onInputChange(event: ChangeEvent<HTMLInputElement>) {
    handleFile(event.target.files?.[0]);
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  return (
    <div
      className={[
        'glass-card border-dashed px-5 py-8 transition',
        isDragging ? 'border-accent bg-accentSoft/40' : 'border-border/90 bg-surface/80',
      ].join(' ')}
      onDragEnter={() => setIsDragging(true)}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        className="sr-only"
        onChange={onInputChange}
      />

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <p className="panel-title">Upload media</p>
          <h2 className="mt-3 text-2xl font-semibold text-text sm:text-3xl">Drop a video or still frame for forensic analysis.</h2>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
            We inspect faces, track frame-level consistency, and render an evidence overlay that highlights where the model saw suspicious artifacts.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            onClick={() => inputRef.current?.click()}
          >
            Choose file
          </button>
          <div className="rounded-full border border-border bg-surfaceAlt px-4 py-3 text-xs font-mono uppercase tracking-[0.24em] text-muted">
            {acceptLabel}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border/80 bg-bg/70 px-4 py-5 text-sm text-muted">
        <p className="mono-label">Validation</p>
        <p className="mt-2">Accepted: MP4, MOV, AVI, WEBM, JPG, PNG, WEBP.</p>
        <p className="mt-1">Preferred: frontal faces with visible motion or expression change.</p>
        {validationMessage ? <p className="mt-2 font-medium text-red-500">{validationMessage}</p> : null}
      </div>
    </div>
  );
}
