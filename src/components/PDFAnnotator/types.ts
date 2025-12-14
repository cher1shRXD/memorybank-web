export interface DrawingTool {
  type: 'pen' | 'eraser' | 'highlighter' | 'select';
  color: string;
  width: number;
  opacity: number;
}

export interface Annotation {
  pageNumber: number;
  canvasData: string; // JSON string from fabric.js
}

export interface PDFAnnotatorProps {
  pdfUrl: string;
  initialAnnotations?: Annotation[];
  onSave?: (annotations: Annotation[]) => void;
  readOnly?: boolean;
}