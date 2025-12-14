import { useState } from 'react';

export default function ShortcutsPanel() {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { keys: ['Ctrl', 'Z'], description: '실행 취소' },
    { keys: ['Ctrl', 'S'], description: '저장' },
    { keys: ['1'], description: '펜 도구' },
    { keys: ['2'], description: '형광펜' },
    { keys: ['3'], description: '지우개' },
    { keys: ['4'], description: '선택 도구' },
    { keys: ['+'], description: '확대' },
    { keys: ['-'], description: '축소' },
    { keys: ['Space'], description: '팬 모드 (누르고 있기)' },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 z-50"
        title="단축키 보기"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/>
        </svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 bg-white rounded-lg shadow-xl p-4 z-50">
          <h3 className="font-semibold mb-3">키보드 단축키</h3>
          <div className="space-y-2 text-sm">
            {shortcuts.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between gap-8">
                <div className="flex gap-1">
                  {shortcut.keys.map((key, i) => (
                    <span key={i}>
                      <kbd className="px-2 py-1 bg-gray-100 rounded border border-gray-300 text-xs">
                        {key}
                      </kbd>
                      {i < shortcut.keys.length - 1 && ' + '}
                    </span>
                  ))}
                </div>
                <span className="text-gray-600">{shortcut.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}