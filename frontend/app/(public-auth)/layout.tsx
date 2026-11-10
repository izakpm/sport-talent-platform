import HomeLanding from "../HomeLanding";
import AudioPlayer from "../AudioPlayer";
export default function PublicAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HomeLanding />
      <AudioPlayer />
      {children}
    </>
  );
}
