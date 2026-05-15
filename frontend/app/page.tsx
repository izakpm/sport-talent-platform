import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Sport Talent Platform</h1>

      <ul>
        <li><Link href="/activities">Activities</Link></li>
        <li><Link href="/verification">Verification</Link></li>
        <li><Link href="/trust">Trust Score</Link></li>
      </ul>
    </div>
  );
}