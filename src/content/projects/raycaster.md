---
title: "Raycasting Engine"
tech: ["C++", "OpenGL", "GLFW", "GLM"]
links:
  - { label: "Repo", url: "https://github.com/inigo/raycaster" }
  - { label: "Demo", url: "https://example.com/raycaster-demo" }
description: "A real-time software raycasting engine with textured walls, sprite billboards, and portal rendering."
---

## Overview

A from-scratch software raycaster inspired by the classic Wolfenstein 3D
rendering pipeline, extended with portal rendering and dynamic lighting. The
engine runs entirely on the CPU and streams a single full-screen quad to the
GPU through OpenGL, which keeps the render path simple while exposing every
intersection calculation to direct optimization.

## How it works

Each frame casts one ray per screen column through a 2D grid of axis-aligned
walls, advancing via a Digital Differential Analyzer (DDA) until it hits a
solid cell. The hit distance, corrected for fish-eye, drives the column's
projected wall slice height and the texture U coordinate. Sprites are sorted
back-to-front per frame and projected with the same camera basis so they
composite correctly against the wall buffer.

Portals are implemented by re-entering the raycast loop with a transformed
camera at the portal's destination, capped to a recursion depth of four. A
small per-pixel lighting model attenuates wall and sprite samples by distance
plus a direction-aware ambient term.

## What I learned

Writing the column loop in tight, branch-light code paid for itself: profiling
showed the DDA inner loop dominated the frame time, so collapsing the side-
distance update to a pair of conditional adds let the engine hit 60 FPS at
1080p on a single core. The portal recursion pushed me to factor camera state
into a small immutable struct, which made the rest of the engine far easier
to reason about.
