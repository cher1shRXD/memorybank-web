'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from '@cher1shrxd/loading';
import dynamic from 'next/dynamic';
import { toast } from '@cher1shrxd/toast';
import { notesApi } from '@/libs/notes';
import { Note, NoteUpdateRequest } from '@/types/note';
import { getStoredTokens, setAuthToken } from '@/libs/auth';

// Dynamic import to avoid SSR issues
const PDFAnnotator = dynamic(
  () => import('@/components/PDFAnnotator/PDFWorkerWrapper'),
  { 
    ssr: false,
    loading: () => <div className="min-h-screen flex items-center justify-center">로딩 중...</div>
  }
);

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function AnnotatePage({ params: paramsPromise }: PageParams) {
  const params = use(paramsPromise);
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [drawingData, setDrawingData] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const tokens = getStoredTokens();
    if (!tokens) {
      router.push('/login');
      return;
    }
    
    setAuthToken();
    loadNote();
  }, [params.id]);
  
  // annotate 페이지에서만 body 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.style.height = '100vh';
    document.documentElement.style.height = '100vh';
    
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.style.height = '';
      document.documentElement.style.height = '';
    };
  }, []);

  const loadNote = async () => {
    try {
      const noteData = await notesApi.get(params.id);
      setNote(noteData);
      
      // Load drawing data
      if (noteData.drawing_data) {
        setDrawingData(noteData.drawing_data);
      }
    } catch (error) {
      toast.error('오류', '노트를 불러오는데 실패했습니다.');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (drawingData: string) => {
    if (!note) return;

    try {
      // Create thumbnail from first page with annotations
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Draw white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 800, 600);
        
        // Draw PDF and annotations preview
        ctx.fillStyle = '#666';
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('필기 노트', 400, 300);
      }
      
      const thumbnailBase64 = canvas.toDataURL('image/png').split(',')[1];

      const updateData: NoteUpdateRequest = {
        drawing_data: drawingData,
        thumbnail: thumbnailBase64
      };

      await notesApi.update(params.id, updateData);
      toast.success('성공', '필기가 저장되었습니다.');
    } catch (error) {
      toast.error('오류', '필기 저장에 실패했습니다.');
    }
  };

  const handleClose = () => {
    router.push(`/notes/${params.id}`);
  };

  if (loading || !note) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!note.pdf_url) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">PDF 파일이 없습니다.</p>
          <button
            onClick={() => router.push(`/notes/${params.id}`)}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  // Use PDF URL from the note
  const pdfUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}${note.pdf_url}`;

  return (
    <div className="fixed inset-0 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm px-4 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleClose}
            className="text-gray-600 hover:text-gray-900 text-sm"
          >
            ← 돌아가기
          </button>
          <h1 className="text-lg font-semibold">필기 편집</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClose}
            className="px-3 py-1 text-gray-700 hover:text-gray-900 text-sm"
          >
            취소
          </button>
        </div>
      </div>

      {/* PDF Annotator */}
      <div className="flex-1 overflow-hidden">
        <PDFAnnotator
          pdfUrl={pdfUrl}
          initialDrawingData={drawingData}
          onSave={handleSave}
          readOnly={false}
        />
      </div>
    </div>
  );
}