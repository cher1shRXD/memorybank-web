'use client';

import { useState } from 'react';
import { useRouter } from '@cher1shrxd/loading';
import { toast } from '@cher1shrxd/toast';
import { notesApi } from '@/libs/notes';
import { NoteCreateRequest } from '@/types/note';

export default function NewNotePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [drawingData, setDrawingData] = useState('');

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const generateThumbnail = async (): Promise<string> => {
    // For now, create a simple placeholder thumbnail
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 400, 300);
      
      // Add text
      ctx.fillStyle = '#666';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('새 노트', 200, 150);
    }
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
          reader.readAsDataURL(blob);
        }
      }, 'image/png');
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      const noteData: NoteCreateRequest = {
        drawing_data: drawingData || '',
        thumbnail: await generateThumbnail()
      };
      
      if (file) {
        noteData.pdf_file = await fileToBase64(file);
      }
      
      const newNote = await notesApi.create(noteData);
      toast.success('성공', '노트가 생성되었습니다.');
      router.push(`/notes/${newNote.id}`);
    } catch {
      toast.error('오류', '노트 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← 목록으로
            </button>
            <h1 className="text-2xl font-bold text-gray-900">새 노트 만들기</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PDF 파일 (선택사항)
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              드로잉 데이터 (선택사항)
            </label>
            <textarea
              value={drawingData}
              onChange={(e) => setDrawingData(e.target.value)}
              placeholder="PencilKit 드로잉 벡터 데이터"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              rows={4}
            />
          </div>

          <div className="text-center text-sm text-gray-500 mb-6">
            노트는 생성 후 수정 페이지에서 내용을 추가할 수 있습니다.
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? '생성 중...' : '노트 만들기'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}