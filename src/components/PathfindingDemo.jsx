/**
 * @file Connects the pathfinding engine to an editable, animated React canvas interface.
 */
import {
  useCallback, useEffect, useRef, useState,
} from 'react';
import {
  COLS, keyOf, ROWS, searchSteps,
} from '../demos/pathfindingVisualizer';

// Endpoints mirror the original Tkinter application coordinates.
const INITIAL_START = [12, 7];
const INITIAL_GOAL = [12, 34];
const COLORS = {
  empty: '#f6f4ef',
  wall: '#24262b',
  weight: '#826aed',
  start: '#16a085',
  goal: '#e45858',
  frontier: '#f2c14e',
  visited: '#70c1d4',
  path: '#ff8c42',
};
const same = (a, b) => a[0] === b[0] && a[1] === b[1];

/** Owns editable terrain, animation state, and canvas rendering for the demo. */
export function PathfindingDemo() {
  // Refs hold mutable browser resources that should not trigger React renders.
  const canvasRef = useRef();
  const timer = useRef();
  const dragging = useRef(false);
  const last = useRef();
  // React state represents everything needed to redraw or reproduce the board.
  const [algorithm, setAlgorithm] = useState('A*');
  const [tool, setTool] = useState('Wall');
  const [speed, setSpeed] = useState(18);
  const [start, setStart] = useState(INITIAL_START);
  const [goal, setGoal] = useState(INITIAL_GOAL);
  const [walls, setWalls] = useState(new Set());
  const [weights, setWeights] = useState(new Set());
  const [overlay, setOverlay] = useState(new Map());
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('Draw obstacles, then press Visualize.');
  // All cancellation flows through one function so stale animation timers cannot survive.
  const stop = useCallback(() => {
    clearTimeout(timer.current);
    setRunning(false);
  }, []);
  const clear = useCallback(() => {
    stop();
    setOverlay(new Map());
    setStatus('Draw obstacles, then press Visualize.');
  }, [stop]);
  useEffect(() => () => clearTimeout(timer.current), []);
  // Redraw the canvas whenever any visible layer changes.
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const size = canvas.width / COLS;
    ctx.font = 'bold 10px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const cell = [row, col];
        const key = keyOf(cell);
        let kind = overlay.get(key) || 'empty';
        if (walls.has(key)) kind = 'wall';
        else if (weights.has(key)) kind = 'weight';
        if (same(cell, start)) kind = 'start';
        else if (same(cell, goal)) kind = 'goal';
        ctx.fillStyle = COLORS[kind];
        ctx.fillRect(col * size, row * size, size, size);
        ctx.strokeStyle = '#d9d6cf';
        ctx.strokeRect(col * size, row * size, size, size);
        if (['weight', 'start', 'goal'].includes(kind)) {
          ctx.fillStyle = 'white';
          ctx.fillText(
            kind === 'weight' ? '5' : kind[0].toUpperCase(),
            col * size + size / 2,
            row * size + size / 2,
          );
        }
      }
    }
  }, [goal, overlay, start, walls, weights]);
  // Translate pointer coordinates from responsive CSS pixels into fixed grid cells.
  const edit = useCallback(
    (event) => {
      if (running || (event.type === 'pointermove' && !dragging.current)) return;
      const box = canvasRef.current.getBoundingClientRect();
      const cell = [
        Math.floor(((event.clientY - box.top) * ROWS) / box.height),
        Math.floor(((event.clientX - box.left) * COLS) / box.width),
      ];
      const key = keyOf(cell);
      if (last.current === key) return;
      last.current = key;
      setOverlay(new Map());
      if (tool === 'Move start' && !same(cell, goal)) setStart(cell);
      else if (tool === 'Move goal' && !same(cell, start)) setGoal(cell);
      else if (!same(cell, start) && !same(cell, goal)) {
        setWalls((old) => {
          const next = new Set(old);
          if (tool === 'Wall') next.add(key);
          else next.delete(key);
          return next;
        });
        setWeights((old) => {
          const next = new Set(old);
          if (tool === 'Weight') next.add(key);
          else if (tool !== 'Wall') next.delete(key);
          return next;
        });
      }
    },
    [goal, running, start, tool],
  );
  // Consume one generator event per timer tick, then animate the final route.
  const visualize = () => {
    if (running) return;
    setOverlay(new Map());
    setRunning(true);
    setStatus('Searching...');
    const steps = searchSteps(algorithm, {
      start,
      goal,
      walls,
      weights,
    });
    const advance = () => {
      const next = steps.next();
      if (!next.done) {
        const [kind, cell] = next.value;
        if (!same(cell, start) && !same(cell, goal)) setOverlay((old) => new Map(old).set(keyOf(cell), kind));
        timer.current = setTimeout(advance, Math.max(1, 51 - speed));
        return;
      }
      const { path, visited, cost } = next.value;
      let index = 1;
      const paint = () => {
        if (index < path.length - 1) {
          setOverlay((old) => new Map(old).set(keyOf(path[index]), 'path'));
          index += 1;
          timer.current = setTimeout(paint, 24);
        } else {
          setRunning(false);
          setStatus(
            path.length
              ? `Path found - cost ${cost} - ${visited} explored`
              : `No path found - ${visited} explored`,
          );
        }
      };
      paint();
    };
    advance();
  };
  // A 27% wall density usually creates interesting routes without blocking most boards.
  const maze = () => {
    clear();
    const next = new Set();
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        const cell = [row, col];
        if (Math.random() < 0.27 && !same(cell, start) && !same(cell, goal)) next.add(keyOf(cell));
      }
    }
    setWalls(next);
    setWeights(new Set());
  };
  const reset = () => {
    clear();
    setWalls(new Set());
    setWeights(new Set());
    setStart(INITIAL_START);
    setGoal(INITIAL_GOAL);
  };
  return (
    <section className="pathfinder" aria-labelledby="pathfinder-title">
      <h2 id="pathfinder-title">Pathfinding lab</h2>
      <div className="pathfinder__controls">
        <label htmlFor="pathfinder-algorithm">
          Algorithm
          <select
            id="pathfinder-algorithm"
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value)}
            disabled={running}
          >
            <option>BFS</option>
            <option>Dijkstra</option>
            <option>A*</option>
          </select>
        </label>
        <label htmlFor="pathfinder-tool">
          Tool
          <select
            id="pathfinder-tool"
            value={tool}
            onChange={(e) => setTool(e.target.value)}
            disabled={running}
          >
            <option>Wall</option>
            <option>Weight</option>
            <option>Erase</option>
            <option>Move start</option>
            <option>Move goal</option>
          </select>
        </label>
        <label htmlFor="pathfinder-speed">
          Speed
          <input
            id="pathfinder-speed"
            type="range"
            min="1"
            max="50"
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
          />
        </label>
        <button type="button" onClick={visualize} disabled={running}>
          Visualize
        </button>
        <button type="button" onClick={maze} disabled={running}>
          Random maze
        </button>
        <button type="button" onClick={clear}>
          Clear path
        </button>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </div>
      <div className="pathfinder__canvas">
        <canvas
          ref={canvasRef}
          width="1008"
          height="576"
          aria-label="Editable pathfinding grid"
          onPointerDown={(e) => {
            dragging.current = true;
            edit(e);
          }}
          onPointerMove={edit}
          onPointerUp={() => {
            dragging.current = false;
            last.current = null;
          }}
          onPointerLeave={() => {
            dragging.current = false;
            last.current = null;
          }}
        />
      </div>
      <p role="status">{status}</p>
    </section>
  );
}
