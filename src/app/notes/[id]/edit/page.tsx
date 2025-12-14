'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from '@cher1shrxd/loading';
import { toast } from '@cher1shrxd/toast';
import { notesApi } from '@/libs/notes';
import { Note, NoteUpdateRequest } from '@/types/note';
import { getStoredTokens, setAuthToken } from '@/libs/auth';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function EditNotePage({ params: paramsPromise }: PageParams) {
  const params = use(paramsPromise);
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [drawingData, setDrawingData] = useState('');
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

  const loadNote = async () => {
    try {
      const noteData = await notesApi.get(params.id);
      setNote(noteData);
      setDrawingData(noteData.drawing_data || '');
    } catch (error) {
      toast.error('오류', '노트를 불러오는데 실패했습니다.');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      const updateData: NoteUpdateRequest = {};
      
      if (drawingData !== note?.drawing_data) {
        updateData.drawing_data = drawingData;
      }
      
      if (file) {
        updateData.pdf_file = await fileToBase64(file);
      }
      
      if (thumbnailFile) {
        updateData.thumbnail = await fileToBase64(thumbnailFile);
      }
      
      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        await notesApi.update(params.id, updateData);
        toast.success('성공', '노트가 수정되었습니다.');
      }
      
      router.push(`/notes/${params.id}`);
    } catch (error) {
      toast.error('오류', '노트 수정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!note) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/notes/${params.id}`)}
              className="text-gray-600 hover:text-gray-900"
            >
              ← 돌아가기
            </button>
            <h1 className="text-2xl font-bold text-gray-900">노트 수정</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
          {note.thumbnail_url && (
            <div className="mb-6">
              <p className="block text-sm font-medium text-gray-700 mb-2">현재 썸네일</p>
              <img
                src={note.thumbnail_url}
                alt="Current thumbnail"
                className="w-full max-h-48 object-contain border border-gray-300 rounded"
              />
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              새 썸네일 이미지 (선택사항)
            </label>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              썸네일을 업데이트하면 AI가 자동으로 내용을 분석합니다.
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              새 PDF 파일 (선택사항)
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
              드로잉 데이터
            </label>
            <textarea
              value={drawingData}
              onChange={(e) => setDrawingData(e.target.value)}
              placeholder="PencilKit 드로잉 벡터 데이터"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              rows={4}
            />
          </div>

          {(note.description || !!note.concepts?.length) && (
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">AI 분석 결과</h3>
              {note.description && (
                <p className="text-sm text-gray-700 mb-2">{note.description}</p>
              )}
              {note.concepts && note.concepts.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {note.concepts.map((concept, index) => (
                    <span
                      key={index}
                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                    >
                      {concept.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => router.push(`/notes/${params.id}`)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? '저장 중...' : '변경사항 저장'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}