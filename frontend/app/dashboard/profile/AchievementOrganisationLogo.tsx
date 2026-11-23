import { organisationLogoStyle } from "../../lib/organisation-logos";

export default function AchievementOrganisationLogo({
  organization,
  logoUrl,
}: {
  organization: string;
  logoUrl?: string | null;
}) {
  const logo = logoUrl ? { src: logoUrl, alt: organization } : null;
  return logo ? (
    <img
      {...logo}
      width={48}
      height={68}
      style={{
        objectFit: "contain",
        flexShrink: 0,
        ...organisationLogoStyle(logo.src),
      }}
    />
  ) : null;
}
