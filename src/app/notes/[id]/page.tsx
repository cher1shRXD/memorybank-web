'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from '@cher1shrxd/loading';
import { toast } from '@cher1shrxd/toast';
import { modal } from '@cher1shrxd/modal';
import { notesApi } from '@/libs/notes';
import { Note } from '@/types/note';
import { getStoredTokens, setAuthToken } from '@/libs/auth';

interface PageParams {
  params: Promise<{ id: string }>;
}

export default function NoteDetailPage({ params: paramsPromise }: PageParams) {
  const params = use(paramsPromise);
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const tokens = getStoredTokens();
    if (!tokens) {
      router.push('/login');
      return;
    }
    
    setAuthToken();
    
    const loadNote = async () => {
      try {
        const noteData = await notesApi.get(params.id);
        setNote(noteData);
      } catch {
        toast.error('오류', '노트를 불러오는데 실패했습니다.');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    
    loadNote();
  }, [params.id, router]);

  const handleDelete = () => {
    modal.open(
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">노트 삭제</h3>
        <p className="text-gray-700 mb-6">
          이 노트를 정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => modal.close()}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            취소
          </button>
          <button
            onClick={async () => {
              try {
                await notesApi.delete(params.id);
                toast.success('성공', '노트가 삭제되었습니다.');
                modal.close();
                router.push('/');
              } catch {
                toast.error('오류', '노트 삭제에 실패했습니다.');
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            삭제
          </button>
        </div>
      </div>
    );
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
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              ← 목록으로
            </button>
            <h1 className="text-2xl font-bold text-gray-900">노트 상세</h1>
          </div>
          <div className="flex gap-2">
            {note.pdf_url && (
              <button
                onClick={() => router.push(`/notes/${params.id}/annotate`)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                PDF 주석
              </button>
            )}
            <button
              onClick={() => router.push(`/notes/${params.id}/edit`)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              수정
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              삭제
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          {note.thumbnail_url && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={`${process.env.NEXT_PUBLIC_API_BASE_URL}${note.thumbnail_url}`}
              alt="Note thumbnail"
              className="w-full max-h-96 object-contain mb-6"
            />
          )}
          
          <div className="mb-4">
            <p className="text-gray-500 text-sm">
              생성일: {new Date(note.created_at).toLocaleDateString('ko-KR')}
            </p>
            <p className="text-gray-500 text-sm">
              수정일: {new Date(note.updated_at).toLocaleDateString('ko-KR')}
            </p>
          </div>

          {note.description && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">설명</h2>
              <p className="text-gray-700">{note.description}</p>
            </div>
          )}

          {note.concepts && note.concepts.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">개념</h2>
              <div className="space-y-2">
                {note.concepts.map((concept, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4">
                    <h3 className="font-medium">{concept.name}</h3>
                    <p className="text-gray-600 text-sm">{concept.context}</p>
                    <span className={`inline-block mt-1 text-xs px-2 py-1 rounded ${
                      concept.confidence === '확실함' ? 'bg-green-100 text-green-800' :
                      concept.confidence === '이해함' ? 'bg-blue-100 text-blue-800' :
                      concept.confidence === '헷갈림' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {concept.confidence}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {note.relations && note.relations.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">관계</h2>
              <div className="space-y-1">
                {note.relations.map((relation, index) => (
                  <p key={index} className="text-gray-700">
                    {relation.from} → {relation.to} ({relation.type})
                  </p>
                ))}
              </div>
            </div>
          )}

          {note.pdf_url && (
            <div className="mt-6">
              <button
                onClick={async () => {
                  const token = localStorage.getItem('access_token');
                  const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/notes/${params.id}/pdf`, {
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });
                  const blob = await response.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `note_${params.id}.pdf`;
                  document.body.appendChild(a);
                  a.click();
                  window.URL.revokeObjectURL(url);
                  a.remove();
                }}
                className="inline-block px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                PDF 다운로드
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}