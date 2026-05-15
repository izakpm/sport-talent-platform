'use client';

import { useEffect, useState } from 'react';

export default function TrustPage() {
  const [athletes, setAthletes] = useState<any[]>([]);
  const [selectedAthlete, setSelectedAthlete] = useState('');
  const [result, setResult] = useState<any>(null);

  // ✅ Load athletes (quick hack via activities for now)
  useEffect(() => {
    fetch('http://localhost:3000/activities')
      .then(res => res.json())
      .then(data => {
        const uniqueAthletes = [
          ...new Set(data.map((a: any) => a.athlete_id)),
        ];
        setAthletes(uniqueAthletes);
      });
  }, []);

  const fetchScore = async () => {
    const res = await fetch(
      `http://localhost:3000/trust/${selectedAthlete}`
    );
    const data = await res.json();
    setResult(data);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Trust Score</h1>

      <select
        value={selectedAthlete}
        onChange={(e) => setSelectedAthlete(e.target.value)}
      >
        <option value="">-- choose athlete --</option>
        {athletes.map((id) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>

      <button onClick={fetchScore}>Get Score</button>

      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>Score: {result.score}</h3>
          <pre>{JSON.stringify(result.breakdown, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}