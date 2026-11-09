export type CoachTeam = {
  id: string;
  name: string;
  sport: string;
  ageGroup: string;
  athleteCount: number;
  assistantCoaches: number;
  status: 'Active' | 'Preseason' | 'Offseason';
  nextSession: string;
};

export type CoachEvent = {
  id: string;
  title: string;
  kind: 'Session' | 'Match' | 'Review';
  date: string;
  team: string;
  location: string;
};

export type CoachActivity = {
  id: string;
  athlete: string;
  sport: string;
  activity: string;
  date: string;
  intensity: 'Low' | 'Moderate' | 'High';
  reviewed: boolean;
};

export type CoachMatch = {
  id: string;
  team: string;
  opponent: string;
  date: string;
  location: string;
  status: 'Scheduled' | 'Completed';
  result?: 'Win' | 'Loss' | 'Draw';
};

export type CoachApproval = {
  id: string;
  subject: string;
  type: 'Athlete Verification' | 'Match Report' | 'Team Update';
  submittedBy: string;
  submittedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
};

export type CoachAchievement = {
  id: string;
  title: string;
  team: string;
  athlete: string;
  date: string;
  category: 'Performance' | 'Leadership' | 'Attendance';
  highlighted: boolean;
};

export const COACH_TEAMS: CoachTeam[] = [
  {
    id: 'team-1',
    name: 'U17 Falcons',
    sport: 'Soccer',
    ageGroup: 'U17',
    athleteCount: 22,
    assistantCoaches: 2,
    status: 'Active',
    nextSession: '2026-07-15T16:00:00Z',
  },
  {
    id: 'team-2',
    name: 'Senior Sharks',
    sport: 'Rugby',
    ageGroup: 'Senior',
    athleteCount: 18,
    assistantCoaches: 1,
    status: 'Active',
    nextSession: '2026-07-16T14:30:00Z',
  },
  {
    id: 'team-3',
    name: 'U15 Meteors',
    sport: 'Hockey',
    ageGroup: 'U15',
    athleteCount: 16,
    assistantCoaches: 1,
    status: 'Preseason',
    nextSession: '2026-07-18T12:00:00Z',
  },
];

export const COACH_EVENTS: CoachEvent[] = [
  {
    id: 'event-1',
    title: 'Tactical Session',
    kind: 'Session',
    date: '2026-07-15T16:00:00Z',
    team: 'U17 Falcons',
    location: 'Main Field',
  },
  {
    id: 'event-2',
    title: 'League Fixture vs Lions',
    kind: 'Match',
    date: '2026-07-17T11:00:00Z',
    team: 'Senior Sharks',
    location: 'Riverside Stadium',
  },
  {
    id: 'event-3',
    title: 'Performance Review Block',
    kind: 'Review',
    date: '2026-07-19T09:00:00Z',
    team: 'U15 Meteors',
    location: 'Video Room',
  },
  {
    id: 'event-4',
    title: 'Conditioning Session',
    kind: 'Session',
    date: '2026-07-22T13:30:00Z',
    team: 'Senior Sharks',
    location: 'Gym Complex',
  },
];

export const COACH_ACTIVITIES: CoachActivity[] = [
  {
    id: 'activity-1',
    athlete: 'Liam Ndlovu',
    sport: 'Soccer',
    activity: 'Sprint Intervals',
    date: '2026-07-12',
    intensity: 'High',
    reviewed: false,
  },
  {
    id: 'activity-2',
    athlete: 'Aiden Meyer',
    sport: 'Rugby',
    activity: 'Strength Circuit',
    date: '2026-07-11',
    intensity: 'Moderate',
    reviewed: true,
  },
  {
    id: 'activity-3',
    athlete: 'Noah Khumalo',
    sport: 'Hockey',
    activity: 'Stick Handling',
    date: '2026-07-10',
    intensity: 'Low',
    reviewed: false,
  },
];

export const COACH_MATCHES: CoachMatch[] = [
  {
    id: 'match-1',
    team: 'U17 Falcons',
    opponent: 'North Academy',
    date: '2026-07-20T10:00:00Z',
    location: 'Falcon Arena',
    status: 'Scheduled',
  },
  {
    id: 'match-2',
    team: 'Senior Sharks',
    opponent: 'Central College',
    date: '2026-07-13T14:00:00Z',
    location: 'College Grounds',
    status: 'Completed',
    result: 'Win',
  },
  {
    id: 'match-3',
    team: 'U15 Meteors',
    opponent: 'Westside School',
    date: '2026-07-09T09:30:00Z',
    location: 'Westside Turf',
    status: 'Completed',
    result: 'Draw',
  },
];

export const COACH_APPROVALS: CoachApproval[] = [
  {
    id: 'approval-1',
    subject: 'Athlete guardian consent',
    type: 'Athlete Verification',
    submittedBy: 'Liam Ndlovu',
    submittedAt: '2026-07-12T08:00:00Z',
    status: 'Pending',
  },
  {
    id: 'approval-2',
    subject: 'Match report upload',
    type: 'Match Report',
    submittedBy: 'Senior Sharks',
    submittedAt: '2026-07-11T17:15:00Z',
    status: 'Pending',
  },
  {
    id: 'approval-3',
    subject: 'Roster amendment',
    type: 'Team Update',
    submittedBy: 'U15 Meteors',
    submittedAt: '2026-07-10T14:45:00Z',
    status: 'Approved',
  },
];

export const COACH_ACHIEVEMENTS: CoachAchievement[] = [
  {
    id: 'achievement-1',
    title: 'Top Defensive Unit',
    team: 'Senior Sharks',
    athlete: 'Team Award',
    date: '2026-07-06',
    category: 'Performance',
    highlighted: true,
  },
  {
    id: 'achievement-2',
    title: 'Leadership Captaincy',
    team: 'U17 Falcons',
    athlete: 'Liam Ndlovu',
    date: '2026-07-05',
    category: 'Leadership',
    highlighted: false,
  },
  {
    id: 'achievement-3',
    title: 'Perfect Attendance',
    team: 'U15 Meteors',
    athlete: 'Noah Khumalo',
    date: '2026-07-03',
    category: 'Attendance',
    highlighted: false,
  },
];
