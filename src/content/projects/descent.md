---
title: "Descent"
tech: ["Unity 6", "C#", "Tilemaps", "GitHub Actions"]
links:
  - { label: "Repo", url: "https://github.com/inigomz/Descent" }
  - { label: "Game Design Document", url: "/documents/descent-game-design-document.pdf" }
description: "A 2D dungeon crawler with procedural dungeons, combat, enemies, power ups, and a new layout for every run."
---

## Overview

Descent is a 2D dungeon crawler made in Unity for my senior capstone project.
Players explore a new dungeon in every run, fight enemies, collect power ups,
and try to survive for as long as possible.

## How it works

Descent creates a new dungeon for every run. Players explore the map, fight
enemies, collect power ups, and earn experience. The game also includes health
and damage systems, a game over screen, persistent audio, and options for
volume, resolution, and fullscreen mode.

## My contributions

I worked on the procedural dungeon generation system and its connection to
Unity's tilemaps. The procedural dungeon generation system includes room creation,
random path creation, automated wall placements, and renders the entire tilemap 
layout through Unity's engine. I created the title and options menus, and worked 
on the player’s movement, physics, collisions, and camera setup. I also helped 
set up GitHub Actions workflows, fix bugs, review changes, and test gameplay 
features throughout development. GitHub Actions was used for continuous integration 
and setting up automated tests. 