# Implementation Plan: Portfolio_Website

## Overview

Convert the feature design into a series of prompts for a code-generation LLM that will implement each step with incremental progress. Make sure that each prompt builds on the previous prompts, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step. Focus ONLY on tasks that involve writing, modifying, or testing code.

The plan builds the Portfolio_Website bottom-up: scaffold the Vite/React workspace, lay down the reduced-motion gate and animation tokens, implement the Animation_Engine and its motion components, build the Markdown content pipeline, assemble the page components and Router, then wire everything together in `App` and ship the Netlify config. Property tests are placed next to the code they verify so failures surface as soon as the relevant primitive lands.

## Tasks

- [x] 1. Scaffold the Vite + React project
  - [x] 1.1 Initialize the Vite React workspace and module layout
    - Create `package.json` with scripts `dev` (`vite`) and `build` (`vite build`)
    - Add runtime dependencies: `react@^18`, `react-dom@^18`, `react-router-dom@^6`, `animejs@^3`, `gray-matter`, `react-markdown`
    - Add dev dependencies: `vite`, `@vitejs/plugin-react`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `jsdom`, `fast-check`
    - Author `vite.config.js` (React plugin + Vitest config with `jsdom` environment)
    - Author `index.html` mounting `#root` and loading `/src/main.jsx`
    - Create empty directory skeleton: `src/routes/`, `src/components/`, `src/motion/`, `src/content/projects/`, `src/styles/`, `public/`
    - Add a minimal `src/styles/index.css` placeholder
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement the reduced-motion hook
  - [x] 2.1 Implement `useReducedMotion`
    - Create `src/motion/useReducedMotion.js` returning a boolean from `window.matchMedia('(prefers-reduced-motion: reduce)')`
    - Subscribe to the `MediaQueryList` `change` event and update state without requiring a reload
    - _Requirements: 5.1, 5.4_

  - [x] 2.2 Write property test for live reduced-motion toggling
    - **Property 10: Live reduced-motion preference toggles take effect**
    - For an arbitrary sequence of `matches` boolean changes dispatched on the mocked `MediaQueryList`, every read of the hook value after a change reflects the new value
    - **Validates: Requirements 5.4**

- [x] 3. Implement the Animation_Engine
  - [x] 3.1 Create motion tokens
    - Author `src/motion/tokens.js` exporting `DURATION` (`hero`, `reveal`, `transitionIn`, `transitionOut`, `micro`), `EASING` (`standard`, `spring`), and `STAGGER` (`hero`)

  - [x] 3.2 Implement engine primitives
    - Author `src/motion/engine.js` with `playHero`, `playReveal`, `applyParallax`, `playTransition`, `playMicro`
    - Each primitive accepts `{ reducedMotion }` and, when true, sets the target to its final state (`opacity: 1`, no transform) and returns a resolved promise instead of running an `animejs` timeline
    - `applyParallax` reads `data-parallax` from the element and writes `translate3d(0, scrollY * factor px, 0)`
    - Wrap engine calls so animation rejections still resolve (route transitions never get stuck)
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 4.6, 4.7, 5.2, 5.3_

  - [x] 3.3 Write property test for the reduced-motion gate
    - **Property 9: Reduced motion gate skips motion and leaves elements in final state**
    - For every primitive in `{playHero, playReveal, applyParallax, playTransition, playMicro}` and an arbitrary target element, calling with `reducedMotion: true` invokes no `animejs` timeline (mock `animejs` and assert zero calls) and leaves the element with `opacity: 1` and no residual transform
    - **Validates: Requirements 5.2, 5.3, 4.7**

  - [x] 3.4 Write property test for parallax determinism
    - **Property 12: Parallax transform is a deterministic function of scroll position**
    - For arbitrary non-negative scroll offsets and arbitrary `data-parallax` factors, `applyParallax(el, y)` writes `translate3d(0, ${y * f}px, 0)` and is monotonic non-decreasing in `y`
    - **Validates: Requirements 4.4**

- [x] 4. Implement the `Reveal` component
  - [x] 4.1 Create `Reveal` with `IntersectionObserver`
    - Author `src/components/Reveal.jsx` accepting `as` and children
    - On mount, set `opacity: 0`, observe the element, and call `playReveal` once on intersect, then unobserve
    - When `useReducedMotion()` is true, skip the observer and call `playReveal(el, { reducedMotion: true })` immediately so the element is shown in its final state
    - _Requirements: 4.3, 5.2_

  - [x] 4.2 Write property test for scroll-triggered entrance
    - **Property 11: Scroll-triggered entrance fires once per card**
    - Mock `IntersectionObserver` and `playReveal`; for an arbitrary list of mounted `Reveal` children, dispatching one intersect entry per child invokes `playReveal` exactly once per element and leaves each at `opacity: 1` with no residual transform
    - **Validates: Requirements 4.3, 4.7**

- [x] 5. Implement the `MotionLayout` component

  - [x] 5.1 Create `MotionLayout` driven by route changes
    - Author `src/components/MotionLayout.jsx` wrapping children in a container ref keyed off `useLocation().pathname`
    - On `pathname` change, call `playTransition(outgoing, null, …)`, swap children, then call `playTransition(null, incoming, …)`
    - _Requirements: 4.5_

  - [x] 5.2 Write property test for route transitions
    - **Property 13: Route transition animates outgoing and incoming containers**
    - Mock `playTransition`; for arbitrary pairs of distinct routes from `{/, /projects, /projects/:slug, /about}`, navigating from A to B invokes the primitive with the outgoing then incoming container, and after completion both DOM containers are at `opacity: 1` with no residual transform
    - **Validates: Requirements 4.5, 4.7**

- [x] 6. Implement the `ParallaxLayer` component
  - [x] 6.1 Create `ParallaxLayer` driven by scroll
    - Author `src/components/ParallaxLayer.jsx` that renders a wrapping element with `data-parallax`
    - Attach a passive `scroll` listener that calls `applyParallax(el, window.scrollY, { reducedMotion })` inside `requestAnimationFrame`
    - Detach the listener on unmount and when `reducedMotion` flips on
    - _Requirements: 4.4, 5.2_

- [ ] 7. Implement the Markdown content pipeline
  - [x] 7.1 Define the frontmatter schema
    - Author `src/content/schema.js` exporting `REQUIRED_FIELDS = ['title', 'tech', 'links', 'description']`
    - _Requirements: 3.5_

  - [x] 7.2 Implement `Project_Content_Loader`
    - Author `src/content/loader.js` using `import.meta.glob('./projects/*.md', { eager: true, query: '?raw', import: 'default' })`
    - Parse each file with `gray-matter`, derive `slug` from filename without `.md`, and validate against `REQUIRED_FIELDS` (treating `undefined`, `null`, empty arrays, and empty/whitespace strings as missing)
    - Throw an `Error` whose message names the file path and every missing field when validation fails
    - Export sorted `projects` array and `getProjectBySlug(slug)` lookup
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 7.3 Write property test for slug derivation
    - **Property 1: Slug derivation**
    - For arbitrary filenames `<name>.md` where `<name>` is a non-empty string of safe chars, the loader returns a record whose `slug === <name>`; test by feeding synthetic `import.meta.glob` results into the loader's pure helpers
    - **Validates: Requirements 3.4**

  - [x] 7.4 Write property test for loader record shape
    - **Property 2: Loader produces one well-formed record per valid file**
    - For arbitrary non-empty maps of valid Markdown sources, the loader returns exactly one record per entry with populated, well-typed `slug`, `title`, `tech` (non-empty string array), `links` (array of `{label, url}`), `description`, and `body`
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x] 7.5 Write property test for missing-frontmatter validation
    - **Property 3: Missing required frontmatter fails the build with a precise error**
    - For arbitrary valid Markdown sources with an arbitrary non-empty subset of required fields removed, the loader throws an error whose message contains the file path and every removed field's name
    - **Validates: Requirements 3.5**

  - [x] 7.6 Author sample project Markdown files
    - Add at least three `.md` files under `src/content/projects/` (e.g., `raycaster.md`, `compiler.md`, `pathfinder.md`) with valid frontmatter (`title`, `tech`, `links`, `description`) plus a few paragraphs of body
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 8. Checkpoint - foundations green
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. Implement page components and routing
  - [x] 9.1 Implement `Nav` and `Footer`
    - Author `src/components/Nav.jsx` with three `<NavLink>`s to `/`, `/projects`, `/about`, each with `data-testid="nav-link"`, inside a `<nav>` landmark
    - Author `src/components/Footer.jsx` as a simple footer landmark
    - _Requirements: 2.5_

  - [x] 9.2 Implement `NotFound`
    - Author `src/routes/NotFound.jsx` accepting a `variant` prop (`'site' | 'project'`, default `'site'`)
    - When `variant === 'project'`, render a link whose target is `/projects`; otherwise render a link whose target is `/`
    - _Requirements: 2.6, 3.9_

  - [x] 9.3 Implement `Home` with hero and parallax
    - Author `src/routes/Home.jsx` rendering hero text marked with `data-hero-char` per character
    - In `useEffect`, call `playHero(containerRef.current, { reducedMotion })`
    - Wrap a hero element in `ParallaxLayer` with a chosen factor
    - _Requirements: 2.1, 4.2, 4.4_

  - [x] 9.4 Implement `ProjectCard` with micro-interaction
    - Author `src/components/ProjectCard.jsx` rendering a `<Link to={`/projects/${slug}`}>` with title, tech chips, and description
    - On `pointerenter` and `focus`, call `playMicro(el, { reducedMotion })` exactly once per activation (debounce repeated events while the animation is in flight)
    - _Requirements: 3.7, 4.6_

  - [x] 9.5 Implement `Projects` page
    - Author `src/routes/Projects.jsx` importing `projects` from the loader and rendering one `Reveal`-wrapped `ProjectCard` per record
    - _Requirements: 2.2, 3.6, 3.7, 4.3_

  - [x] 9.6 Implement `ProjectDetail` page
    - Author `src/routes/ProjectDetail.jsx` reading `useParams().slug` and calling `getProjectBySlug`
    - When found, render `title`, every `tech` chip, every `link` (label text and `href`), `description`, and the `body` via `react-markdown`
    - When not found, render `<NotFound variant="project" />`
    - _Requirements: 2.3, 3.8, 3.9_

  - [x] 9.7 Implement `About` page
    - Author `src/routes/About.jsx` with biographical content
    - _Requirements: 2.4_

  - [x] 9.8 Wire `App` and `main` entry
    - Author `src/App.jsx` rendering `<Nav />`, `<MotionLayout>` around `<Routes>` (paths `/`, `/projects`, `/projects/:slug`, `/about`, `*`), and `<Footer />`
    - Author `src/main.jsx` mounting `<BrowserRouter><App /></BrowserRouter>` into `#root` and importing `src/styles/index.css`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [x] 10. Property tests for routing and content
  - [x] 10.1 Property test for Projects list and navigation
    - **Property 4: Projects page lists and links every record**
    - Render `<Projects />` with arbitrary loader fixtures injected; assert one card per record and that each card's link target is `/projects/${slug}`
    - **Validates: Requirements 3.6, 3.7**

  - [x] 10.2 Property test for ProjectDetail content
    - **Property 5: Project detail renders all record content**
    - For arbitrary `Project_Record`s, render `/projects/{slug}` and assert `title`, every `tech` entry, every link's label and href, description, and rendered Markdown body all appear in the DOM
    - **Validates: Requirements 3.8**

  - [x] 10.3 Property test for unknown slug Not_Found
    - **Property 6: Unknown project slug renders project Not_Found**
    - For arbitrary strings not in the loaded slug set, rendering `/projects/{S}` shows the Not_Found view containing a link to `/projects`
    - **Validates: Requirements 3.9**

  - [x] 10.4 Property test for unknown route Not_Found
    - **Property 7: Unknown route renders site Not_Found**
    - For arbitrary URL paths that do not match any defined route, render the app at the path and assert the Not_Found view contains a link to `/`
    - **Validates: Requirements 2.6**

  - [x] 10.5 Property test for persistent navigation
    - **Property 8: Persistent navigation on every route**
    - For each defined route in `{/, /projects, /projects/:slug, /about}`, render the app and assert links with targets `/`, `/projects`, and `/about` are present
    - **Validates: Requirements 2.5**

  - [x] 10.6 Property test for micro-interaction
    - **Property 14: Micro-interaction trigger plays exactly once per activation**
    - Mock `playMicro`; for arbitrary sequences of `pointerenter`/`focus` activations on a `ProjectCard`, the mock is called exactly once per discrete activation and the element is left at `opacity: 1` with no residual transform after each
    - **Validates: Requirements 4.6, 4.7**

- [x] 11. Configure Netlify deployment
  - [x] 11.1 Author `netlify.toml`
    - Set `[build] command = "npm run build"` and `publish = "dist"`
    - Add a `[[redirects]]` block mapping `/*` to `/index.html` with `status = 200`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 12. Final checkpoint
  - Ensure all tests pass and `npm run build` produces a `dist/` directory. Ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional; they cover property and unit tests and can be skipped for a faster MVP.
- Each implementation task references the granular acceptance-criteria clauses it satisfies for traceability.
- Property tests are colocated with the code they verify so regressions surface immediately when a primitive changes.
- Pages default to `opacity: 1` so users without JS, or before hydration, still see content; only `Reveal`'s non-reduced-motion branch sets `opacity: 0` after mount.
- The loader runs at build time via `import.meta.glob`, so missing required frontmatter fails `npm run build` with the offending path and field — no runtime check needed.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "7.1", "7.6", "11.1"] },
    { "id": 2, "tasks": ["3.2", "7.2"] },
    { "id": 3, "tasks": ["2.2", "3.3", "3.4", "4.1", "5.1", "6.1", "7.3", "7.4", "7.5", "9.1", "9.2", "9.7"] },
    { "id": 4, "tasks": ["4.2", "5.2", "9.3", "9.4", "9.6"] },
    { "id": 5, "tasks": ["9.5"] },
    { "id": 6, "tasks": ["9.8"] },
    { "id": 7, "tasks": ["10.1", "10.2", "10.3", "10.4", "10.5", "10.6"] }
  ]
}
```
