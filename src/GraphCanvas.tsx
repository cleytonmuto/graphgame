import { useCallback, useMemo } from 'react';
import type { Graph } from './types';

interface GraphCanvasProps {
  graph: Graph;
  path: number[];
  onVertexClick: (vertexId: number) => void;
  completed: boolean;
}

const VERTEX_RADIUS = 54;
const EDGE_WIDTH = 6;

export function GraphCanvas({ graph, path, onVertexClick, completed }: GraphCanvasProps) {
  const { vertices, edges } = graph;

  const edgeKey = (u: number, v: number) => (u < v ? `${u}-${v}` : `${v}-${u}`);

  const edgeUsage = useMemo(() => {
    const usage = new Map<string, number>();
    for (const e of edges) {
      const key = edgeKey(e.u, e.v);
      usage.set(key, (usage.get(key) ?? 0) + 1);
    }
    return usage;
  }, [edges]);

  const usedEdges = useMemo(() => {
    const used = new Map<string, number>();
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      const key = edgeKey(u, v);
      used.set(key, (used.get(key) ?? 0) + 1);
    }
    return used;
  }, [path]);

  const getRemainingEdgeCount = useCallback(
    (u: number, v: number) => {
      const key = edgeKey(u, v);
      const total = edgeUsage.get(key) ?? 0;
      const used = usedEdges.get(key) ?? 0;
      return total - used;
    },
    [edgeUsage, usedEdges]
  );

  const canClick = useCallback(
    (vertexId: number): boolean => {
      if (completed) return false;
      if (path.length === 0) return true;
      const last = path[path.length - 1];
      return getRemainingEdgeCount(last, vertexId) > 0;
    },
    [path, completed, getRemainingEdgeCount]
  );

  const totalEdges = edges.length;
  const traversedEdges = path.length > 0 ? path.length - 1 : 0;

  return (
    <div className="graph-canvas-container">
      <div className="graph-stats">
        <span>Edges traversed: {traversedEdges} / {totalEdges}</span>
        {completed && <span className="success-badge">Path complete!</span>}
      </div>
      <svg
        className="graph-canvas"
        viewBox={`0 0 1200 810`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--edge-color)" />
          </marker>
          <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>

        {edges.map((e, i) => {
          const u = vertices.find((v) => v.id === e.u)!;
          const v = vertices.find((v) => v.id === e.v)!;
          const key = edgeKey(e.u, e.v);
          const used = usedEdges.get(key) ?? 0;
          const isOnPath = used > 0;
          const x1 = u.x;
          const y1 = u.y;
          const x2 = v.x;
          const y2 = v.y;

          return (
            <line
              key={`${e.u}-${e.v}-${i}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              className={`edge ${isOnPath ? 'edge-traversed' : ''}`}
              style={{
                opacity: isOnPath ? 1 : 0.4,
                strokeWidth: isOnPath ? EDGE_WIDTH + 1 : EDGE_WIDTH,
              }}
            />
          );
        })}

        {vertices.map((vertex) => {
          const isLast = path[path.length - 1] === vertex.id;
          const clickable = canClick(vertex.id);

          return (
            <g
              key={vertex.id}
              className={`vertex-group ${clickable ? 'clickable' : ''} ${isLast ? 'current' : ''} ${completed ? 'completed' : ''}`}
              onClick={() => clickable && onVertexClick(vertex.id)}
            >
              <circle
                cx={vertex.x}
                cy={vertex.y}
                r={VERTEX_RADIUS}
                className="vertex-circle"
              />
              <text
                x={vertex.x}
                y={vertex.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="vertex-label"
              >
                {vertex.label}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="graph-hint">Click vertices in sequence to complete the Eulerian path</p>
    </div>
  );
}
