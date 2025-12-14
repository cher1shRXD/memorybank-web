import { apiClient } from './api-client';
import {
  Note,
  NoteListItem,
  NoteCreateRequest,
  NoteUpdateRequest,
  DeleteResponse
} from '@/types/note';

export const notesApi = {
  create: async (data: NoteCreateRequest) => {
    const response = await apiClient.post<Note>('/notes', data);
    return response.data;
  },

  list: async () => {
    const response = await apiClient.get<NoteListItem[]>('/notes');
    return response.data;
  },

  get: async (noteId: string) => {
    const response = await apiClient.get<Note>(`/notes/${noteId}`);
    return response.data;
  },

  update: async (noteId: string, data: NoteUpdateRequest) => {
    const response = await apiClient.put<Note>(`/notes/${noteId}`, data);
    return response.data;
  },

  delete: async (noteId: string) => {
    const response = await apiClient.delete<DeleteResponse>(`/notes/${noteId}`);
    return response.data;
  },

  getPdfUrl: (noteId: string) => {
    return `${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${noteId}/pdf`;
  }
};