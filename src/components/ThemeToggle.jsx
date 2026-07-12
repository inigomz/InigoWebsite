import { useCallback, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'portfolio-theme';
const MIST_DURATION = 700; // ms — how long the orange mist overlay stays visible

/**
 * Reads the stored or system preference and applies it to <html>.
 * Returns the active theme string ('dark' | 'light').
 */
function resolveInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch (_) { /* private browsing */ }
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/**
 * Animated sun ☀ / moon ☽ theme-toggle button.
 *
 * On click it plays an orange-mist overlay that expands from the button's
 * position and fades out, then flips the [data-theme] attribute on <html>.
 */
export function ThemeToggle() {
  const [theme, setTheme] = useState(resolveInitialTheme);
  const [misting, setMisting] = useState(false);
  const [mistTarget, setMistTarget] = useState(null);
  const mistRef = useRef(null);
  const btnRef = useRef(null);
  const timerRef = useRef(null);

  // Apply theme to document on mount and whenever it changes.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) {}
  }, [theme]);

  // Clean up the timer if the component unmounts during a transition.
  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleClick = useCallback(() => {
    if (misting) return; // ignore rapid clicks during transition

    // Position the mist origin at the button's center.
    if (btnRef.current && mistRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mistRef.current.style.setProperty('--mist-x', `${cx}px`);
      mistRef.current.style.setProperty('--mist-y', `${cy}px`);
    }

    setMistTarget(theme === 'dark' ? 'light' : 'dark');
    setMisting(true);

    // Flip the theme halfway through so the new colours emerge from under the mist.
    timerRef.current = setTimeout(() => {
      setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
    }, MIST_DURATION * 0.45);

    // Remove the overlay once the animation finishes.
    timerRef.current = setTimeout(() => {
      setMisting(false);
    }, MIST_DURATION);
  }, [misting, theme]);

  const isDark = theme === 'dark';

  return (
    <>
      {/* Full-screen mist overlay — animates outward from the button */}
      <div
        ref={mistRef}
        aria-hidden="true"
        className={`theme-mist${misting ? ' theme-mist--active' : ''}${
          mistTarget ? ` theme-mist--to-${mistTarget}` : ''
        }`}
      />

      {/* Toggle button */}
      <button
        ref={btnRef}
        type="button"
        className="theme-toggle"
        onClick={handleClick}
        aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <span className="theme-toggle__track">
          {/* Sun icon */}
          <svg className="theme-toggle__icon theme-toggle__icon--sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          {/* Moon icon */}
          <svg className="theme-toggle__icon theme-toggle__icon--moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <span className="theme-toggle__thumb" />
        </span>
      </button>
    </>
  );
}
