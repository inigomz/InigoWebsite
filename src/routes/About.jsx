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
          I am a software developer in California who enjoys turning ideas into
          useful and engaging experiences. I like building projects that solve a
          real problem, support a community, or simply make something more fun.
        </p>
        <p>
          My work includes web applications, Discord and Twitch bots, game projects,
          and tools powered by artificial intelligence. I have built gear planners
          for Dungeons and Dragons Online, experimented with data science 
          parallel programming, and created games with Unity and Godot.
        </p>
        <p>
          I am most interested in software that people can interact with and use.
          Each project is a chance to learn a new technology, explore a different
          kind of problem, and improve the way I turn an idea into a finished product.
        </p>
      </section>
      <section className="about__contact" aria-labelledby="contact-heading">
        <h2 id="contact-heading">Get in touch</h2>
        <p>
          The best way to reach me is on{' '}
          <a
            href="https://www.linkedin.com/in/inigoz/"
            target="_blank"
            rel="noopener noreferrer"
          >
            LinkedIn
          </a>
          .
        </p>
      </section>
    </main>
  );
}
