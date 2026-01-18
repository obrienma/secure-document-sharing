import api from './api';

export interface CreateLinkData {
  documentId: number;
  expiresInHours?: number;
  password?: string;
  maxViews?: number;
  allowDownload?: boolean;
}

export interface ShareLink {
  id: number;
  document_id: number;
  token: string;
  password_hash: string | null;
  expires_at: string | null;
  max_views: number | null;
  view_count: number;
  allow_download: boolean;
  created_at: string;
}

export const linksAPI = {
  create: async (data: CreateLinkData): Promise<ShareLink> => {
    const response = await api.post('/api/links', data);
    return response.data.link;
  },

  getByDocument: async (documentId: number): Promise<ShareLink[]> => {
    const response = await api.get(`/api/links/document/${documentId}`);
    return response.data.links;
  },

  delete: async (linkId: number): Promise<void> => {
    await api.delete(`/api/links/${linkId}`);
  },
};
