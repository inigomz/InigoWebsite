# Inigo's Portfolio Website

A personal portfolio site built with React, Vite, and anime.js. It showcases projects as Markdown files with a motion system that respects the user's `prefers-reduced-motion` setting.

## Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + React Router v6 |
| Build | Vite 5 |
| Animation | anime.js 3 |
| Content | Markdown files parsed with gray-matter + react-markdown |
| Tests | Vitest + Testing Library + fast-check (property tests) |
| Deployment | Netlify |

## Project structure

```
src/
  routes/         # Page components (Home, Projects, ProjectDetail, About, NotFound)
  components/     # Shared UI (Nav, Footer, ProjectCard, Reveal, MotionLayout, ParallaxLayer)
  content/
    projects/     # One .md file per project
    loader.js     # Parses and validates all project Markdown at build time
    schema.js     # Required frontmatter fields
  motion/
    engine.js     # Animation primitives (playHero, playReveal, applyParallax, …)
    tokens.js     # Duration, easing, and stagger constants
    useReducedMotion.js  # Hook that tracks prefers-reduced-motion live
  styles/
    index.css     # Global styles
```

## Getting started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Adding a project

Create a Markdown file under `src/content/projects/`. The filename becomes the URL slug — `my-project.md` maps to `/projects/my-project`.

The file must include these frontmatter fields:

```yaml
---
title: "My Project"
tech: ["TypeScript", "React"]
links:
  - { label: "Repo", url: "https://github.com/you/my-project" }
description: "One sentence description shown on the project card."
---

Full Markdown body goes here.
```

| Field | Type | Description |
|---|---|---|
| `title` | string | Displayed as the page heading and card title |
| `tech` | string array | Rendered as chips on the card and detail page |
| `links` | array of `{ label, url }` | External links on the detail page |
| `description` | string | Summary shown on the projects listing |

If any required field is missing, `npm run build` will fail with a message naming the file and every missing field.

## Available scripts

```bash
npm run dev        # Development server with HMR
npm run build      # Production build → dist/
npm run preview    # Serve the production build locally
npm test           # Run the property test suite once
npm run test:watch # Run tests in watch mode
```

## Motion system

The animation engine lives in `src/motion/engine.js` and exposes five primitives:

- **`playHero`** — staggered character entrance on the Home page heading
- **`playReveal`** — fade/slide-up triggered when an element scrolls into view
- **`applyParallax`** — writes a `translate3d` offset driven by `scrollY`
- **`playTransition`** — cross-fade between outgoing and incoming route containers
- **`playMicro`** — scale pulse on project card hover/focus

Every primitive accepts `{ reducedMotion: boolean }`. When `true`, it skips the timeline, sets the target to its final visible state (`opacity: 1`, no transform), and returns a resolved promise — so the rest of the app never needs to branch on the preference.

## Deployment

The site deploys to Netlify automatically. The `netlify.toml` at the repo root sets:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

The redirect rule ensures React Router's client-side routes work correctly on direct navigation and page refresh.

## Tests

The test suite uses [fast-check](https://fast-check.dev/) property tests rather than example-based unit tests. Each test file sits next to the code it verifies:

| File | Property tested |
|---|---|
| `motion/engine.property.test.js` | Reduced-motion gate, parallax determinism |
| `motion/useReducedMotion.property.test.jsx` | Live preference toggle |
| `content/loader.*.property.test.js` | Slug derivation, record shape, missing-field errors |
| `routes/Projects.property.test.jsx` | Listing renders one card per record with correct links |
| `routes/ProjectDetail.property.test.jsx` | Detail page renders all content; unknown slug shows NotFound |
| `App.property.test.jsx` | Unknown route shows site NotFound; nav persists on every route |
| `components/ProjectCard.property.test.jsx` | Micro-interaction fires exactly once per activation |
