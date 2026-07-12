---
title: "DDO Codex Website"
tech: ["React", "Vite", "Netlify", "OpenAI API"]
links:
  - { label: "Repo", url: "https://github.com/inigomz/DDOcodexWebsite" }
  - { label: "Live Site", url: "https://cevangelddocodex.netlify.app/" }
description: "An AI powered Dungeons & Dragons Online gear planner that creates optimized loadouts from plain English character goals."
---

## Overview

DDO Codex is a gear planner for Dungeons & Dragons Online. Players describe
their character build in plain English and receive a complete gear setup with
items, augments, crafting choices, missing stats, and stacking conflicts.

## How it works

The planner reads the character level, build type, main stat, weapon choice,
and armor preference from the player's description. It searches the item data
for every equipment slot, avoids bonuses that do not stack, and uses augments
and crafting options to fill the remaining gaps.

The website uses React and Vite for the frontend and Netlify Functions for the
planner and OpenAI features. Players can request an AI gear report or use the
DDO chatbot to ask about builds, quests, items, game mechanics, and set bonuses.
The project also includes scripts that collect and organize game data from the
DDO Wiki.

## What I learned

This project gave me experience working with a large amount of game data,
building rules for gear selection, and turning a player's written request into
useful results. Keeping the gear planner separate from the AI advisor also made
the results easier to test and understand.
