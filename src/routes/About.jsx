/**
 * About page with biographical content.
 *
 * Satisfies Requirement 2.4.
 *
 * @returns {JSX.Element}
 */
export function About() {
  return (
    <main aria-labelledby="about-heading">
      <h1 id="about-heading">About</h1>

      <section className="about__bio">
        <p>
          I'm a software engineer who enjoys working close to the metal — writing
          compilers, renderers, and interactive tools where the gap between intention
          and result is as thin as possible.
        </p>
        <p>
          My background spans systems programming in C++ and Rust, frontend work in
          TypeScript and React, and the occasional dive into graphics and algorithms
          just to understand how things actually work.
        </p>
        <p>
          Outside of code I read a lot, think about programming language design, and
          try to keep my side projects small enough to finish.
        </p>
      </section>

      <section className="about__contact" aria-labelledby="contact-heading">
        <h2 id="contact-heading">Get in touch</h2>
        <p>
          The best way to reach me is on{' '}
          <a
            href="https://github.com/inigo"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          .
        </p>
      </section>
    </main>
  );
}
