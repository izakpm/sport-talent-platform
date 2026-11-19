import type { Metadata } from "next";
import PublicHeader from "../PublicHeader";
import PublicFooter from "../PublicFooter";
import NetworkDirectory from "./NetworkDirectory";
import s from "./network.module.css";

export const metadata: Metadata = {
  title: "Our Network | PlayVerified",
  description:
    "Meet PlayVerified’s partners and explore our school and university directory. Building connections across schools, sporting clubs and universities.",
  alternates: { canonical: "/network" },
};
export default function NetworkPage() {
  return (
    <div className={s.page}>
      <a className={s.skip} href="#network">
        Skip to our network
      </a>
      <PublicHeader />
      <main id="network">
        <section className={s.hero}>
          <div className={s.heroInner}>
            <p className={s.eyebrow}>OUR NETWORK</p>
            <h1>
              More connections.
              <br />
              <em>More opportunity.</em>
            </h1>
            <p className={s.intro}>
              Bringing schools, sporting clubs and universities closer to the
              athletes putting in the work.
            </p>
            <a
              href="mailto:info@bulperd.com?subject=PlayVerified%20partnership"
              className={s.cta}
            >
              Partner with PlayVerified <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
        <NetworkDirectory />
        <section className={s.invitation}>
          <div>
            <p className={s.eyebrow}>SCHOOLS · CLUBS · UNIVERSITIES</p>
            <h2>
              Help the next generation
              <br />
              take their next step.
            </h2>
            <p>
              Connect with us about bringing your organisation into the
              PlayVerified network.
            </p>
          </div>
          <a
            href="mailto:info@bulperd.com?subject=PlayVerified%20partnership"
            className={s.cta}
          >
            Let’s talk <span aria-hidden="true">↗</span>
          </a>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
