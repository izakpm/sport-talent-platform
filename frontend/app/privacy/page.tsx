import type { Metadata } from "next";
import PublicHeader from "../PublicHeader";
import PublicFooter from "../PublicFooter";
import styles from "../landing.module.css";

export const metadata: Metadata = {
  title: "Privacy Policy | PlayVerified",
  description:
    "How Bulperd (Pty) Ltd collects, uses and handles personal information on PlayVerified, including Google sign-in and team roster records.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className={styles.page}>
      <a href="#privacy-content" className={styles.skip}>
        Skip to privacy policy
      </a>
      <PublicHeader />
      <main id="privacy-content" className={styles.legal}>
        <p className={styles.eyebrow}>YOUR INFORMATION, EXPLAINED</p>
        <h1>Privacy policy</h1>
        <p>Effective date: 9 November 2026 · Last updated: 9 November 2026</p>
        <div className={styles.legalIntro}>
          <p>
            PlayVerified helps people organise their sporting journey. This
            policy explains the personal information we handle when you visit
            our website, create an account, use Google sign-in, or use features
            such as team rosters and schedules. It also explains how to contact
            us about your information, including if a coach has added you to a
            roster without a PlayVerified account.
          </p>
        </div>
        <nav className={styles.toc} aria-label="Privacy policy contents">
          <a href="#operator">Who we are</a>
          <a href="#information">Information we collect</a>
          <a href="#google">Google sign-in</a>
          <a href="#sharing">Sharing & storage</a>
          <a href="#children">Young players</a>
          <a href="#rights">Your choices & requests</a>
        </nav>
        <section id="operator">
          <h2>1. Who is responsible for your information?</h2>
          <p>
            PlayVerified is operated by <strong>Bulperd (Pty) Ltd</strong>,
            South Africa. Bulperd is the responsible party for personal
            information it processes to operate PlayVerified. Coaches, schools
            and organisations that submit other people’s information may also
            have their own responsibilities under applicable data-protection
            law.
          </p>
          <address>
            Bulperd (Pty) Ltd
            <br />
            232 Airport Road, Cynthia Vale
            <br />
            Pretoria, 0186, South Africa
            <br />
            Email: <a href="mailto:info@bulperd.com">info@bulperd.com</a>
            <br />
            Telephone: <a href="tel:+27823150604">082 315 0604</a> (outside
            South Africa: +27 82 315 0604)
          </address>
        </section>
        <section id="information">
          <h2>2. Information we collect and where it comes from</h2>
          <ul>
            <li>
              <strong>Account details you provide:</strong> your name, email
              address, chosen account role and, for email-and-password
              registration, a password stored as a password hash.
            </li>
            <li>
              <strong>Profile and sporting details you choose to enter:</strong>{" "}
              for example a profile image, contact details, sports, positions,
              school or organisation, location details and sporting records,
              where the relevant feature is available.
            </li>
            <li>
              <strong>Coach workspace information:</strong> team names, age
              groups, venues and schedules, including session dates, times,
              types and notes. A roster can include a player’s first and last
              name, rugby position, shirt number, captain status and active or
              inactive status.
            </li>
            <li>
              <strong>Information supplied by another person:</strong> a coach
              or authorised organisation may enter a player’s roster details. A
              roster entry does not automatically create a player account, link
              an existing account, or send an invitation.
            </li>
            <li>
              <strong>Support communications:</strong> information you provide
              when you contact us, including details needed to identify and
              respond to your request.
            </li>
            <li>
              <strong>Technical information:</strong> hosting and security
              systems may process IP addresses, browser and device information,
              request timestamps, error details and access logs to deliver and
              protect the service.
            </li>
          </ul>
          <p>
            Required account fields are needed to register and sign in. Other
            fields are optional unless identified as required for a particular
            feature. If you do not provide required information, we may be
            unable to provide that feature. Please avoid entering
            identity-document numbers, medical information or other unnecessary
            sensitive information in free-text fields or session notes.
          </p>
        </section>
        <section id="google">
          <h2>3. Google sign-in</h2>
          <p>
            Google sign-in is optional. If you choose it, we request access to
            your basic profile and email information. Google provides
            information such as your name, email address and whether the address
            is verified. We use your name and verified email address to create
            or identify your PlayVerified account and sign you in. Your selected
            PlayVerified role is also used during registration.
          </p>
          <p>
            We store the account name and email needed to operate your account.
            Our sign-in implementation does not persist Google access or refresh
            tokens, and we do not receive your Google password. We do not
            request access to your Gmail messages, Google Drive files, contacts
            or calendars.
          </p>
          <p>
            Google-derived account information is used for account access and
            operation, not sold or used for targeted advertising. It is
            processed by our hosting and database providers as described below.
            You can review or revoke PlayVerified’s access in your{" "}
            <a href="https://myaccount.google.com/connections">
              Google Account connections
            </a>
            . Revoking access stops that connection; it does not by itself
            delete information already held in PlayVerified. Contact us to
            request deletion.
          </p>
          <p>
            Google’s own handling of information is described in its{" "}
            <a href="https://policies.google.com/privacy">privacy policy</a>.
            Google sign-in may pass through our existing playverified.vercel.app
            authentication address before returning you to playverified.app.
          </p>
        </section>
        <section>
          <h2>4. How and why we use information</h2>
          <p>
            We use information to create and maintain accounts, authenticate
            users, save profiles and coach workspaces, organise teams and
            sessions, respond to requests, investigate technical problems,
            prevent misuse and meet applicable legal obligations.
          </p>
          <p>
            Where permitted by applicable law, we process information as
            necessary to provide the service you request, comply with legal
            obligations, and pursue legitimate interests such as reliable
            operation and fraud prevention. Where consent is required, including
            for particular processing of children’s information, the required
            consent must be obtained. You may withdraw consent where processing
            relies on it; withdrawal does not retrospectively invalidate lawful
            processing.
          </p>
          <p>
            The platform is developing. The availability of future verification,
            guardian and discovery features is not a statement that those
            features already process your data. We will update this policy when
            material changes affect how information is handled.
          </p>
        </section>
        <section id="sharing">
          <h2>5. Sharing, service providers and international processing</h2>
          <p>
            We use <strong>Vercel</strong> to host the website and API,{" "}
            <strong>Supabase</strong> for our PostgreSQL database, and{" "}
            <strong>Google</strong> when you choose Google sign-in. These
            providers process information necessary for their services. Relevant
            policies are available from{" "}
            <a href="https://vercel.com/legal/privacy-policy">Vercel</a> and{" "}
            <a href="https://supabase.com/privacy">Supabase</a>.
          </p>
          <p>
            Authorised personnel and service providers may access information
            where needed for support, maintenance or security. We may disclose
            information when legally required, to respond to lawful requests, or
            to protect people’s rights and the service. We do not sell personal
            information.
          </p>
          <p>
            Coaches manage the roster records they submit in their team
            workspace. Some platform features involve presenting profile or
            sporting information to other users; the information you submit and
            the feature you use determine what is displayed. Do not submit
            information about another person without the necessary authority.
          </p>
          <p>
            Our providers may process information in countries outside South
            Africa. Where an international transfer is subject to legal
            safeguards, we must use an applicable lawful transfer mechanism,
            such as appropriate contractual protections or another basis
            permitted by law. Contact us for questions about the providers or
            safeguards relevant to your information.
          </p>
        </section>
        <section>
          <h2>6. Cookies and browser storage</h2>
          <p>
            We use browser storage to retain your PlayVerified sign-in token and
            account details so that the app can recognise your session. Google
            sign-in uses a short-lived, secure session cookie to help validate
            the sign-in request; its configured lifetime is approximately ten
            minutes. Signing out removes the app’s locally stored sign-in
            information.
          </p>
          <p>
            The current application does not include advertising trackers or
            optional product-analytics scripts. Hosting providers still process
            operational and security logs. Google may use its own cookies when
            you visit its sign-in pages. Blocking essential storage can prevent
            sign-in and account features from working.
          </p>
        </section>
        <section>
          <h2>7. Retention and deletion</h2>
          <p>
            We keep account and workspace information while it is needed to
            provide the service or for another lawful purpose. Retention depends
            on the type of record, your relationship with the service, support
            needs and applicable legal obligations; we do not currently apply
            one fixed retention period to all records.
          </p>
          <p>
            Coaches can remove individual roster entries and scheduled sessions
            through the app. Marking a player inactive retains their details and
            is not deletion. Account-wide deletion and access requests are
            handled by contacting us. We may need to verify your identity and
            clarify the scope before acting. Information that must be retained
            for legal, security or dispute-related reasons may be excluded from
            immediate deletion, and residual copies in backups may remain until
            the provider’s normal backup lifecycle expires.
          </p>
        </section>
        <section id="children">
          <h2>8. Children, guardians and team records</h2>
          <p>
            Sport often involves children. A coach, school or organisation
            entering a young player’s information must have the appropriate
            authority, explain the intended use to the player and their parent
            or guardian, and obtain consent from a competent person where
            required by law. Add only information needed for team
            administration.
          </p>
          <p>
            If you are under 18, involve a parent or guardian before creating an
            account or submitting personal information. Dedicated
            guardian-linking and approval tools are still being developed; a
            Guardian role selection does not itself provide parental
            verification or consent. Parents, guardians and players can contact
            us about a roster record, even if they do not have a PlayVerified
            account. We will investigate concerns about information submitted
            without appropriate authority.
          </p>
        </section>
        <section>
          <h2>9. Security</h2>
          <p>
            We use measures such as HTTPS, password hashing for account
            registration, authenticated access and access restrictions in coach
            workspaces to help protect information. No online service can
            guarantee absolute security. Keep your credentials private and sign
            out on shared devices. If you suspect unauthorised access or
            disclosure, contact us promptly. Where required, we will notify
            affected people and the relevant authority of a security compromise.
          </p>
        </section>
        <section id="rights">
          <h2>10. Your choices, rights and privacy requests</h2>
          <p>
            Subject to applicable law, including South Africa’s Protection of
            Personal Information Act (POPIA), you may request access to personal
            information we hold about you; request correction or deletion;
            object to certain processing; or withdraw consent where consent is
            the basis for processing.
          </p>
          <p>
            Email{" "}
            <a href="mailto:info@bulperd.com?subject=PlayVerified%20privacy%20request">
              info@bulperd.com
            </a>{" "}
            with “PlayVerified privacy request” in the subject, call{" "}
            <a href="tel:+27823150604">082 315 0604</a>, or write to the address
            above. Describe your request and provide enough detail to locate the
            relevant account or team record. Do not send passwords. We may
            request proportionate proof of identity or authority to protect the
            information concerned. If a request cannot be fulfilled, we will
            explain why, subject to legal restrictions.
          </p>
          <p>
            You can also complain to South Africa’s{" "}
            <a href="https://inforegulator.org.za/contact-us/">
              Information Regulator
            </a>
            :{" "}
            <a href="mailto:POPIAComplaints@inforegulator.org.za">
              POPIAComplaints@inforegulator.org.za
            </a>
            , or 010 023 5200. You do not have to contact us first to exercise a
            right to complain.
          </p>
        </section>
        <section>
          <h2>11. Changes to this policy</h2>
          <p>
            We will publish updates on this page and revise the “Last updated”
            date. Where a change materially affects your information, we will
            provide additional notice or seek consent when required. You can
            contact Bulperd (Pty) Ltd using the details above if anything in
            this policy is unclear.
          </p>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
