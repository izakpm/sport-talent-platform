import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";
import CoachShowcase from "./CoachShowcase";
import { OrganisationPreview } from "./AudiencePreview";
import AthleteShowcase from "./AthleteShowcase";
import audience from "./audience.module.css";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "PlayVerified | Where performance meets proof",
  description:
    "Bring your rugby team together. Manage your players, plan training and build your monthly schedule with PlayVerified.",
  alternates: { canonical: "/" },
};
const questions = [
  [
    "What can I use today?",
    "Coaches can create rugby teams, manage player rosters and plan monthly schedules. Athlete accounts and profile setup are also available. Performance verification and wider talent discovery are still being developed.",
  ],
  [
    "Do my players need an account?",
    "No. Add players directly to your roster with their name, position and shirt number. These are coach-managed records; adding a player does not create or link an athlete account.",
  ],
  [
    "Can I plan for more than one team?",
    "Yes. Each team has its own roster and sessions. Filter your calendar to one team or view all your teams together. Repeat sessions weekly and edit individual sessions when plans change.",
  ],
  [
    "What can I put on the schedule?",
    "Practice, gym, video reviews, matches, fitness tests and recovery. Add the time, venue and session focus. Schedules currently use South African Standard Time.",
  ],
];
export default function Home() {
  return (
    <div className={styles.page}>
      <a className={styles.skip} href="#main-content">
        Skip to content
      </a>
      <PublicHeader />
      <main id="main-content">
        <div className={styles.opening}>
          <Image
            className={styles.heroImage}
            src="/register-bg.jpg"
            alt=""
            fill
            sizes="100vw"
            preload
          />
          <div className={styles.shade} />
          <section className={styles.hero} aria-labelledby="home-title">
            <div className={styles.heroCopy}>
              <h1 id="home-title">
                Where
                <br />
                performance
                <br />
                meets <span>proof.</span>
              </h1>
              <h2 className={styles.heroSubheading}>
                For the players putting in the work.
                <br />
                And the coaches who help them get there.
              </h2>
              <p className={styles.heroDescription}>
                A home for athletes and coaches to build sporting profiles
                backed by verified performance. Bring training and sporting
                activities together, with team management and scheduling
                available now. We’re developing profile verification and tools
                for schools and sporting clubs to organise fixtures, coaches and
                competition logs.
              </p>
              <div className={styles.heroActions}>
                <Link className={styles.primary} href="/register">
                  Join PlayVerified
                </Link>
              </div>
            </div>
          </section>
        </div>
        <section
          id="athletes"
          className={audience.section}
          aria-labelledby="athletes-title"
        >
          <Image
            src="/register-bg3.jpg"
            alt=""
            fill
            sizes="100vw"
            className={audience.backdrop}
          />
          <div className={audience.inner}>
            <div className={audience.copy}>
              <p className={`${audience.label} ${audience.athleteLabel}`}>
                ATHLETES
              </p>
              <h2 id="athletes-title">
                Your dedication
                <br />
                deserves to be seen.
              </h2>
              <p className={audience.intro}>
                Talent is a starting point. The early mornings, the extra reps
                and the choice to go again are what you build on. Start a
                sporting profile that tells your story beyond the scoreboard.
              </p>
              <ul className={audience.benefits}>
                <li>
                  <h3>More than a name on a team sheet</h3>
                  <p>
                    Your sport. Your positions. Your identity as an athlete.
                    Create a profile that starts with you and grows with your
                    sporting journey.
                  </p>
                </li>
                <li>
                  <h3>Build a record you can stand behind</h3>
                  <p>
                    We’re developing performance records and coach verification
                    so your hard work can become evidence of how far you’ve
                    come.
                  </p>
                </li>
                <li>
                  <h3>One match doesn’t tell your whole story</h3>
                  <p>
                    Your progress deserves context. Our vision is to help
                    coaches, schools and clubs see the athlete you’re becoming,
                    beyond a single result.
                  </p>
                </li>
              </ul>
              <p className={audience.availability}>
                Profile setup is available now. Performance records,
                verification and profile sharing are in development.
              </p>
              <Link className={styles.primary} href="/register?role=ATHLETE">
                Create your athlete profile
              </Link>
            </div>
            <AthleteShowcase />
          </div>
        </section>
        <div className={styles.coachBand}>
          <section
            id="how-it-works"
            className={styles.coaching}
            aria-labelledby="coaching-title"
          >
            <div className={styles.coachCopy}>
              <p className={styles.sectionLabel}>COACHES</p>
              <h2 id="coaching-title">
                Turn potential
                <br />
                into progress.
              </h2>
              <p className={styles.intro}>
                You see what your players can become. Every session is a chance
                to help them get there. Bring your squads, player rosters and
                training plans into one workspace, so you can spend more time
                coaching and less time keeping track.
              </p>
              <div className={styles.features}>
                <div>
                  <span>01</span>
                  <div>
                    <h3>Know your squad. Be ready to coach.</h3>
                    <p>
                      Keep every team organised, from your First XV to the U16s.
                      Find player names, positions, shirt numbers and captains
                      without piecing together another squad list.
                    </p>
                  </div>
                </div>
                <div>
                  <span>02</span>
                  <div>
                    <h3>Give every session a purpose</h3>
                    <p>
                      Turn your coaching ideas into a clear monthly plan.
                      Schedule practice, gym, video reviews and matches with a
                      time, venue and focus for each session.
                    </p>
                  </div>
                </div>
                <div>
                  <span>03</span>
                  <div>
                    <h3>Build a routine you can keep</h3>
                    <p>
                      Repeat weekly sessions, adjust individual dates and switch
                      between teams. Keep the plan moving when the season
                      changes, without starting from scratch.
                    </p>
                  </div>
                </div>
              </div>
              <Link className={styles.primary} href="/register?role=COACH">
                Create your coach account
              </Link>
            </div>
            <div className={styles.demo}>
              <CoachShowcase />
            </div>
          </section>
        </div>
        <section
          id="schools-clubs"
          className={audience.section}
          aria-labelledby="organisations-title"
        >
          <div className={audience.inner}>
            <div className={audience.copy}>
              <p className={audience.label}>SCHOOLS &amp; SPORTING CLUBS</p>
              <h2 id="organisations-title">
                Give every team
                <br />
                the support to thrive.
              </h2>
              <p className={audience.intro}>
                Your school or club is where sporting journeys take shape. We’re
                building PlayVerified to bring fixtures, coaches and competition
                records together, so your staff can spend less time chasing
                updates and more time supporting every team.
              </p>
              <ul className={audience.benefits}>
                <li>
                  <h3>Get everyone working from the same plan</h3>
                  <p>
                    Bring opponents, venues and match times into one fixture
                    programme. Give your staff a clear view of what’s coming up
                    across teams and age groups.
                  </p>
                </li>
                <li>
                  <h3>Give your coaches clarity</h3>
                  <p>
                    Make it clear who is responsible for each team. Keep
                    coaching assignments together, so your sporting programme is
                    easier to coordinate as staff and squads change.
                  </p>
                </li>
                <li>
                  <h3>See the whole season</h3>
                  <p>
                    Bring results and competition logs alongside your fixtures.
                    Follow each team’s season and give your sports staff the
                    context to plan what comes next.
                  </p>
                </li>
              </ul>
              <p className={audience.availability}>
                These organisation tools are in development. Explore the example
                and talk to us about what your school or club needs.
              </p>
              <a
                className={styles.primary}
                href="mailto:info@bulperd.com?subject=PlayVerified%20for%20our%20school%20or%20club"
              >
                Talk to us about your organisation
              </a>
            </div>
            <OrganisationPreview />
          </div>
        </section>
        <section
          id="questions"
          className={styles.faq}
          aria-labelledby="faq-title"
        >
          <div>
            <p className={styles.sectionLabel}>A FEW PRACTICAL DETAILS</p>
            <h2 id="faq-title">
              Before you
              <br />
              get started.
            </h2>
            <a href="mailto:info@bulperd.com">Have a question? Get in touch.</a>
          </div>
          <div className={styles.answers}>
            {questions.map(([question, answer]) => (
              <details key={question}>
                <summary>
                  {question}
                  <span aria-hidden="true">+</span>
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className={styles.join}>
          <div>
            <p className={styles.sectionLabel}>YOUR NEXT SEASON STARTS HERE</p>
            <h2>Bring your team.</h2>
          </div>
          <Link className={styles.primary} href="/register">
            Get started with PlayVerified
          </Link>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
