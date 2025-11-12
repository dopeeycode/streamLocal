import { apiClient } from "./api-client";

export async function fetchManifest(id: string) {
  return apiClient.getMediaManifest(id);
}
