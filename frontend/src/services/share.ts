import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ShareAccessResponse {
  success: boolean;
  requiresPassword: boolean;
  document?: {
    id: number;
    filename: string;
    originalFilename: string;
    mimeType: string;
    fileSize: string;
    description?: string;
  };
  link?: {
    viewCount: number;
    maxViews?: number;
    expiresAt?: string;
    allowDownload: boolean;
  };
  message?: string;
}

export const shareAPI = {
  verifyAccess: async (token: string, password?: string): Promise<ShareAccessResponse> => {
    const response = await axios.post(`${API_BASE_URL}/share/${token}/verify`, {
      password,
    });
    return response.data;
  },

  download: async (token: string, password?: string): Promise<Blob> => {
    const response = await axios.post(
      `${API_BASE_URL}/share/${token}/download`,
      { password },
      { responseType: 'blob' }
    );
    return response.data;
  },
};
