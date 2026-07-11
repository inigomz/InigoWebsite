# Design Document

## Overview

The Portfolio_Website is a single-page React 18 application built with Vite. React Router v6 handles client-side navigation across Home, Projects list, Project Detail, About, and Not Found pages. Project content lives as Markdown files with YAML frontmatter under `src/content/projects/`, loaded eagerly at build time via `import.meta.glob` and parsed with `gray-matter`. anime.js powers a showcase-tier animation layer (hero reveal, scroll-triggered card entrances, hero parallax, route transitions, and hover/focus micro-interactions). All motion is gated by a single `prefers-reduced-motion` hook so reduced-motion users see content in its final state. The production bundle is deployed as static assets to Netlify, with a `netlify.toml` SPA redirect rule so deep links resolve through the client router.

## Architecture

### High-level Component Tree

```
<BrowserRouter>
  <App>                              // shell, ReducedMotionProvider, MotionLayout
    <Nav />                          // persistent top navigation
    <MotionLayout>                   // wraps <Routes> for page transitions
      <Routes>
        <Route path="/"               element={<Home />} />
        <Route path="/projects"       element={<Projects />} />
        <Route path="/projects/:slug" element={<ProjectDetail />} />
        <Route path="/about"          element={<About />} />
        <Route path="*"               element={<NotFound />} />
      </Routes>
    </MotionLayout>
    <Footer />
  </App>
</BrowserRouter>
```

### Module Layout

```
src/
  main.jsx                  // Vite entry, mounts <App/> in <BrowserRouter>
  App.jsx                   // shell, providers, routes
  routes/
    Home.jsx                // animated hero + parallax target
    Projects.jsx            // grid of ProjectCard, scroll-triggered
    ProjectDetail.jsx       // single record render
    About.jsx
    NotFound.jsx            // generic 404 (also used as project-not-found)
  components/
    Nav.jsx                 // links to /, /projects, /about
    Footer.jsx
    ProjectCard.jsx         // micro-interaction target
    MotionLayout.jsx        // page-transition wrapper
    ParallaxLayer.jsx       // scroll-driven transform target
    Reveal.jsx              // wraps children with IntersectionObserver entrance
  content/
    projects/
      *.md                  // authored project records
    loader.js               // import.meta.glob + gray-matter; throws on invalid frontmatter
    schema.js               // required-field list + validator
  motion/
    engine.js               // animejs primitives: hero, reveal, parallax, transition, micro
    useReducedMotion.js     // matchMedia hook with live updates
    tokens.js               // durations, easings, stagger
  styles/
    index.css
public/
  favicon.svg
netlify.toml                // build cmd, publish dir, SPA redirect
vite.config.js
package.json
```

### Build & Deploy Pipeline

- `npm run dev` -> Vite dev server with HMR on port 5173.
- `npm run build` -> Vite production build into `dist/`. The Markdown loader runs as part of bundling because `import.meta.glob` resolves at build time; missing required frontmatter fields throw and fail the build.
- Netlify reads `netlify.toml`, runs `npm run build`, publishes `dist/`, and applies the SPA redirect.

## Components and Interfaces

### Project_Content_Loader (`src/content/loader.js`)

Loads every `.md` file in `src/content/projects/` eagerly so the result is a synchronous array baked into the bundle. Validates required frontmatter and derives the slug from the filename.

```js
// src/content/loader.js
import matter from 'gray-matter';
import { REQUIRED_FIELDS } from './schema';

// Eager glob: { '/src/content/projects/foo.md': '---\n...---\n...' }
const modules = import.meta.glob('./projects/*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

function slugFromPath(path) {
  return path.split('/').pop().replace(/\.md$/, '');
}

function validate(filePath, data) {
  for (const field of REQUIRED_FIELDS) {
    const value = data[field];
    const empty =
      value === undefined ||
      value === null ||
      (Array.isArray(value) && value.length === 0) ||
      (typeof value === 'string' && value.trim() === '');
    if (empty) {
      throw new Error(
        `[portfolio-website] ${filePath}: missing required frontmatter field "${field}"`
      );
    }
  }
}

export const projects = Object.entries(modules)
  .map(([path, raw]) => {
    const { data, content } = matter(raw);
    validate(path, data);
    return {
      slug: slugFromPath(path),
      title: data.title,
      tech: data.tech,           // string[]
      links: data.links,         // { label, url }[]
      description: data.description,
      body: content,             // raw markdown body, rendered with react-markdown
    };
  })
  .sort((a, b) => a.title.localeCompare(b.title));

export function getProjectBySlug(slug) {
  return projects.find((p) => p.slug === slug);
}
```

```js
// src/content/schema.js
export const REQUIRED_FIELDS = ['title', 'tech', 'links', 'description'];
```

### Animation_Engine (`src/motion/engine.js`)

Thin wrapper over anime.js that centralizes durations, easings, and the reduced-motion gate. Every primitive accepts a `reducedMotion` flag and short-circuits to the final state when true.

```js
// src/motion/engine.js
import anime from 'animejs';
import { DURATION, EASING, STAGGER } from './tokens';

export function playHero(target, { reducedMotion } = {}) {
  if (reducedMotion) {
    target.style.opacity = '1';
    target.style.transform = 'none';
    return Promise.resolve();
  }
  return anime({
    targets: target.querySelectorAll('[data-hero-char]'),
    opacity: [0, 1],
    translateY: [12, 0],
    delay: anime.stagger(STAGGER.hero),
    duration: DURATION.hero,
    easing: EASING.standard,
  }).finished;
}

export function playReveal(el, { reducedMotion } = {}) {
  if (reducedMotion) {
    el.style.opacity = '1';
    el.style.transform = 'none';
    return Promise.resolve();
  }
  return anime({
    targets: el,
    opacity: [0, 1],
    translateY: [16, 0],
    duration: DURATION.reveal,
    easing: EASING.standard,
  }).finished;
}

export function applyParallax(el, scrollY, { reducedMotion } = {}) {
  if (reducedMotion) {
    el.style.transform = 'none';
    return;
  }
  const factor = Number(el.dataset.parallax || 0.2);
  el.style.transform = `translate3d(0, ${scrollY * factor}px, 0)`;
}

export function playTransition(outgoing, incoming, { reducedMotion } = {}) {
  if (reducedMotion) {
    if (outgoing) outgoing.style.opacity = '1';
    if (incoming) incoming.style.opacity = '1';
    return Promise.resolve();
  }
  const out = outgoing
    ? anime({ targets: outgoing, opacity: [1, 0], duration: DURATION.transitionOut, easing: EASING.standard }).finished
    : Promise.resolve();
  const inn = incoming
    ? anime({ targets: incoming, opacity: [0, 1], translateY: [8, 0], duration: DURATION.transitionIn, easing: EASING.standard }).finished
    : Promise.resolve();
  return Promise.all([out, inn]);
}

export function playMicro(el, { reducedMotion } = {}) {
  if (reducedMotion) {
    el.dataset.microState = 'active'; // CSS handles non-motion change
    return Promise.resolve();
  }
  return anime({
    targets: el,
    scale: [1, 1.03, 1],
    duration: DURATION.micro,
    easing: EASING.spring,
  }).finished;
}
```

```js
// src/motion/useReducedMotion.js
import { useEffect, useState } from 'react';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}
```

### Reveal Component (Scroll-Triggered Entrances)

```jsx
// src/components/Reveal.jsx
import { useEffect, useRef } from 'react';
import { playReveal } from '../motion/engine';
import { useReducedMotion } from '../motion/useReducedMotion';

export function Reveal({ as: Tag = 'div', children, ...rest }) {
  const ref = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reducedMotion) {
      playReveal(el, { reducedMotion: true });
      return;
    }
    el.style.opacity = '0';
    const io = new IntersectionObserver(
      (entries, observer) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            playReveal(entry.target, { reducedMotion: false });
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);

  return <Tag ref={ref} {...rest}>{children}</Tag>;
}
```

### MotionLayout (Page Transitions)

Wraps `<Routes>` and animates the outgoing/incoming page containers when `useLocation().pathname` changes.

```jsx
// src/components/MotionLayout.jsx
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { playTransition } from '../motion/engine';
import { useReducedMotion } from '../motion/useReducedMotion';

export function MotionLayout({ children }) {
  const { pathname } = useLocation();
  const containerRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState({ pathname, children });

  useEffect(() => {
    const outgoing = containerRef.current;
    playTransition(outgoing, null, { reducedMotion }).then(() => {
      setDisplayed({ pathname, children });
      requestAnimationFrame(() => {
        playTransition(null, containerRef.current, { reducedMotion });
      });
    });
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={containerRef} data-page={displayed.pathname}>{displayed.children}</div>;
}
```

### Routing & Pages

- `Home` mounts the hero animation in a `useEffect` and registers a scroll listener that calls `applyParallax` on a designated `[data-parallax]` element via `requestAnimationFrame`.
- `Projects` maps `projects` to `<ProjectCard>` components inside `<Reveal>` wrappers and renders them as a grid. Each card is a `<Link to={`/projects/${slug}`}>`.
- `ProjectDetail` reads `useParams().slug`, looks the record up via `getProjectBySlug`, and renders title, tech chips, link list, description, and body via `react-markdown`. If `getProjectBySlug` returns `undefined`, it renders `<NotFound variant="project" />` which links back to `/projects`.
- `NotFound` accepts a `variant` prop (`'site' | 'project'`) so the global catch-all renders a Home link and the project-not-found case renders a Projects link.
- `Nav` renders three `<NavLink>`s with `data-testid="nav-link"` for testability.

### Netlify Configuration

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Data Models

### Project_Record

| Field        | Type                              | Source                       |
|--------------|-----------------------------------|------------------------------|
| slug         | string                            | filename without `.md`       |
| title        | string                            | frontmatter `title`          |
| tech         | string[]                          | frontmatter `tech`           |
| links        | `{ label: string; url: string }[]`| frontmatter `links`          |
| description  | string                            | frontmatter `description`    |
| body         | string (raw markdown)             | content after frontmatter    |

### Markdown Frontmatter Example

```markdown
---
title: "Raycasting Engine"
tech: ["C++", "OpenGL", "GLFW"]
links:
  - { label: "Repo", url: "https://github.com/inigo/raycaster" }
  - { label: "Demo", url: "https://example.com/demo" }
description: "A real-time software raycaster with portal rendering."
---

## Overview

Body content in **Markdown**...
```

## Error Handling

- **Build-time frontmatter validation**: `loader.js` throws a descriptive `Error` naming the file path and missing field. Vite surfaces it as a build failure, satisfying Requirement 3.5.
- **Unknown project slug**: `ProjectDetail` renders `NotFound` with a Projects link. The global catch-all route renders `NotFound` with a Home link, satisfying 2.6 and 3.9.
- **No-JS / pre-hydration paint**: Page containers default to `opacity: 1`. The `Reveal` component only sets `opacity: 0` after mount in the non-reduced-motion branch, so users without JS still see content.
- **Animation failures**: `playX` functions return promises; the engine catches and logs errors but always resolves so route transitions cannot get stuck mid-fade.
- **Reduced motion live changes**: `useReducedMotion` subscribes to `MediaQueryList.change`. Subsequent invocations of any engine primitive read the latest hook value through the consuming component, so toggling the OS setting takes effect on the next animation without a reload.

## Correctness Pre-work Reflection

The prework above identified the following property candidates and consolidations:

- Combined Requirement 4.7 (final visible interactive state) into each animation property as a post-condition.
- Combined Requirements 5.2 and 5.3 into a single reduced-motion gate property parameterized over animation kind.
- Kept 3.6 (card-per-record) and 3.7 (card click navigates) as one navigation property over the loaded set.
- Kept 3.3 (record shape) separate from 3.8 (detail rendering) because they validate different layers (data vs. view).

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system - essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Slug derivation

For any Markdown filename of the form `<name>.md` placed under `src/content/projects/`, the resulting Project_Record's `slug` equals `<name>`.

**Validates: Requirements 3.4**

### Property 2: Loader produces one well-formed record per valid file

For any non-empty set of valid Markdown files under `src/content/projects/`, the Project_Content_Loader returns exactly one Project_Record per file, and every record has populated, well-typed `slug`, `title`, `tech` (non-empty string array), `links` (array of `{label, url}`), `description`, and `body` fields.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 3: Missing required frontmatter fails the build with a precise error

For any valid Markdown file with any non-empty subset of `{title, tech, links, description}` removed from its frontmatter, the loader throws an error whose message contains both the source file path and the name of every missing field.

**Validates: Requirements 3.5**

### Property 4: Projects page lists and links every record

For any list of Project_Records returned by the loader, the Projects_Page renders exactly one card per record, and activating the card for record R navigates the Router to `/projects/{R.slug}`.

**Validates: Requirements 3.6, 3.7**

### Property 5: Project detail renders all record content

For any Project_Record R, rendering `/projects/{R.slug}` displays R.title, every entry of R.tech, every entry of R.links (both label text and url href), R.description, and the rendered Markdown body.

**Validates: Requirements 3.8**

### Property 6: Unknown project slug renders project Not_Found

For any string S that is not the slug of any loaded Project_Record, rendering `/projects/{S}` renders the Not_Found view and that view contains a link whose target is `/projects`.

**Validates: Requirements 3.9**

### Property 7: Unknown route renders site Not_Found

For any URL path P that does not match any defined route in the Router, rendering the application at P renders the Not_Found view and that view contains a link whose target is `/`.

**Validates: Requirements 2.6**

### Property 8: Persistent navigation on every route

For any defined route path among `{/, /projects, /projects/:slug, /about}`, rendering the application at that path renders a navigation region containing links whose targets are `/`, `/projects`, and `/about`.

**Validates: Requirements 2.5**

### Property 9: Reduced motion gate skips motion and leaves elements in final state

For any animation kind K in `{hero, scroll-entrance, parallax, page-transition, micro-interaction}` and any target element E, when `prefers-reduced-motion: reduce` is active, invoking the engine for K on E performs no anime.js timeline (or only a non-motion property change) and leaves E with `opacity: 1`, no residual transform, and pointer events not disabled.

**Validates: Requirements 5.2, 5.3, 4.7**

### Property 10: Live reduced-motion preference toggles take effect

For any sequence of `prefers-reduced-motion` media-query changes during a session, every engine invocation that follows a change observes the new preference value (no reload required).

**Validates: Requirements 5.4**

### Property 11: Scroll-triggered entrance fires once per card

For any list of project cards mounted on the Projects_Page, simulating an IntersectionObserver entry for each card triggers exactly one entrance animation per card and leaves each card visible (opacity 1, no residual transform) after completion.

**Validates: Requirements 4.3, 4.7**

### Property 12: Parallax transform is a deterministic function of scroll position

For any non-negative scroll offset `y` and any element E with `data-parallax="f"`, `applyParallax(E, y)` produces the CSS transform `translate3d(0, y*f px, 0)`, and for any two offsets `y1 < y2` the resulting translateY values satisfy `y1*f <= y2*f`.

**Validates: Requirements 4.4**

### Property 13: Route transition animates outgoing and incoming containers

For any pair of distinct defined routes (A, B), navigating from A to B invokes the page-transition primitive with the outgoing container element of A and the incoming container element of B, and after completion both the previous and new containers are removed/visible respectively with opacity 1 and no residual transform.

**Validates: Requirements 4.5, 4.7**

### Property 14: Micro-interaction trigger plays exactly once per activation

For any element E marked as a micro-interaction target, dispatching a hover (`pointerenter`) or focus event invokes the micro-interaction primitive exactly once per activation, and after completion E is left with opacity 1 and no residual transform.

**Validates: Requirements 4.6, 4.7**
