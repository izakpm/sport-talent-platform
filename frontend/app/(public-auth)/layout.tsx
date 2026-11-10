import HomeLanding from "../HomeLanding";
export default function PublicAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <HomeLanding />
      {children}
    </>
  );
}
