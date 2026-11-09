import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";
import HomePreview from "./HomePreview";
import { AthletePreview, OrganisationPreview } from "./AudiencePreview";
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
              <p className={audience.label}>ATHLETES</p>
              <h2 id="athletes-title">
                Your sporting profile.
                <br />
                Your progress.
              </h2>
              <p className={audience.intro}>
                Give your sporting journey a home. Start with who you are, the
                sports you play and the positions you make your own.
              </p>
              <ul className={audience.benefits}>
                <li>
                  <h3>Build your sporting identity</h3>
                  <p>
                    Create your athlete account and set up your sport and
                    positions in one profile.
                  </p>
                </li>
                <li>
                  <h3>Show the work behind your performance</h3>
                  <p>
                    Our goal is a lasting record of your activities, results and
                    achievements, backed by coach verification.
                  </p>
                </li>
                <li>
                  <h3>Be understood beyond a single match</h3>
                  <p>
                    We’re building towards profiles that give coaches, schools
                    and clubs a fuller picture of your development.
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
            <AthletePreview />
          </div>
        </section>
        <section
          id="how-it-works"
          className={styles.coaching}
          aria-labelledby="coaching-title"
        >
          <div className={styles.coachCopy}>
            <p className={styles.sectionLabel}>COACHES</p>
            <h2 id="coaching-title">
              More time
              <br />
              for the game.
            </h2>
            <p className={styles.intro}>
              Your squad list, your training week, your next match. Keep them
              together in one place.
            </p>
            <div className={styles.features}>
              <div>
                <span>01</span>
                <div>
                  <h3>Create your teams</h3>
                  <p>
                    First XV or U16s. Give each squad its own roster, age group
                    and home ground.
                  </p>
                </div>
              </div>
              <div>
                <span>02</span>
                <div>
                  <h3>Know your players</h3>
                  <p>
                    Add names, positions and shirt numbers. Choose captains and
                    keep your squad up to date.
                  </p>
                </div>
              </div>
              <div>
                <span>03</span>
                <div>
                  <h3>Plan the month</h3>
                  <p>
                    Practice on Monday. Gym on Wednesday. Match on Saturday.
                    Repeat your routine and adjust as you go.
                  </p>
                </div>
              </div>
            </div>
            <Link className={styles.primary} href="/register?role=COACH">
              Create your coach account
            </Link>
          </div>
          <div className={styles.demo}>
            <p className={styles.demoCaption}>
              Take a look inside{" "}
              <span>Try switching teams or opening the roster.</span>
            </p>
            <HomePreview />
            <p className={styles.demoNote}>
              An example of your workspace. Your own teams start with you.
            </p>
          </div>
        </section>
        <section
          id="schools-clubs"
          className={audience.section}
          aria-labelledby="organisations-title"
        >
          <div className={audience.inner}>
            <div className={audience.copy}>
              <p className={audience.label}>SCHOOLS &amp; SPORTING CLUBS</p>
              <h2 id="organisations-title">
                Your whole sporting
                <br />
                programme, together.
              </h2>
              <p className={audience.intro}>
                From the first team to the youngest age group, give your sports
                staff a shared view of who is playing, who is coaching and what
                comes next.
              </p>
              <ul className={audience.benefits}>
                <li>
                  <h3>Coordinate fixtures</h3>
                  <p>
                    Bring teams, opponents, venues and match times into one
                    programme.
                  </p>
                </li>
                <li>
                  <h3>Organise your coaches</h3>
                  <p>
                    Make team responsibilities clear across your coaching staff
                    and age groups.
                  </p>
                </li>
                <li>
                  <h3>Keep track of the season</h3>
                  <p>
                    Follow results and competition logs alongside the fixtures
                    that shape them.
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
