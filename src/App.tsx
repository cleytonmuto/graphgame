import { useState, useMemo, useCallback } from 'react';
import { GraphCanvas } from './GraphCanvas';
import { generateEulerianGraph } from './graphUtils';
import './App.css';

function getLevelConfig(level: number): { vertices: number; edges: number } {
  const baseVertices = 4;
  const vertices = Math.min(baseVertices + level, 14);
  const minEdges = vertices - 1;
  const maxEdges = Math.floor((vertices * (vertices - 1)) / 2);
  const edges = Math.min(minEdges + level, maxEdges);
  return {
    vertices,
    edges: Math.max(edges, minEdges),
  };
}

export default function App() {
  const [level, setLevel] = useState(1);
  const [path, setPath] = useState<number[]>([]);
  const [stageKey, setStageKey] = useState(0);

  const graph = useMemo(() => {
    const { vertices, edges } = getLevelConfig(level);
    return generateEulerianGraph(vertices, edges, level * 1000 + stageKey);
  }, [level, stageKey]);

  const handleVertexClick = useCallback((vertexId: number) => {
    setPath((prev) => [...prev, vertexId]);
  }, []);

  const totalEdges = graph.edges.length;
  const traversedEdges = path.length > 0 ? path.length - 1 : 0;
  const completed = traversedEdges === totalEdges && totalEdges > 0;

  const handleNextLevel = useCallback(() => {
    setLevel((l) => l + 1);
    setPath([]);
    setStageKey((k) => k + 1);
  }, []);

  const handleRetry = useCallback(() => {
    setPath([]);
    setStageKey((k) => k + 1);
  }, []);

  const handleRestart = useCallback(() => {
    setLevel(1);
    setPath([]);
    setStageKey((k) => k + 1);
  }, []);

  const handleUndo = useCallback(() => {
    if (!completed) setPath((prev) => prev.slice(0, -1));
  }, [completed]);

  return (
    <div className="app">
      <header className="app-header">
        <h1>Eulerian Path</h1>
        <p className="subtitle">Traverse every edge exactly once</p>
      </header>

      <div className="game-panel">
        <div className="level-info">
          <span className="level-badge">Level {level}</span>
          <span>
            {graph.vertices.length} vertices · {graph.edges.length} edges
          </span>
        </div>

        <GraphCanvas
          graph={graph}
          path={path}
          onVertexClick={handleVertexClick}
          completed={completed}
        />

        <div className="actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleUndo}
            disabled={path.length === 0 || completed}
          >
            Undo
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleRetry}
          >
            New graph
          </button>
          {completed && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleNextLevel}
            >
              Next level
            </button>
          )}
        </div>
      </div>

      {level > 1 && (
        <button type="button" className="btn btn-ghost" onClick={handleRestart}>
          Start over
        </button>
      )}
    </div>
  );
}
