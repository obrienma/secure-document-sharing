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

export interface UserLink {
  id: number;
  documentId: number;
  filename: string;
  linkToken: string;
  hasPassword: boolean;
  expiresAt: string | null;
  maxViews: number | null;
  viewCount: number;
  allowDownload: boolean;
  createdAt: string;
  lastAccessed: string | null;
  isExpired: boolean;
}

export const linksAPI = {
  create: async (data: CreateLinkData): Promise<ShareLink> => {
    const response = await api.post('/api/links', data);
    return response.data.link;
  },

  getAll: async (): Promise<UserLink[]> => {
    const response = await api.get('/api/links');
    return response.data.links;
  },

  getByDocument: async (documentId: number): Promise<ShareLink[]> => {
    const response = await api.get(`/api/links/document/${documentId}`);
    return response.data.links;
  },

  delete: async (linkId: number): Promise<void> => {
    await api.delete(`/api/links/${linkId}`);
  },
};
