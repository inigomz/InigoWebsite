---
title: "Pathfinding Visualizer"
tech: ["TypeScript", "React", "Canvas", "Vite"]
links:
  - { label: "Repo", url: "https://github.com/inigo/pathfinder" }
  - { label: "Live", url: "https://example.com/pathfinder" }
description: "An interactive visualizer for grid-based pathfinding algorithms including BFS, Dijkstra, A*, and Jump Point Search."
---

## Overview

A browser-based visualizer that renders pathfinding algorithms running
step-by-step on a configurable weighted grid. Users paint walls and weights,
move the start and goal endpoints, pick an algorithm, and scrub through the
search frontier as it expands. The tool was built to make algorithm choice
tangible: side-by-side comparisons highlight how heuristic strength changes
the shape of the visited set.

## How it works

The grid is stored as a flat typed array indexed by `y * width + x` so
neighbor lookups stay branch-free in the hot loop. Each algorithm is a
generator that yields one frontier expansion per step, which lets the
renderer drive the search at any speed without coupling visualization to
algorithmic state. The Canvas layer batches dirty cells per frame and only
redraws what changed, keeping the visualizer responsive on grids up to
200x200.

A* and JPS share a single binary heap with a decrease-key operation backed by
a position-to-index map, so both algorithms run with the same priority queue
implementation and only their successor functions differ.

## What I learned

Modeling each algorithm as a generator turned out to be the most useful
architectural choice: replay, step-back, and speed control all became free
once the search loop yielded its frontier instead of pushing to a callback.
It was also a good reminder that the obvious data structure (an object map
keyed by `"x,y"` strings) was an order of magnitude slower than a typed
array on large grids.
