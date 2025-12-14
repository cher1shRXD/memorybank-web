'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@cher1shrxd/loading';
import { toast } from '@cher1shrxd/toast';
import { notesApi } from '@/libs/notes';
import { useAuthStore } from '@/store/auth';
import { getStoredTokens, setAuthToken } from '@/libs/auth';
import NoteCard from '@/components/NoteCard';
import { NoteListItem } from '@/types/note';

export default function HomePage() {
  const [notes, setNotes] = useState<NoteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const tokens = getStoredTokens();
    if (!tokens) {
      router.push('/login');
      return;
    }
    
    setUser(tokens.user);
    setAuthToken();
    loadNotes();
  }, [router, setUser]);

  const loadNotes = async () => {
    try {
      const notesList = await notesApi.list();
      setNotes(notesList);
    } catch {
      toast.error('오류', '노트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Memory Bank</h1>
          <div className="flex gap-4">
            <button
              onClick={() => router.push('/graph')}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              지식 그래프
            </button>
            <button
              onClick={() => router.push('/notes/new')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              새 노트 만들기
            </button>
            <button
              onClick={() => {
                const { logout } = useAuthStore.getState();
                logout();
                router.push('/login');
              }}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {notes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">아직 작성한 노트가 없습니다.</p>
            <button
              onClick={() => router.push('/notes/new')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              첫 번째 노트 만들기
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
