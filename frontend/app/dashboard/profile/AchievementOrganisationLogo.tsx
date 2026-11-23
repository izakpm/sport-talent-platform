import Image from "next/image";

const logos: Record<string, { src: string; alt: string }> = {
  "blue bulls": {
    src: "/organisations/blue-bulls.png",
    alt: "Blue Bulls Rugby Union",
  },
  "blue bulls rugby union": {
    src: "/organisations/blue-bulls.png",
    alt: "Blue Bulls Rugby Union",
  },
};

export default function AchievementOrganisationLogo({
  organization,
}: {
  organization: string;
}) {
  const logo = logos[organization.trim().replace(/\s+/g, " ").toLowerCase()];
  return logo ? (
    <Image
      {...logo}
      width={48}
      height={68}
      style={{ objectFit: "contain", flexShrink: 0 }}
    />
  ) : null;
}
