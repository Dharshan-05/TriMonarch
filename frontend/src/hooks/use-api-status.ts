import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { env } from '@/app/config/env.config';

interface HealthResponse {
  status?: string;
  uptime?: number;
  timestamp?: string;
}

export const useApiStatus = () => {
  return useQuery({
    queryKey: ['healthCheck'],
    queryFn: async (): Promise<HealthResponse> => {
      // Stripping trailing /v1 or /api/v1 for health endpoint if needed, or testing root origin health
      const baseUrl = env.VITE_API_BASE_URL.replace(/\/api\/v1\/?$/, '');
      const response = await axios.get<HealthResponse>(`${baseUrl}/health`, {
        timeout: 5000,
      });
      return response.data;
    },
    retry: 1,
    staleTime: 30000,
  });
};
