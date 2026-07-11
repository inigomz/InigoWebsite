# Requirements Document

## Introduction

The Portfolio_Website is a React-based single-page application that showcases computer science projects authored by the site owner. The Portfolio_Website is built with Vite, uses React Router for client-side navigation across Home, Projects list, per-project Detail, and About pages, ingests project content from Markdown files with frontmatter, applies anime.js-driven animations at the showcase tier (animated hero, scroll-triggered entrances, parallax, page transitions, micro-interactions), and is deployed as a static site on Netlify. The Portfolio_Website respects the user's `prefers-reduced-motion` setting.

## Glossary

- **Portfolio_Website**: The full React + Vite single-page application defined by this spec, including its routes, content pipeline, animation layer, and deployed Netlify artifact.
- **Router**: The React Router instance configured inside the Portfolio_Website that maps URL paths to page components.
- **Home_Page**: The route at path `/` that contains the animated hero and high-level introduction.
- **Projects_Page**: The route at path `/projects` that lists every project ingested from Markdown.
- **Project_Detail_Page**: The route at path `/projects/:slug` that renders a single project's full Markdown content.
- **About_Page**: The route at path `/about` that contains biographical content about the site owner.
- **Project_Content_Loader**: The build-time module that uses `import.meta.glob` plus a frontmatter parser (gray-matter or vite-plugin-md) to load Markdown files from `src/content/projects/` into typed project records.
- **Project_Record**: A loaded project consisting of a `slug` (derived from filename), frontmatter fields `title`, `tech` (array of strings), `links` (array of `{label, url}`), `description`, and the rendered Markdown body.
- **Animation_Engine**: The anime.js-backed module that exposes the Portfolio_Website's animation primitives (hero, scroll-triggered entrances, parallax, page transitions, micro-interactions).
- **Reduced_Motion_Mode**: The state in which the Portfolio_Website detects `window.matchMedia('(prefers-reduced-motion: reduce)').matches === true`.
- **Netlify_Deployment**: The static hosting target for the Vite production build output (`dist/`), including the SPA redirect rule.
- **SPA_Redirect_Rule**: The Netlify rewrite rule mapping `/*` to `/index.html` with status 200 so client-side routes resolve on direct navigation and refresh.

## Requirements

### Requirement 1: Project Setup and Build

**User Story:** As the site owner, I want a Vite + React project scaffolded with React Router and anime.js, so that I can develop and ship the portfolio with a modern toolchain.

#### Acceptance Criteria

1. THE Portfolio_Website SHALL be implemented as a React application built with Vite.
2. THE Portfolio_Website SHALL include `react-router-dom` as a runtime dependency for client-side routing.
3. THE Portfolio_Website SHALL include `animejs` as a runtime dependency for animations.
4. WHEN the developer runs the project's build script, THE Portfolio_Website SHALL produce a static deployable artifact in the `dist/` directory.
5. WHEN the developer runs the project's dev script, THE Portfolio_Website SHALL serve the application locally with hot module replacement.

### Requirement 2: Routing and Page Structure

**User Story:** As a visitor, I want to navigate between distinct pages, so that I can browse the portfolio in a structured way.

#### Acceptance Criteria

1. THE Router SHALL define a route at path `/` that renders the Home_Page.
2. THE Router SHALL define a route at path `/projects` that renders the Projects_Page.
3. THE Router SHALL define a route at path `/projects/:slug` that renders the Project_Detail_Page for the matching Project_Record.
4. THE Router SHALL define a route at path `/about` that renders the About_Page.
5. THE Portfolio_Website SHALL render a persistent navigation component containing links to Home_Page, Projects_Page, and About_Page on every route.
6. IF the requested URL path does not match any defined route, THEN THE Router SHALL render a Not_Found view that links back to Home_Page.
7. WHEN a visitor loads any defined route URL directly from the browser address bar on the Netlify_Deployment, THE Portfolio_Website SHALL render the corresponding page rather than returning a 404.

### Requirement 3: Markdown Project Content Pipeline

**User Story:** As the site owner, I want each project authored as a Markdown file with frontmatter, so that I can add or edit projects by dropping in a file rather than editing components.

#### Acceptance Criteria

1. THE Project_Content_Loader SHALL load every Markdown file located under `src/content/projects/` at build time using `import.meta.glob`.
2. THE Project_Content_Loader SHALL parse YAML frontmatter from each Markdown file using gray-matter or vite-plugin-md.
3. THE Project_Content_Loader SHALL expose a Project_Record for each file containing the fields `slug`, `title`, `tech`, `links`, `description`, and rendered Markdown body.
4. THE Project_Content_Loader SHALL derive each Project_Record's `slug` from the Markdown filename without its extension.
5. IF a Markdown file is missing any required frontmatter field among `title`, `tech`, `links`, or `description`, THEN THE Project_Content_Loader SHALL fail the Vite build with an error message identifying the offending file and missing field.
6. THE Projects_Page SHALL render one card per Project_Record returned by the Project_Content_Loader.
7. WHEN a visitor activates a project card on the Projects_Page, THE Router SHALL navigate to `/projects/:slug` for that Project_Record.
8. THE Project_Detail_Page SHALL render the Project_Record's `title`, `tech`, `links`, `description`, and Markdown body for the `:slug` route parameter.
9. IF the `:slug` route parameter on `/projects/:slug` does not match any Project_Record, THEN THE Project_Detail_Page SHALL render a Not_Found view that links back to the Projects_Page.

### Requirement 4: Showcase-Tier Animations

**User Story:** As a visitor, I want polished, motion-rich interactions, so that the portfolio feels like a showcase of front-end craft.

#### Acceptance Criteria

1. THE Animation_Engine SHALL be implemented using the `animejs` library.
2. WHEN the Home_Page mounts, THE Animation_Engine SHALL play a hero animation that is either a typewriter text reveal or a staggered SVG path draw.
3. WHEN a project card on the Projects_Page enters the viewport for the first time during a session, THE Animation_Engine SHALL play a scroll-triggered entrance animation on that card.
4. WHILE a visitor scrolls the Home_Page, THE Animation_Engine SHALL apply a parallax transform to at least one designated hero element.
5. WHEN the Router transitions between routes, THE Animation_Engine SHALL play a page transition animation on the outgoing and incoming page containers.
6. WHEN a visitor hovers or focuses an interactive element marked as a micro-interaction target, THE Animation_Engine SHALL play a micro-interaction animation on that element.
7. WHEN any Animation_Engine animation completes, THE Portfolio_Website SHALL leave the animated elements in their final visible, interactive state.

### Requirement 5: Reduced Motion Accessibility

**User Story:** As a visitor with motion sensitivity, I want the site to honor my system's reduced-motion preference, so that I can browse without vestibular discomfort.

#### Acceptance Criteria

1. WHEN the Portfolio_Website loads, THE Portfolio_Website SHALL read the user's preference via `window.matchMedia('(prefers-reduced-motion: reduce)')`.
2. WHILE Reduced_Motion_Mode is active, THE Animation_Engine SHALL skip the hero, scroll-triggered entrance, parallax, and page transition animations and render their target elements directly in their final state.
3. WHILE Reduced_Motion_Mode is active, THE Animation_Engine SHALL either skip micro-interaction animations or replace them with a non-motion state change such as a color or opacity change.
4. WHEN the user's `prefers-reduced-motion` setting changes during a session, THE Portfolio_Website SHALL apply the new setting to subsequent animations without requiring a page reload.

### Requirement 6: Netlify Static Deployment

**User Story:** As the site owner, I want the portfolio deployed on Netlify as a static site, so that hosting is free, fast, and tied to the Git repository.

#### Acceptance Criteria

1. THE Netlify_Deployment SHALL serve the contents of the Vite `dist/` directory as static assets.
2. THE Netlify_Deployment SHALL define a build command that produces the `dist/` directory from source.
3. THE Netlify_Deployment SHALL declare the SPA_Redirect_Rule that rewrites `/*` to `/index.html` with HTTP status 200.
4. WHEN a visitor requests any deep-link URL handled by the Router on the Netlify_Deployment, THE SPA_Redirect_Rule SHALL cause Netlify to return `index.html` so the Router can resolve the route on the client.
5. THE Netlify_Deployment configuration SHALL be checked into the repository as either `netlify.toml` or `public/_redirects` so deployments are reproducible.
