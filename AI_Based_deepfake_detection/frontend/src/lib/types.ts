export type Verdict = 'real' | 'fake';
export type MediaKind = 'image' | 'video';

export interface ModelTransparency {
  backbone: string;
  training_dataset: string;
  evaluation_dataset: string;
  cross_dataset_auc: number;
  confidence_threshold: number;
  notes?: string[];
}

export interface ScanResult {
  id: string;
  session_id?: string | null;
  media_type: MediaKind;
  filename: string;
  verdict: Verdict;
  confidence: number;
  heatmap_url: string;
  created_at: string;
  per_frame_scores: number[];
  analysis_notes: string[];
  pipeline_stages: string[];
  frame_count: number;
  preview_url?: string;
}

export interface UploadState {
  file: File;
  previewUrl: string;
  mediaType: MediaKind;
}
