'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Worker configuration moved to PDFWorkerWrapper

interface PDFAnnotatorProps {
  pdfUrl: string;
  initialDrawingData?: string;
  onSave?: (drawingData: string) => void;
  readOnly?: boolean;
}

interface Tool {
  type: 'pen' | 'eraser' | 'highlighter';
  color: string;
  width: number;
}


export default function SimplePDFAnnotator({
  pdfUrl,
  initialDrawingData = '',
  onSave,
  readOnly = false,
}: PDFAnnotatorProps) {
  // Get auth token for PDF loading
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [pdfError, setPdfError] = useState<string>('');
  
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token && pdfUrl) {
      // Fetch PDF with auth header
      fetch(pdfUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.arrayBuffer();
      })
      .then(arrayBuffer => {
        // Convert arrayBuffer directly
        setPdfData(arrayBuffer);
      })
      .catch(err => {
        console.error('Failed to load PDF:', err);
        setPdfError('PDF 로딩 실패');
      });
    }
  }, [pdfUrl]);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const scale = 1; // 100% 고정
  const [tool, setTool] = useState<Tool>({
    type: 'pen',
    color: '#000000',
    width: 2,
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const [paths, setPaths] = useState<Map<number, string>>(new Map());
  const [inputMode, setInputMode] = useState<'pen' | 'touch' | 'mouse' | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved paths
  useEffect(() => {
    if (initialDrawingData) {
      try {
        const savedPaths = new Map<number, string>(JSON.parse(initialDrawingData));
        // Use a timeout to avoid setting state during render
        setTimeout(() => {
          setPaths(savedPaths);
        }, 0);
      } catch (e) {
        console.error('Failed to parse drawing data:', e);
      }
    }
  }, [initialDrawingData]);

  // Setup canvas
  useEffect(() => {
    if (!canvasRef.current || pageSize.width === 0) return;

    const canvas = canvasRef.current;
    canvas.width = pageSize.width * scale;
    canvas.height = pageSize.height * scale;
    
    const context = canvas.getContext('2d');
    if (context) {
      context.scale(scale, scale);
      context.lineCap = 'round';
      context.lineJoin = 'round';
      contextRef.current = context;

      // Restore saved drawing for current page
      const savedPath = paths.get(currentPage);
      if (savedPath) {
        const img = new Image();
        img.onload = () => {
          context.clearRect(0, 0, pageSize.width, pageSize.height);
          context.drawImage(img, 0, 0);
        };
        img.src = savedPath;
      }
    }
  }, [pageSize, scale, currentPage, paths]);

  // Save current canvas to paths
  const saveCurrentCanvas = useCallback(() => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL();
      setPaths(prev => {
        const newPaths = new Map(prev);
        newPaths.set(currentPage, dataUrl);
        return newPaths;
      });
    }
  }, [currentPage]);

  // Pointer handlers for Apple Pencil support
  const startDrawing = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (readOnly || !contextRef.current) return;
    
    // 입력 모드 설정
    setInputMode(e.pointerType as 'pen' | 'touch' | 'mouse');
    
    // 손가락 터치는 무시 (스크롤용)
    if (e.pointerType === 'touch') {
      return;
    }
    
    // 이벤트 기본 동작 방지
    e.preventDefault();
    e.stopPropagation();
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    
    if (tool.type === 'eraser') {
      contextRef.current.globalCompositeOperation = 'destination-out';
      contextRef.current.lineWidth = tool.width * 3;
    } else {
      contextRef.current.globalCompositeOperation = 'source-over';
      contextRef.current.strokeStyle = tool.type === 'highlighter' 
        ? `${tool.color}4D` // 30% opacity for highlighter
        : tool.color;
      
      // Apple Pencil 필압 적용
      const pressure = e.pointerType === 'pen' ? e.pressure : 0.5;
      contextRef.current.lineWidth = tool.width * (0.5 + pressure * 0.5);
    }
    
    setIsDrawing(true);
    
    // Pointer capture로 부드러운 그리기
    canvasRef.current?.setPointerCapture(e.pointerId);
  }, [readOnly, tool, scale]);

  const draw = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current) return;
    
    // 손가락 터치는 무시
    if (e.pointerType === 'touch') return;
    
    // 이벤트 기본 동작 방지
    e.preventDefault();
    e.stopPropagation();
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    // Apple Pencil 필압에 따른 선 굵기 동적 조정
    if (e.pointerType === 'pen' && tool.type !== 'eraser') {
      const pressure = e.pressure || 0.5;
      contextRef.current.lineWidth = tool.width * (0.5 + pressure * 0.5);
    }
    
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();
    
    // 부드러운 곡선을 위해 path 재시작
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
  }, [isDrawing, tool, scale]);

  const stopDrawing = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDrawing) {
      setIsDrawing(false);
      saveCurrentCanvas();
      canvasRef.current?.releasePointerCapture(e.pointerId);
      
    }
  }, [isDrawing, saveCurrentCanvas]);

  // Pan/Scroll with touch
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    // 필기 중이면 터치 이벤트 무시
    if (isDrawing) {
      e.preventDefault();
      return;
    }
    
    if (e.touches.length === 1) {
      setIsPanning(true);
      setPanStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    }
  }, [isDrawing]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    // 필기 중이면 터치 이벤트 무시
    if (isDrawing) {
      e.preventDefault();
      return;
    }
    
    if (isPanning && e.touches.length === 1 && scrollContainerRef.current) {
      const deltaX = panStart.x - e.touches[0].clientX;
      const deltaY = panStart.y - e.touches[0].clientY;
      
      const container = scrollContainerRef.current;
      container.scrollTo({
        left: container.scrollLeft + deltaX,
        top: container.scrollTop + deltaY,
        behavior: 'instant'
      });
      
      setPanStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    }
  }, [isDrawing, isPanning, panStart]);

  const handleTouchEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Save all annotations
  const handleSave = useCallback(async () => {
    if (onSave && !isSaving) {
      setIsSaving(true);
      try {
        saveCurrentCanvas();
        const pathsArray = Array.from(paths.entries());
        await onSave(JSON.stringify(pathsArray));
      } finally {
        setIsSaving(false);
      }
    }
  }, [onSave, paths, saveCurrentCanvas, isSaving]);

  // Clear current page
  const clearCanvas = useCallback(() => {
    if (contextRef.current) {
      contextRef.current.clearRect(0, 0, pageSize.width, pageSize.height);
      setPaths(prev => {
        const newPaths = new Map(prev);
        newPaths.delete(currentPage);
        return newPaths;
      });
    }
  }, [currentPage, pageSize]);

  // PDF callbacks
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const onPageLoadSuccess = (page: { width: number; height: number }) => {
    const { width, height } = page;
    setPageSize({ width, height });
  };

  // Change page
  const changePage = (newPage: number) => {
    saveCurrentCanvas();
    setCurrentPage(newPage);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'p':
          setTool(prev => ({ ...prev, type: 'pen' }));
          break;
        case 'h':
          setTool(prev => ({ ...prev, type: 'highlighter' }));
          break;
        case 'e':
          setTool(prev => ({ ...prev, type: 'eraser' }));
          break;
        case 'escape':
          setInputMode(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Memoize PDF file object
  const pdfFile = useMemo(() => pdfData ? { data: pdfData } : undefined, [pdfData]);

  if (pdfError) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 mb-4">{pdfError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (!pdfData) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">PDF 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => changePage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-2 py-0.5 rounded hover:bg-gray-100 disabled:opacity-50 text-xs"
          >
            ← 이전
          </button>
          <span className="text-xs">
            {currentPage} / {numPages || '?'}
          </span>
          <button
            onClick={() => changePage(Math.min(numPages, currentPage + 1))}
            disabled={currentPage === numPages}
            className="px-2 py-0.5 rounded hover:bg-gray-100 disabled:opacity-50 text-xs"
          >
            다음 →
          </button>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={clearCanvas}
              className="px-2 py-0.5 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs"
            >
              지우기
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-2 py-0.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs disabled:bg-blue-300"
            >
              {isSaving ? '저장 중...' : '저장'}
            </button>
          </div>
        )}
        
        {/* 입력 모드 표시 */}
        {inputMode && (
          <div className="absolute bottom-4 right-4 z-999 bg-black bg-opacity-75 text-white px-3 py-2 rounded-lg text-sm">
            {inputMode === 'pen' ? '🖊️ Apple Pencil' : 
             inputMode === 'touch' ? '👆 손가락 터치' : 
             '🖱️ 마우스'}
          </div>
        )}
      </div>

      {/* PDF and Canvas */}
      <div 
        ref={scrollContainerRef} 
        className="flex-1 bg-gray-200 p-4 overflow-auto"
      >
        <div className="mx-auto relative" style={{ width: pageSize.width * scale }}>
          <Document
            file={pdfFile}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={(error) => {
              console.error('PDF load error:', error);
              setPdfError('PDF 로딩 오류: ' + error.message);
            }}
            loading={
              <div className="flex items-center justify-center h-96 bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
              </div>
            }
            className="shadow-xl"
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              onLoadSuccess={onPageLoadSuccess}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
          {pageSize.width > 0 && (
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0"
              style={{ 
                pointerEvents: readOnly ? 'none' : 'auto',
                touchAction: 'none', // 캔버스 영역에서만 터치 스크롤 방지
                cursor: tool.type === 'pen' ? 'crosshair' : 
                        tool.type === 'highlighter' ? 'text' :
                        tool.type === 'eraser' ? 'grab' : 'auto'
              }}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              onPointerLeave={stopDrawing}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            />
          )}
        </div>
      </div>

      {/* Tool Panel */}
      {!readOnly && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-xl p-2 flex items-center gap-2 z-10">
          <div className="flex gap-1">
            <button
              onClick={() => setTool({ ...tool, type: 'pen' })}
              className={`p-2 rounded transition-all ${
                tool.type === 'pen' ? 'bg-blue-500 text-white scale-105' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title="펜 (P)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
            </button>
            <button
              onClick={() => setTool({ ...tool, type: 'highlighter' })}
              className={`p-2 rounded transition-all ${
                tool.type === 'highlighter' ? 'bg-yellow-500 text-white scale-105' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title="형광펜 (H)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.75 7L14 3.25l-10 10V17h3.75l10-10zm2.96-2.96c.39-.39.39-1.02 0-1.41L18.37.29c-.39-.39-1.02-.39-1.41 0L15 2.25 18.75 6l1.96-1.96z"/>
                <path fillOpacity=".36" d="M0 20h24v4H0z"/>
              </svg>
            </button>
            <button
              onClick={() => setTool({ ...tool, type: 'eraser' })}
              className={`p-2 rounded transition-all ${
                tool.type === 'eraser' ? 'bg-red-500 text-white scale-105' : 'bg-gray-100 hover:bg-gray-200'
              }`}
              title="지우개 (E)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.14 3c-.51 0-1.02.2-1.41.59L2.59 14.73c-.78.78-.78 2.05 0 2.83L5.03 20h7.66l8.72-8.72c.78-.78.78-2.05 0-2.83l-4.85-4.85c-.39-.39-.9-.59-1.41-.59zM6 18.5l6-6L13.5 14l-6 6H6v-1.5z"/>
              </svg>
            </button>
          </div>

          {tool.type !== 'eraser' && (
            <>
              <div className="flex gap-1">
                {['#000000', '#FF0000', '#0000FF', '#00FF00', '#FFFF00'].map(color => (
                  <button
                    key={color}
                    onClick={() => setTool({ ...tool, color })}
                    className={`w-6 h-6 rounded-full border-2 ${
                      tool.color === color ? 'border-gray-800' : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <div className="flex gap-1">
                {[1, 2, 4, 8].map(width => (
                  <button
                    key={width}
                    onClick={() => setTool({ ...tool, width })}
                    className={`w-8 h-8 rounded border flex items-center justify-center ${
                      tool.width === width ? 'bg-gray-200 border-gray-400' : 'border-gray-300'
                    }`}
                  >
                    <div
                      className="rounded-full bg-black"
                      style={{
                        width: `${width * 1.5}px`,
                        height: `${width * 1.5}px`,
                      }}
                    />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}