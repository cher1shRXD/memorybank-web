'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Canvas } from 'fabric';
import useMeasure from 'react-use-measure';
import DrawingCanvas from './DrawingCanvas';
import ToolPanel from './ToolPanel';
import ShortcutsPanel from './ShortcutsPanel';
import { PDFAnnotatorProps, DrawingTool, Annotation } from './types';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PDFAnnotator({
  pdfUrl,
  initialAnnotations = [],
  onSave,
  readOnly = false,
}: PDFAnnotatorProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [tool, setTool] = useState<DrawingTool>({
    type: 'pen',
    color: '#000000',
    width: 2,
    opacity: 1,
  });
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [containerRef, bounds] = useMeasure();
  const canvasRefs = useRef<Map<number, Canvas>>(new Map());

  // Load PDF
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    
    // Load initial annotations
    initialAnnotations.forEach(annotation => {
      const canvas = canvasRefs.current.get(annotation.pageNumber);
      if (canvas && annotation.canvasData) {
        canvas.loadFromJSON(annotation.canvasData, () => {
          canvas.renderAll();
        });
      }
    });
  };

  // Handle page load
  const onPageLoadSuccess = (page: { width: number; height: number }) => {
    const { width, height } = page;
    setPageSize({ width, height });
    
    // Calculate scale to fit container
    if (bounds.width > 0) {
      const newScale = Math.min(
        bounds.width / width,
        (bounds.height - 200) / height,
        2 // Max zoom 200%
      );
      setScale(newScale);
    }
  };

  // Handle canvas ready
  const handleCanvasReady = useCallback((canvas: Canvas, pageNum: number) => {
    canvasRefs.current.set(pageNum, canvas);
    
    // Load existing annotation for this page
    const existingAnnotation = initialAnnotations.find(a => a.pageNumber === pageNum);
    if (existingAnnotation && existingAnnotation.canvasData) {
      canvas.loadFromJSON(existingAnnotation.canvasData, () => {
        canvas.renderAll();
      });
    }
  }, [initialAnnotations]);

  // Save annotations
  const saveAnnotations = useCallback(() => {
    if (!onSave) return;

    const savedAnnotations: Annotation[] = [];
    canvasRefs.current.forEach((canvas, pageNumber) => {
      if (canvas.getObjects().length > 0) {
        savedAnnotations.push({
          pageNumber,
          canvasData: JSON.stringify(canvas.toJSON()),
        });
      }
    });
    
    onSave(savedAnnotations);
  }, [onSave]);

  // Handle tool change
  const handleToolChange = (updates: Partial<DrawingTool>) => {
    setTool(prev => ({ ...prev, ...updates }));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tool shortcuts
      if (!e.ctrlKey && !e.metaKey && !e.altKey) {
        switch(e.key) {
          case '1':
            setTool(prev => ({ ...prev, type: 'pen' }));
            break;
          case '2':
            setTool(prev => ({ ...prev, type: 'highlighter' }));
            break;
          case '3':
            setTool(prev => ({ ...prev, type: 'eraser' }));
            break;
          case '4':
            setTool(prev => ({ ...prev, type: 'select' }));
            break;
          case '+':
          case '=':
            e.preventDefault();
            setScale(s => Math.min(2, s + 0.1));
            break;
          case '-':
            e.preventDefault();
            setScale(s => Math.max(0.5, s - 0.1));
            break;
        }
      }
      
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case 'z':
            e.preventDefault();
            const currentCanvas = canvasRefs.current.get(currentPage);
            if (currentCanvas && !e.shiftKey) {
              // Undo
              const objects = currentCanvas.getObjects();
              if (objects.length > 0) {
                currentCanvas.remove(objects[objects.length - 1]);
              }
            }
            break;
          case 's':
            e.preventDefault();
            saveAnnotations();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, saveAnnotations]);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
          </button>
          <span className="text-sm">
            {currentPage} / {numPages || '?'}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
            disabled={currentPage === numPages}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Zoom controls */}
          <button
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13H5v-2h14v2z"/>
            </svg>
          </button>
          <span className="text-sm w-16 text-center">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => setScale(s => Math.min(2, s + 0.1))}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
          </button>
          
          {!readOnly && (
            <>
              <div className="h-8 w-px bg-gray-300" />
              <button
                onClick={saveAnnotations}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                저장
              </button>
            </>
          )}
        </div>
      </div>

      {/* PDF Viewer */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-200 p-8">
        <div className="mx-auto" style={{ width: pageSize.width * scale }}>
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            className="shadow-xl"
          >
            <div className="relative bg-white">
              <Page
                pageNumber={currentPage}
                scale={scale}
                onLoadSuccess={onPageLoadSuccess}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
              {pageSize.width > 0 && (
                <DrawingCanvas
                  width={pageSize.width}
                  height={pageSize.height}
                  tool={tool}
                  pageNumber={currentPage}
                  scale={scale}
                  onCanvasReady={(canvas) => handleCanvasReady(canvas, currentPage)}
                  readOnly={readOnly}
                />
              )}
            </div>
          </Document>
        </div>
      </div>

      {/* Tool Panel */}
      {!readOnly && (
        <>
          <ToolPanel
            currentTool={tool}
            onToolChange={handleToolChange}
          />
          <ShortcutsPanel />
        </>
      )}

      {/* Page thumbnails sidebar */}
      <div className="fixed right-4 top-24 bottom-24 w-32 bg-white rounded-lg shadow-lg overflow-y-auto">
        <div className="p-2 space-y-2">
          {Array.from({ length: numPages }, (_, i) => i + 1).map(pageNum => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`w-full p-2 rounded border-2 transition-all ${
                currentPage === pageNum 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-xs text-gray-600">페이지 {pageNum}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}