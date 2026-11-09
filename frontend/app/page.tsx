import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";
import HomePreview from "./HomePreview";
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
                A home for athletes and coaches to build sporting profiles backed
                by verified performance. Bring training and sporting activities
                together, with team management and scheduling available now.
                We’re developing profile verification and tools for schools and
                sporting clubs to organise fixtures, coaches and competition logs.
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
          id="how-it-works"
          className={styles.coaching}
          aria-labelledby="coaching-title"
        >
          <div className={styles.coachCopy}>
            <p className={styles.sectionLabel}>FOR COACHES · AVAILABLE NOW</p>
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
          id="our-vision"
          className={styles.vision}
          aria-labelledby="vision-title"
        >
          <div className={styles.visionPhoto}>
            <Image
              src="/register-bg3.jpg"
              alt="Rugby players carrying the ball into a tackle"
              fill
              sizes="(max-width: 760px) 100vw, 55vw"
            />
            <span className={styles.photoCaption}>
              THE WORK. THE TEAM. THE POSSIBILITIES.
            </span>
          </div>
          <div className={styles.visionCopy}>
            <p className={styles.sectionLabel}>WHY PLAYVERIFIED</p>
            <h2 id="vision-title">
              A player’s story
              <br />
              should travel
              <br />
              beyond the field.
            </h2>
            <p>
              There’s talent in every school and every club. We want to help
              players build a record of their effort and progress, wherever they
              come from.
            </p>
            <p>
              That starts with coaches and teams. Next comes performance
              tracking, verification and connections with schools and scouts.
            </p>
            <small>These wider capabilities are still in development.</small>
            <Link className={styles.textLink} href="/register?role=ATHLETE">
              Start your athlete profile <span aria-hidden="true">→</span>
            </Link>
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
