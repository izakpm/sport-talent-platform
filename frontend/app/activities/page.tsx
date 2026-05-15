'use client';

import { useEffect, useState } from 'react';

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/activities')
      .then(res => res.json())
      .then(data => setActivities(data));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Activities</h1>

    {activities.map((activity: any) => (
      <div key={activity.id} style={{ marginBottom: 10 }}>
        <p><b>{activity.title}</b></p>
        <p>ID: {activity.id}</p>
      </div>
    ))}
    </div>
  );
}