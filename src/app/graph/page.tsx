'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@cher1shrxd/loading';
import { toast } from '@cher1shrxd/toast';
import { graphApi } from '@/libs/graph';
import { GraphNode, GraphEdge } from '@/types/graph';
import { getStoredTokens, setAuthToken } from '@/libs/auth';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with D3
const ForceGraph = dynamic(() => import('@/components/ForceGraph'), { 
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-full">로딩 중...</div>
});

export default function GraphPage() {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const router = useRouter();

  useEffect(() => {
    const tokens = getStoredTokens();
    if (!tokens) {
      router.push('/login');
      return;
    }
    
    setAuthToken();
    loadGraph();
  }, []);

  const loadGraph = async () => {
    try {
      const graphData = await graphApi.getGraph();
      setNodes(graphData.nodes);
      setEdges(graphData.edges);
    } catch (error) {
      toast.error('오류', '그래프를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    
    if (node.type === 'Note') {
      // 노트 상세 페이지로 이동
      router.push(`/notes/${node.id}`);
    } else if (node.type === 'Concept') {
      // 개념 중심 그래프 보기
      toast.success('개념 선택', `"${node.name}" 개념을 선택했습니다.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">그래프 로딩 중...</div>
      </div>
    );
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
            <h1 className="text-2xl font-bold text-gray-900">지식 그래프</h1>
          </div>
          <div className="text-sm text-gray-600">
            노드: {nodes.length} | 연결: {edges.length}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-4">
          {nodes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              아직 생성된 노트가 없습니다. 노트를 작성하여 지식 그래프를 만들어보세요.
            </div>
          ) : (
            <>
              <div className="mb-4">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-indigo-500 rounded-full"></div>
                    <span>개념</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                    <span>노트</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  • 드래그로 노드 이동 • 스크롤로 확대/축소 • 클릭으로 상세 보기
                </p>
              </div>
              
              <div className="h-[600px] border border-gray-200 rounded-lg">
                <ForceGraph
                  nodes={nodes}
                  edges={edges}
                  width={800}
                  height={600}
                  onNodeClick={handleNodeClick}
                />
              </div>
            </>
          )}
        </div>

        {selectedNode && (
          <div className="mt-4 bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-2">선택된 노드</h2>
            <div className="text-sm text-gray-600">
              <p>타입: {selectedNode.type === 'Concept' ? '개념' : '노트'}</p>
              <p>이름: {selectedNode.name}</p>
              <p>ID: {selectedNode.id}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}