import { useEffect, useRef } from 'react';

import { ParallaxLayer } from '../components/ParallaxLayer';
import { playHero } from '../motion/engine';
import { useReducedMotion } from '../motion/useReducedMotion';

const HERO_TEXT = "Hi, I'm Inigo.";

/**
 * Home page with an animated hero heading and a parallax background element.
 *
 * Each character of the hero text is wrapped in a `<span data-hero-char>`
 * so `playHero` can stagger them in. A decorative blob behind the heading
 * is wrapped in `<ParallaxLayer>` for a depth effect on scroll.
 *
 * @returns {JSX.Element}
 */
export function Home() {
  const containerRef = useRef(null);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (containerRef.current) {
      playHero(containerRef.current, { reducedMotion });
    }
  }, [reducedMotion]);

  return (
    <main aria-labelledby="hero-heading">
      {/* Parallax decorative background */}
      <ParallaxLayer factor={0.15} aria-hidden="true" className="hero-bg" />

      <section ref={containerRef} className="hero">
        <h1 id="hero-heading">
          {HERO_TEXT.split('').map((char, i) => (
            <span
              key={i}
              data-hero-char
              aria-hidden={char === ' ' ? 'true' : undefined}
            >
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))}
        </h1>
        <p className="hero-sub">
          I build practical web apps, community tools, and games that turn complex
          ideas into useful experiences.
        </p>
      </section>
    </main>
  );
}
