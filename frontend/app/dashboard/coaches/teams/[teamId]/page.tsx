import TeamRoster from '../../TeamRoster';
export default async function TeamRosterPage({ params }: { params: Promise<{ teamId: string }> }) {
  const { teamId } = await params;
  return <TeamRoster teamId={teamId} />;
}
