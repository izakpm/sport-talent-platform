'use client';

import { useEffect, useState } from 'react';

export default function VerificationPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);

  // ✅ Load activities automatically
  useEffect(() => {
    fetch('http://localhost:3000/activities')
      .then(res => res.json())
      .then(data => setActivities(data));
  }, []);

  const verify = async () => {
    const res = await fetch('http://localhost:3000/verification/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_id: selectedActivity,
        code,
      }),
    });

    const data = await res.json();
    setResult(data);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Verify Activity</h1>

      {/* ✅ Dropdown instead of typing */}
      <div>
        <label>Select Activity:</label>
        <select
          value={selectedActivity}
          onChange={(e) => setSelectedActivity(e.target.value)}
        >
          <option value="">-- choose activity --</option>
          {activities.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 10 }}>
        <input
          placeholder="Verification Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>

      <button style={{ marginTop: 10 }} onClick={verify}>
        Verify
      </button>

      {result && (
        <div style={{ marginTop: 20 }}>
          <h3>Result:</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}