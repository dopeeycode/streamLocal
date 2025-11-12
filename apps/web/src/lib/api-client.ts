import type { Media, Manifest, UploadResponse, ProcessResponse } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Upload de arquivo
  async uploadFile(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<UploadResponse>('/upload', {
      method: 'POST',
      body: formData,
    });
  }

  // Processar mídia
  async processMedia(mediaId: string): Promise<ProcessResponse> {
    return this.request<ProcessResponse>(`/process/${mediaId}`, {
      method: 'POST',
    });
  }

  // Buscar manifest de mídia
  async getMediaManifest(mediaId: string): Promise<Manifest> {
    return this.request<Manifest>(`/media/${mediaId}`);
  }

  // Listar todas as mídias (vou criar essa rota no backend também)
  async listMedia(): Promise<Media[]> {
    return this.request<Media[]>('/media');
  }

  // Buscar mídia específica
  async getMedia(mediaId: string): Promise<Media> {
    return this.request<Media>(`/media/${mediaId}/info`);
  }

  // Deletar mídia
  async deleteMedia(mediaId: string): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/media/${mediaId}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();