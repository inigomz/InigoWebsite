/**
 * @file Provides browser-independent BFS, Dijkstra, and A-star search event generators.
 */
export const ROWS = 24;
export const COLS = 42;
export const keyOf = ([row, col]) => `${row}:${col}`;

// Searches can move orthogonally, but never diagonally or beyond the board.
const neighbors = ([row, col]) => [
  [row - 1, col],
  [row + 1, col],
  [row, col - 1],
  [row, col + 1],
].filter(([r, c]) => r >= 0 && r < ROWS && c >= 0 && c < COLS);

/** Reconstructs the winning route by walking the predecessor map backward. */
function result(start, goal, previous, costs, visited) {
  const path = [];
  if (keyOf(start) === keyOf(goal) || previous.has(keyOf(goal))) {
    let cell = goal;
    while (keyOf(cell) !== keyOf(start)) {
      path.push(cell);
      cell = previous.get(keyOf(cell));
    }
    path.push(start);
    path.reverse();
  }
  return {
    path,
    visited: visited.size,
    cost: path.length ? costs.get(keyOf(goal)) : 0,
  };
}

/** Yields visual events as BFS explores equally costly cells in queue order. */
function* bfs(grid) {
  const previous = new Map();
  const costs = new Map([[keyOf(grid.start), 0]]);
  const visited = new Set();
  const queued = new Set([keyOf(grid.start)]);
  const queue = [grid.start];
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const cell = queue[cursor];
    const cellKey = keyOf(cell);
    visited.add(cellKey);
    yield ['visited', cell];
    if (cellKey === keyOf(grid.goal)) break;
    for (const next of neighbors(cell)) {
      const nextKey = keyOf(next);
      if (grid.walls.has(nextKey) || queued.has(nextKey)) continue;
      queued.add(nextKey);
      previous.set(nextKey, cell);
      costs.set(nextKey, costs.get(cellKey) + 1);
      queue.push(next);
      yield ['frontier', next];
    }
  }
  return result(grid.start, grid.goal, previous, costs, visited);
}

/** Yields Dijkstra or A* events using the lowest estimated total cost first. */
function* prioritySearch(algorithm, grid) {
  const previous = new Map();
  const costs = new Map([[keyOf(grid.start), 0]]);
  const visited = new Set();
  const frontier = [{ priority: 0, order: 0, cell: grid.start }];
  let order = 1;
  while (frontier.length) {
    // Sorting is sufficient for this small demo; a binary heap is preferable at large scale.
    frontier.sort((a, b) => a.priority - b.priority || a.order - b.order);
    const { cell } = frontier.shift();
    const cellKey = keyOf(cell);
    if (visited.has(cellKey)) continue;
    visited.add(cellKey);
    yield ['visited', cell];
    if (cellKey === keyOf(grid.goal)) break;
    for (const next of neighbors(cell)) {
      const nextKey = keyOf(next);
      if (grid.walls.has(nextKey)) continue;
      const cost = costs.get(cellKey) + (grid.weights.has(nextKey) ? 5 : 1);
      if (cost >= (costs.get(nextKey) ?? Infinity)) continue;
      costs.set(nextKey, cost);
      previous.set(nextKey, cell);
      const estimate = algorithm === 'A*'
        ? Math.abs(next[0] - grid.goal[0]) + Math.abs(next[1] - grid.goal[1])
        : 0;
      frontier.push({ priority: cost + estimate, order, cell: next });
      order += 1;
      yield ['frontier', next];
    }
  }
  return result(grid.start, grid.goal, previous, costs, visited);
}

// Returning an iterator lets the UI decide when each search step is painted.
export const searchSteps = (algorithm, grid) => (algorithm === 'BFS' ? bfs(grid) : prioritySearch(algorithm, grid));
