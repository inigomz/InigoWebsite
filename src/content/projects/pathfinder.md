---
order: 3
title: "Pathfinding Visualizer"
tech: ["Python", "JavaScript", "React", "Canvas", "Algorithms"]
links:
  - { label: "Repo", url: "https://github.com/inigo/pathfinder" }
description: "An interactive browser demo that shows how BFS, Dijkstra, and A star search for a path across a customizable grid."
---

## Overview

Pathfinding Visualizer is an interactive browser application built with
JavaScript, React, and the HTML Canvas API. It demonstrates how BFS, 
Dijkstra's algorithm, and A star search move through a customizable grid. 
Users can draw walls and weighted spaces, reposition the start and 
goal, and watch every search step as it happens.

## How it works

Users can choose between BFS, Dijkstra, and A star before starting the
visualization. The application shows which spaces are waiting to be checked,
which spaces have already been visited, and the final path to the goal. Users
can also change the animation speed, generate a random map, clear the current
path, or reset the entire grid.

## What I learned

This project strengthened my understanding of how BFS, Dijkstra, and A star
make different exploration and cost decisions on the same map. Converting the
original Python desktop application into a browser experience also taught me
how to separate reusable algorithm logic from Python to JavaScript, stream search 
events with JavaScript generators, draw efficiently with Canvas, and coordinate 
user input with timed animations.
