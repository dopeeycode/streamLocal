export interface Media {
  id: string;
  title: string;
  filePath: string;
  createdAt: string;
  duration?: number;
  qualities?: Record<string, string>;
  processed: boolean;
}

export interface Manifest {
  id: string;
  title: string;
  qualities: Record<string, { url: string; segments: number }>;
  createdAt: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface UploadResponse {
  media: Media;
}

export interface ProcessResponse {
  message: string;
  manifest: Manifest;
}

export interface QualityOption {
  value: string;
  label: string;
  bitrate: string;
}