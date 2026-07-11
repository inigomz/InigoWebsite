/**
 * Site-wide footer landmark.
 *
 * @returns {JSX.Element}
 */
export function Footer() {
  return (
    <footer aria-label="Site footer">
      <p>© {new Date().getFullYear()} Inigo. Built with React + Vite.</p>
    </footer>
  );
}
