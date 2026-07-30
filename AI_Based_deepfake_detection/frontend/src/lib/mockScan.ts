import type { ModelTransparency, ScanResult, UploadState } from './types';

export const modelTransparency: ModelTransparency = {
  backbone: 'EfficientNet-B4',
  training_dataset: 'FaceForensics++',
  evaluation_dataset: 'Celeb-DF v2',
  cross_dataset_auc: 0.72,
  confidence_threshold: 0.5,
  notes: [
    'The model interface is ready for trained checkpoints and ONNX export.',
    'Cross-dataset generalization is surfaced in-product as a first-class transparency metric.',
  ],
};

export function buildMockScan(file: File, sessionId: string): ScanResult {
  const isVideo = file.type.startsWith('video');
  const confidenceSeed = Math.min(0.94, Math.max(0.12, file.size / (isVideo ? 120_000_000 : 6_000_000)) + 0.36);
  const confidence = Number(confidenceSeed.toFixed(4));
  const verdict = confidence >= modelTransparency.confidence_threshold ? 'fake' : 'real';

  return {
    id: crypto.randomUUID(),
    session_id: sessionId,
    media_type: isVideo ? 'video' : 'image',
    filename: file.name,
    verdict,
    confidence,
    heatmap_url: '',
    created_at: new Date().toISOString(),
    per_frame_scores: isVideo
      ? Array.from({ length: 8 }, (_, index) => Number((confidence - 0.1 + index * 0.01).toFixed(4)))
      : [confidence],
    analysis_notes: [
      'Mock analysis generated because the backend is not reachable yet.',
      'Replace this with the live inference response once weights are connected.',
    ],
    pipeline_stages: [
      'Uploading media',
      'Detecting faces',
      'Extracting forensic features',
      'Rendering evidence overlay',
    ],
    frame_count: isVideo ? 8 : 1,
    preview_url: URL.createObjectURL(file),
  };
}
