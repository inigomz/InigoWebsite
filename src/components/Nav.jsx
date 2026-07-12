/**
 * @file Renders primary navigation and exposes the active route accessibly.
 */
import { NavLink } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

/**
 * Persistent top-level navigation bar.
 *
 * Renders three `<NavLink>`s to the site's main routes. Each link gets
 * `data-testid="nav-link"` for test selection and an `aria-current="page"`
 * attribute automatically applied by `<NavLink>` when the route is active.
 *
 * @returns {JSX.Element}
 */
export function Nav() {
  return (
    <nav aria-label="Main navigation">
      <NavLink to="/" data-testid="nav-link" end>
        Home
      </NavLink>
      <NavLink to="/projects" data-testid="nav-link">
        Projects
      </NavLink>
      <NavLink to="/about" data-testid="nav-link">
        About
      </NavLink>
      <ThemeToggle />
    </nav>
  );
}
