import Link from "next/link";
import type { Metadata } from "next";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";
import HomePreview from "./HomePreview";
import styles from "./landing.module.css";

export const metadata: Metadata = {
  title: "PlayVerified | Build your team. Plan their progress.",
  description:
    "Create your rugby teams, manage player rosters, and plan a month of practices, gym sessions and matches. Meet PlayVerified, built for the sporting journey.",
  alternates: { canonical: "/" },
};
const questions = [
  [
    "What can I do on PlayVerified today?",
    "Coaches can create rugby teams, add and manage player rosters, and build monthly team schedules. You can repeat sessions weekly, filter the calendar by team, and edit individual sessions. Account registration and athlete profile setup are also available.",
  ],
  [
    "Do my players need their own accounts?",
    "No. A coach can add players to a team roster by name and optionally add their position, shirt number and captain status. These are coach-managed records; adding a player does not create an account, invite them, or link an existing athlete account.",
  ],
  [
    "Can I manage more than one team?",
    "Yes. Create a separate roster and schedule for each team. Select one team to focus on its sessions, or choose All teams for the bigger picture.",
  ],
  [
    "What can go on a team schedule?",
    "Rugby practices, gym sessions, video reviews, matches, fitness tests and recovery sessions. Add a time, venue and session focus, then choose whether to repeat it on selected weekdays. Scheduling currently uses South African Standard Time.",
  ],
  [
    "Is this only for rugby?",
    "The current coach planning tools are built around rugby. The wider platform is being developed for the sporting journey across different roles and sports.",
  ],
  [
    "Does registration mean my performance is verified?",
    "No. Registering or creating a profile is not verification. Permission-based performance verification, guardian connections and broader talent discovery are part of our roadmap. We do not guarantee selection, recruitment or sporting opportunities.",
  ],
];

export default function Home() {
  return (
    <div className={styles.page}>
      <a href="#main-content" className={styles.skip}>
        Skip to content
      </a>
      <PublicHeader />
      <main id="main-content">
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <div className={styles.release}>
              <i /> COACH TOOLS AVAILABLE NOW
            </div>
            <h1>
              Build your team.
              <br />
              Plan their <em>progress.</em>
            </h1>
            <p className={styles.heroText}>
              Less time piecing the week together. More time helping players
              grow.
            </p>
            <p className={styles.heroDetail}>
              Bring your rugby squads, player rosters and monthly schedules into
              one coaching workspace. Start with the next session. Build towards
              something bigger.
            </p>
            <div className={styles.heroButtons}>
              <Link href="/register?role=COACH" className={styles.buttonDark}>
                Create your coach account <span aria-hidden="true">↗</span>
              </Link>
              <a href="#how-it-works" className={styles.textLink}>
                See how it works <span aria-hidden="true">↓</span>
              </a>
            </div>
            <p className={styles.heroHint}>
              Start with one team. Add players. Plan your month.
            </p>
          </div>
          <div className={styles.heroVisual}>
            <div className={styles.visualLabel}>
              A clearer plan starts here <span aria-hidden="true">↘</span>
            </div>
            <HomePreview />
          </div>
        </section>
        <div className={styles.sessionStrip}>
          <span>MAKE SPACE FOR EVERY PART OF THE GAME</span>
          <div>
            {[
              "Practice",
              "Gym",
              "Video",
              "Match day",
              "Fitness",
              "Recovery",
            ].map((x) => (
              <span key={x}>
                <i />
                {x}
              </span>
            ))}
          </div>
        </div>
        <section className={styles.section} id="how-it-works">
          <div className={styles.sectionIntro}>
            <div>
              <p className={styles.eyebrow}>
                FROM THE FIRST NAME TO THE FIRST WHISTLE
              </p>
              <h2>
                A simple rhythm.
                <br />A better organised team.
              </h2>
            </div>
            <p>
              Keep the essentials together, so your attention can stay where it
              belongs: on your players.
            </p>
          </div>
          <div className={styles.steps}>
            <article>
              <span className={styles.stepNumber}>01 / THE SQUAD</span>
              <div className={styles.stepArt}>
                <span className={styles.teamTile}>XV</span>
                <div>
                  <b>Your team, its own space</b>
                  <small>Rugby · U18 · Home ground</small>
                </div>
              </div>
              <h3>Give every team a home.</h3>
              <p>
                Create a squad with a name, age group and home venue. Keep your
                first team and younger age groups organised separately.
              </p>
              <span className={styles.check}>
                ✓ Multiple teams, one coach account
              </span>
            </article>
            <article>
              <span className={styles.stepNumber}>02 / THE PEOPLE</span>
              <div className={styles.stepArt}>
                <span className={styles.shirt}>09</span>
                <div>
                  <b>A name behind every number</b>
                  <small>Position · Shirt number · Captain</small>
                </div>
              </div>
              <h3>Bring your players together.</h3>
              <p>
                Add a player in a few details, then keep going through the
                squad. Search the roster, edit details and manage active or
                inactive players.
              </p>
              <span className={styles.check}>
                ✓ No player account needed to build a roster
              </span>
            </article>
            <article>
              <span className={styles.stepNumber}>03 / THE PLAN</span>
              <div className={styles.stepArt}>
                <span className={styles.repeat}>↻</span>
                <div>
                  <b>Find your weekly rhythm</b>
                  <small>Mon practice · Wed gym · Sat match</small>
                </div>
              </div>
              <h3>Make the month make sense.</h3>
              <p>
                Plan sessions once or repeat them through the month. Switch
                between teams, use the mobile agenda, and catch overlapping
                sessions.
              </p>
              <span className={styles.check}>
                ✓ One clear view of what’s coming up
              </span>
            </article>
          </div>
        </section>
        <section className={styles.reason}>
          <div>
            <p className={styles.eyebrow}>WHY START NOW?</p>
            <h2>
              Your next training week
              <br />
              deserves a clear plan.
            </h2>
            <p>
              You don’t need a finished season plan to begin. Create your team
              today and build the routine as you go.
            </p>
            <Link href="/register?role=COACH" className={styles.buttonYellow}>
              Start building your squad <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <ul>
            <li>
              <b>One place to return to.</b>
              <span>Your team and schedule are saved to your account.</span>
            </li>
            <li>
              <b>Plan the routine, adjust the details.</b>
              <span>
                Repeat weekly sessions, then edit one when plans change.
              </span>
            </li>
            <li>
              <b>The right team in focus.</b>
              <span>Switch squads without losing the bigger picture.</span>
            </li>
          </ul>
        </section>
        <section
          className={`${styles.section} ${styles.vision}`}
          id="our-vision"
        >
          <div className={styles.visionStatement}>
            <p className={styles.eyebrow}>THE BIGGER PICTURE</p>
            <h2>
              Talent is everywhere.
              <br />
              <em>Opportunity should be too.</em>
            </h2>
            <p>
              A player’s story is bigger than the school they attend or the
              people they know. Our vision is to help sporting effort become a
              lasting, credible record of progress.
            </p>
            <p>
              We’re starting with the people who shape that progress every week:
              coaches and their teams.
            </p>
          </div>
          <div className={styles.roadmap}>
            <div className={styles.roadmapRow}>
              <span className={styles.nowTag}>AVAILABLE NOW</span>
              <h3>The foundations</h3>
              <p>
                Coach team management, player rosters, monthly schedules and
                athlete profile setup.
              </p>
            </div>
            <div className={styles.roadmapRow}>
              <span className={styles.futureTag}>WHERE WE’RE HEADING</span>
              <h3>Progress with context. Opportunity with trust.</h3>
              <p>
                Performance records, permission-based verification, guardian
                involvement and better connections between athletes, coaches,
                schools and scouts.
              </p>
              <small>These wider capabilities are still in development.</small>
            </div>
          </div>
        </section>
        <section className={`${styles.section} ${styles.roles}`}>
          <div className={styles.sectionIntro}>
            <div>
              <p className={styles.eyebrow}>FIND YOUR STARTING POINT</p>
              <h2>
                Different roles.
                <br />A shared sporting journey.
              </h2>
            </div>
          </div>
          <div className={styles.roleGrid}>
            <article>
              <span className={styles.roleIcon}>↗</span>
              <h3>For coaches</h3>
              <p>
                Turn a squad list and training ideas into a team with a clear
                monthly plan.
              </p>
              <Link href="/register?role=COACH">
                Start coaching with PlayVerified →
              </Link>
            </article>
            <article>
              <span className={styles.roleIcon}>◉</span>
              <h3>For athletes</h3>
              <p>
                Create your account and start setting up your sporting profile
                as the platform grows.
              </p>
              <Link href="/register?role=ATHLETE">
                Start your athlete profile →
              </Link>
            </article>
            <article>
              <span className={styles.roleIcon}>⊕</span>
              <h3>For the support team</h3>
              <p>
                Schools, organisations, guardians and scouts are part of the
                wider vision. Dedicated collaboration tools are still being
                developed.
              </p>
              <a href="mailto:info@bulperd.com">
                Talk to us about the journey →
              </a>
            </article>
          </div>
        </section>
        <section className={`${styles.section} ${styles.faq}`} id="questions">
          <div>
            <p className={styles.eyebrow}>BEFORE YOU GET STARTED</p>
            <h2>
              A few things
              <br />
              you might be wondering.
            </h2>
            <p>
              Have another question?
              <br />
              <a href="mailto:info@bulperd.com">Get in touch with us ↗</a>
            </p>
          </div>
          <div>
            {questions.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <span aria-hidden="true">＋</span>
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className={styles.finalCta}>
          <p className={styles.eyebrow}>THE NEXT SESSION STARTS WITH YOU</p>
          <h2>Give your team a place to grow.</h2>
          <p>
            Create your account and put the first piece of the plan in place.
          </p>
          <Link className={styles.buttonDark} href="/register">
            Get started with PlayVerified <span aria-hidden="true">↗</span>
          </Link>
          <small>
            Already part of the team? <Link href="/login">Log in</Link>
          </small>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
