export interface Vertex {
  id: number;
  x: number;
  y: number;
  label: string;
}

export interface Edge {
  u: number;
  v: number;
}

export interface Graph {
  vertices: Vertex[];
  edges: Edge[];
  adjacency: Map<number, number[]>;
}
