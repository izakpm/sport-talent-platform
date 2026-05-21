'use client';

import { useEffect, useState } from 'react';
import { fetchWithAuth } from '../lib/api';

export default function VerificationPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);

  // ✅ Load activities automatically
  useEffect(() => {
    const loadActivities = async () => {
      const res = await fetchWithAuth('/activities');
      const data = res?.ok ? await res.json() : [];
      setActivities(data || []);
    };

    loadActivities();
  }, []);

  const verify = async () => {
    const res = await fetchWithAuth('/verification/scan', {
      method: 'POST',
      body: JSON.stringify({
        activity_id: selectedActivity,
        code,
      }),
    });

    const data = res ? await res.json() : null;
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