import api from './api';

export interface Document {
  id: number;
  filename: string;
  size: string;
  type: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentStats {
  totalDocuments: number;
  totalSize: number;
  recentUploads: number;
}

export const documentsAPI = {
  upload: async (file: File, description?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    const { data } = await api.post('/api/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  getAll: async () => {
    const { data } = await api.get<{ documents: Document[] }>('/api/documents/');
    return data.documents;
  },

  getById: async (id: number) => {
    const { data } = await api.get<{ document: Document }>(`/api/documents/${id}`);
    return data.document;
  },

  update: async (id: number, description: string) => {
    const { data } = await api.patch(`/api/documents/${id}`, { description });
    return data;
  },

  delete: async (id: number) => {
    const { data } = await api.delete(`/api/documents/${id}`);
    return data;
  },

  getStats: async () => {
    const { data } = await api.get<{ stats: DocumentStats }>('/api/documents/stats/summary');
    return data.stats;
  },
};
