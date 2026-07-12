/**
 * @file Defines the persistent site shell and maps URLs to page components.
 */
import { Routes, Route } from 'react-router-dom';

import { Nav } from './components/Nav';
import { Footer } from './components/Footer';
import { MotionLayout } from './components/MotionLayout';

import { Home } from './routes/Home';
import { Projects } from './routes/Projects';
import { ProjectDetail } from './routes/ProjectDetail';
import { About } from './routes/About';
import { NotFound } from './routes/NotFound';

/**
 * Root application component.
 *
 * Renders the persistent `<Nav>`, wraps the route tree in `<MotionLayout>`
 * for animated page transitions, and closes with `<Footer>`.
 *
 * Satisfies Requirements 2.1–2.6.
 *
 * @returns {JSX.Element}
 */
export function App() {
  return (
    <>
      <Nav />
      <MotionLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:slug" element={<ProjectDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </MotionLayout>
      <Footer />
    </>
  );
}
