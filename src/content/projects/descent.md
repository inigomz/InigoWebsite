---
order: 1
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

## What I learned
I learned how to balance my work and fully document the process from the start of production to the end of the prototyping phase in 4 sprints. I made code contributions, and participated in code review by inspecting my group members' pull requests. I also documented test plans, test case development, test results, and bugs/fixes. I created the initial GitHub repository and set up the GitHub Actions pipeline, and set up CI Tests/Automation. 

## A small story that taught me a lesson
The most significant thing I learned while working on the project is that it doesn't matter how meticulously documented a project can be. There will be unexpected roadblocks.

During sprint 2, I thought we were on track for our project timeline, but we overlooked the most time consuming part about developing a game: Creating and mapping the terrain. As a group, we had little to no experience with game design, and time was running out.

Instead of mapping out the terrain by hand, I opted to create a script that allows me to procedurally generate the rooms and corridors instead. I never took a course on game design, so I watched tutorial videos on YouTube to try and understand how it works. Eventually, There was only one problem: We missed the deadline for sprint 2 because of it.

To be honest, it was frustrating. I always wondered how I could overlook a core gameplay mechanic when I've been playing video games my entire life. I thought about how I thought I was on track when I wasn't. The underlying fact was that we missed our deadline, giving us a major reduction in points. I felt defeated and ashamed because I thought I had it under control.

The reason why this experience was so memorable to me was this: Once we had finally submitted the project and completed our 4 sprints, I got curious and inspected the Unity marketplace to see if someone had a tool already built for stuff like procedural generation. It didn't occur to me at the time that I could've just purchased a tool from the Unity marketplace, but as I scrolled through the different procedural dungeon generation tools I came to an interesting conclusion.

I created a tool that can streamline the procedural dungeon generation process and it included a random walk path for the corridors. No tool (paid or unpaid) in the Unity marketplace could replicate what I created at the time! I just sat in my chair in disbelief the entire time. In the beauty of the struggle I managed to produce a creative solution that nobody publicly published in the Unity marketplace. I created something valuable with my own skill.

This will always be my most memorable project. The documentation, creation of the poster, game physics, code, testing, eveything. This project taught me so much about perseverence, following a schedule, trusting the work in myself and in others. 

Thank you Dr. Marc Velasco for constructing the class this way. I have learned so much during the time I had you as an instructor. To my group members, thank you for not giving up, and thank you for your continuous contributions. We went through a crazy roller coaster together during that class session. When we all saw the first prototype come together for our final presentation I almost cried when I saw our hard work preform well haha. I hope we can all look back to this and reminisce.