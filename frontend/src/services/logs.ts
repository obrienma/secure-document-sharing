import api from './api';

export interface AccessLog {
  id: number;
  shared_link_id: number;
  ip_address: string;
  user_agent: string;
  access_type: 'view' | 'download' | 'failed_password';
  success: boolean;
  accessed_at: string;
}

export const logsAPI = {
  getLinkLogs: async (linkId: number): Promise<AccessLog[]> => {
    const response = await api.get(`/api/links/${linkId}/logs`);
    return response.data.logs;
  },
};
