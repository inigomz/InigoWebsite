---
title: "Pathfinding Visualizer"
tech: ["Python", "Tkinter", "Algorithms"]
links:
  - { label: "Repo", url: "https://github.com/inigo/pathfinder" }
description: "A Python application that shows how BFS, Dijkstra, and A star search for a path across a customizable grid."
---

## Overview

Pathfinding Visualizer is an interactive Python application that shows how
several pathfinding algorithms move through a grid. Users can draw walls and
weighted spaces, move the starting and goal positions, and watch each search
step as it happens.

## How it works

Users can choose between BFS, Dijkstra, and A star before starting the
visualization. The application shows which spaces are waiting to be checked,
which spaces have already been visited, and the final path to the goal. Users
can also change the animation speed, generate a random map, clear the current
path, or reset the entire grid.

## What I learned

This project helped me better understand how different pathfinding algorithms
explore the same map. It also gave me experience building an interactive desktop
interface with Python and Tkinter while keeping the search logic separate from
the visual animation.
