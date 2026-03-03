import type { Graph, Vertex, Edge } from './types';

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 810;
const PADDING = 50;

function placeVerticesOnCircle(n: number): { x: number; y: number }[] {
  const cx = CANVAS_WIDTH / 2;
  const cy = CANVAS_HEIGHT / 2;
  const radius = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 2 - PADDING;
  const positions: { x: number; y: number }[] = [];

  for (let i = 0; i < n; i++) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    positions.push({
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  }
  return positions;
}

function buildAdjacency(edges: Edge[]): Map<number, number[]> {
  const adj = new Map<number, number[]>();
  for (const { u, v } of edges) {
    if (!adj.has(u)) adj.set(u, []);
    if (!adj.has(v)) adj.set(v, []);
    adj.get(u)!.push(v);
    adj.get(v)!.push(u);
  }
  return adj;
}

/**
 * Hierholzer's algorithm to find an Eulerian path or circuit.
 * Returns the sequence of vertices in the path.
 */
export function findEulerianPath(
  adjacency: Map<number, number[]>,
  _edgeCount: number
): number[] {
  const degrees = new Map<number, number>();
  for (const [v, neighbors] of adjacency) {
    degrees.set(v, neighbors.length);
  }

  let start = 0;
  let oddCount = 0;
  for (const [v, deg] of degrees) {
    if (deg % 2 === 1) {
      oddCount++;
      start = v;
    }
  }
  if (oddCount !== 0 && oddCount !== 2) return [];

  const adjCopy = new Map<number, number[]>();
  for (const [v, list] of adjacency) {
    adjCopy.set(v, [...list]);
  }

  const stack: number[] = [start];
  const path: number[] = [];

  while (stack.length > 0) {
    const u = stack[stack.length - 1];
    const neighbors = adjCopy.get(u)!;
    if (neighbors.length === 0) {
      path.push(u);
      stack.pop();
    } else {
      const v = neighbors.pop()!;
      const vList = adjCopy.get(v)!;
      const idx = vList.indexOf(u);
      if (idx !== -1) vList.splice(idx, 1);
      stack.push(v);
    }
  }

  return path.reverse();
}

/**
 * Generate a connected simple graph (at most one edge per pair) with an Eulerian path.
 * Uses construction: base path through all vertices, then add single edges
 * (always between one odd- and one even-degree vertex) to maintain 0 or 2 odd total.
 */
export function generateEulerianGraph(
  vertexCount: number,
  targetEdgeCount: number,
  seed?: number
): Graph {
  if (vertexCount < 2) vertexCount = 2;
  const positions = placeVerticesOnCircle(vertexCount);

  const vertices: Vertex[] = positions.map((p, i) => ({
    id: i,
    x: p.x,
    y: p.y,
    label: String(i + 1),
  }));

  const edges: Edge[] = [];
  const rand = seed !== undefined ? seededRandom(seed) : Math.random;
  const edgeSet = new Set<string>();

  const minEdges = vertexCount - 1;
  const maxEdges = Math.floor((vertexCount * (vertexCount - 1)) / 2);
  const desiredEdges = Math.max(
    minEdges,
    Math.min(targetEdgeCount, maxEdges)
  );

  for (let i = 0; i < vertexCount - 1; i++) {
    edges.push({ u: i, v: i + 1 });
    edgeSet.add(i < i + 1 ? `${i}-${i + 1}` : `${i + 1}-${i}`);
  }

  const hasEdge = (a: number, b: number) =>
    edgeSet.has(a < b ? `${a}-${b}` : `${b}-${a}`);

  const addEdge = (a: number, b: number): boolean => {
    if (a === b || hasEdge(a, b)) return false;
    edges.push({ u: a, v: b });
    edgeSet.add(a < b ? `${a}-${b}` : `${b}-${a}`);
    return true;
  };

  const getOddVertices = (): Set<number> => {
    const degrees = new Map<number, number>();
    for (const { u, v } of edges) {
      degrees.set(u, (degrees.get(u) ?? 0) + 1);
      degrees.set(v, (degrees.get(v) ?? 0) + 1);
    }
    const odd = new Set<number>();
    for (const [v, d] of degrees) {
      if (d % 2 === 1) odd.add(v);
    }
    return odd;
  };

  let extraEdges = desiredEdges - (vertexCount - 1);
  const maxAttempts = extraEdges * 25;
  let attempts = 0;

  while (extraEdges > 0 && attempts < maxAttempts) {
    attempts++;
    const odd = getOddVertices();
    const even = new Set<number>();
    for (let i = 0; i < vertexCount; i++) {
      if (!odd.has(i)) even.add(i);
    }
    const oddList = [...odd];
    const evenList = [...even];
    if (oddList.length === 0 || evenList.length === 0) break;
    const u = oddList[Math.floor(rand() * oddList.length)];
    const v = evenList[Math.floor(rand() * evenList.length)];
    if (addEdge(u, v)) extraEdges--;
  }

  const adjacency = buildAdjacency(edges);
  const path = findEulerianPath(adjacency, edges.length);
  if (path.length === 0) {
    return generateEulerianGraph(vertexCount, targetEdgeCount, (seed ?? Date.now()) + 1);
  }

  return { vertices, edges, adjacency };
}

function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

export function getEulerianPathForGraph(graph: Graph): number[] {
  return findEulerianPath(graph.adjacency, graph.edges.length);
}
