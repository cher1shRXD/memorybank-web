import { apiClient } from './api-client';
import { GraphResponse, ConceptGraphResponse } from '@/types/graph';

export const graphApi = {
  getGraph: async () => {
    const response = await apiClient.get<GraphResponse>('/graph');
    return response.data;
  },

  getConceptGraph: async (name: string) => {
    const response = await apiClient.get<ConceptGraphResponse>(`/graph/concept/${encodeURIComponent(name)}`);
    return response.data;
  }
};