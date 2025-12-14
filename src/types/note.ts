export interface ConceptItem {
  name: string;
  context: string;
  confidence: string;
}

export interface RelationItem {
  from: string;
  to: string;
  type: string;
}

export interface NoteCreateRequest {
  drawing_data?: string;
  pdf_file?: string;
  thumbnail: string;
}

export interface NoteUpdateRequest {
  drawing_data?: string;
  pdf_file?: string;
  thumbnail?: string;
}

export interface Note {
  id: string;
  drawing_data?: string;
  pdf_url?: string;
  thumbnail_url?: string;
  description?: string;
  concepts?: ConceptItem[];
  relations?: RelationItem[];
  created_at: string;
  updated_at: string;
}

export interface NoteListItem {
  id: string;
  thumbnail_url?: string;
  description?: string;
  concepts?: ConceptItem[];
  created_at: string;
}

export interface DeleteResponse {
  success: boolean;
  message?: string;
}