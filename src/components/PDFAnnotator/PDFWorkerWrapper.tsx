'use client';

import { pdfjs } from 'react-pdf';
import SimplePDFAnnotator from './SimplePDFAnnotator';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  // Use local worker file from public directory
  pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export default SimplePDFAnnotator;