export interface GraphNode {
  id: string;
  name: string;
  type: 'Concept' | 'Note';
}

export interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

export interface GraphResponse {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ConnectedConcept {
  concept: string;
  relation: string;
  depth: number;
}

export interface ConceptCenter {
  name: string;
  user_id: string;
}

export interface ConceptGraphResponse {
  center: ConceptCenter;
  connected: ConnectedConcept[];
}