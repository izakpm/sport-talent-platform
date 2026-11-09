export type SchoolCoach = {
  id: string;
  name: string;
  role: 'Head Coach' | 'Assistant Coach' | 'Specialist Coach';
  sport: string;
  status: 'Active' | 'On Leave';
  assignedTeams: number;
};

export type SchoolTeam = {
  id: string;
  name: string;
  division: string;
  sport: string;
  athleteCount: number;
  coach: string;
  status: 'In Season' | 'Preseason' | 'Offseason';
};

export type SchoolFixture = {
  id: string;
  team: string;
  opponent: string;
  date: string;
  venue: string;
  status: 'Scheduled' | 'Confirmed' | 'Completed';
  result?: 'Win' | 'Loss' | 'Draw';
};

export type SchoolLog = {
  id: string;
  timestamp: string;
  actor: string;
  category: 'Operations' | 'Verification' | 'Fixture' | 'Roster';
  message: string;
  severity: 'Info' | 'Warning' | 'Critical';
};

export type SchoolAchievement = {
  id: string;
  title: string;
  team: string;
  date: string;
  category: 'Performance' | 'Academic' | 'Sportsmanship';
  featured: boolean;
};

export type TournamentStanding = {
  position: number;
  schoolName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  points: number;
};

export type Tournament = {
  id: string;
  name: string;
  sport: string;
  divisions: {
    name: string;
    standings: TournamentStanding[];
  }[];
};

export const SCHOOL_COACHES: SchoolCoach[] = [
  {
    id: 'school-coach-1',
    name: 'John Smith',
    role: 'Head Coach',
    sport: 'Rugby',
    status: 'Active',
    assignedTeams: 2,
  },
  {
    id: 'school-coach-2',
    name: 'Jane Doe',
    role: 'Assistant Coach',
    sport: 'Soccer',
    status: 'Active',
    assignedTeams: 1,
  },
  {
    id: 'school-coach-3',
    name: 'Lebo Nkosi',
    role: 'Specialist Coach',
    sport: 'Hockey',
    status: 'On Leave',
    assignedTeams: 1,
  },
];

export const SCHOOL_TEAMS: SchoolTeam[] = [
  {
    id: 'school-team-1',
    name: '1st XV',
    division: 'Senior',
    sport: 'Rugby',
    athleteCount: 26,
    coach: 'John Smith',
    status: 'In Season',
  },
  {
    id: 'school-team-2',
    name: 'U16 Boys',
    division: 'U16',
    sport: 'Soccer',
    athleteCount: 20,
    coach: 'Jane Doe',
    status: 'In Season',
  },
  {
    id: 'school-team-3',
    name: 'U15 Girls',
    division: 'U15',
    sport: 'Hockey',
    athleteCount: 18,
    coach: 'Lebo Nkosi',
    status: 'Preseason',
  },
];

export const SCHOOL_FIXTURES: SchoolFixture[] = [
  {
    id: 'fixture-1',
    team: '1st XV',
    opponent: 'North Academy',
    date: '2026-07-20T10:00:00Z',
    venue: 'Home Stadium',
    status: 'Scheduled',
  },
  {
    id: 'fixture-2',
    team: 'U16 Boys',
    opponent: 'Lakeside College',
    date: '2026-07-18T08:30:00Z',
    venue: 'Lakeside Grounds',
    status: 'Confirmed',
  },
  {
    id: 'fixture-3',
    team: 'U15 Girls',
    opponent: 'South High',
    date: '2026-07-11T12:00:00Z',
    venue: 'South High Turf',
    status: 'Completed',
    result: 'Win',
  },
];

export const SCHOOL_LOGS: SchoolLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-07-12T08:45:00Z',
    actor: 'System',
    category: 'Operations',
    message: 'Daily roster sync completed successfully.',
    severity: 'Info',
  },
  {
    id: 'log-2',
    timestamp: '2026-07-12T10:15:00Z',
    actor: 'Jane Doe',
    category: 'Fixture',
    message: 'Fixture confirmation submitted for U16 Boys.',
    severity: 'Info',
  },
  {
    id: 'log-3',
    timestamp: '2026-07-12T11:55:00Z',
    actor: 'Verifier',
    category: 'Verification',
    message: 'Guardian approval missing for 2 athlete profiles.',
    severity: 'Warning',
  },
  {
    id: 'log-4',
    timestamp: '2026-07-12T13:20:00Z',
    actor: 'System',
    category: 'Roster',
    message: 'Roster publish failed due to incomplete team assignments.',
    severity: 'Critical',
  },
];

export const SCHOOL_ACHIEVEMENTS: SchoolAchievement[] = [
  {
    id: 'achievement-1',
    title: 'Regional Champions',
    team: '1st XV',
    date: '2026-07-02',
    category: 'Performance',
    featured: true,
  },
  {
    id: 'achievement-2',
    title: 'Top Academic Athlete Group',
    team: 'U16 Boys',
    date: '2026-06-28',
    category: 'Academic',
    featured: false,
  },
  {
    id: 'achievement-3',
    title: 'Fair Play Recognition',
    team: 'U15 Girls',
    date: '2026-06-25',
    category: 'Sportsmanship',
    featured: false,
  },
];

export const SCHOOL_TOURNAMENTS: Tournament[] = [
  {
    id: 'tournament-1',
    name: 'Noordvaal Cup',
    sport: 'Rugby',
    divisions: [
      {
        name: '1st Team',
        standings: [
          { position: 1, schoolName: 'Garsfontein', gamesPlayed: 6, wins: 6, losses: 0, draws: 0, points: 29 },
          { position: 2, schoolName: 'Monument', gamesPlayed: 5, wins: 4, losses: 1, draws: 0, points: 21 },
          { position: 3, schoolName: 'Waterkloof', gamesPlayed: 4, wins: 3, losses: 1, draws: 0, points: 16 },
          { position: 4, schoolName: 'Noordheuwel', gamesPlayed: 5, wins: 3, losses: 2, draws: 0, points: 15 },
          { position: 5, schoolName: 'Middelburg', gamesPlayed: 4, wins: 2, losses: 2, draws: 0, points: 12 },
          { position: 6, schoolName: 'Helpmekaar', gamesPlayed: 5, wins: 1, losses: 4, draws: 0, points: 9 },
          { position: 7, schoolName: 'Dr. EG Jansen', gamesPlayed: 5, wins: 2, losses: 3, draws: 0, points: 9 },
          { position: 8, schoolName: 'Menlopark', gamesPlayed: 5, wins: 1, losses: 4, draws: 0, points: 8 },
          { position: 9, schoolName: 'Rustenburg', gamesPlayed: 5, wins: 0, losses: 5, draws: 0, points: 5 },
        ],
      },
      {
        name: 'U16A',
        standings: [
          { position: 1, schoolName: 'Garsfontein', gamesPlayed: 5, wins: 5, losses: 0, draws: 0, points: 25 },
          { position: 2, schoolName: 'Waterkloof', gamesPlayed: 5, wins: 4, losses: 1, draws: 0, points: 20 },
          { position: 3, schoolName: 'Monument', gamesPlayed: 5, wins: 3, losses: 2, draws: 0, points: 15 },
          { position: 4, schoolName: 'Noordheuwel', gamesPlayed: 4, wins: 2, losses: 2, draws: 0, points: 12 },
          { position: 5, schoolName: 'Helpmekaar', gamesPlayed: 5, wins: 1, losses: 4, draws: 0, points: 8 },
          { position: 6, schoolName: 'Middelburg', gamesPlayed: 5, wins: 0, losses: 5, draws: 0, points: 5 },
        ],
      },
      {
        name: 'U15A',
        standings: [
          { position: 1, schoolName: 'Monument', gamesPlayed: 6, wins: 5, losses: 1, draws: 0, points: 24 },
          { position: 2, schoolName: 'Garsfontein', gamesPlayed: 5, wins: 4, losses: 1, draws: 0, points: 19 },
          { position: 3, schoolName: 'Waterkloof', gamesPlayed: 5, wins: 3, losses: 2, draws: 0, points: 14 },
          { position: 4, schoolName: 'Menlopark', gamesPlayed: 5, wins: 2, losses: 3, draws: 0, points: 11 },
          { position: 5, schoolName: 'Noordheuwel', gamesPlayed: 5, wins: 1, losses: 4, draws: 0, points: 8 },
          { position: 6, schoolName: 'Dr. EG Jansen', gamesPlayed: 5, wins: 0, losses: 5, draws: 0, points: 4 },
        ],
      },
      {
        name: 'U14A',
        standings: [
          { position: 1, schoolName: 'Waterkloof', gamesPlayed: 4, wins: 4, losses: 0, draws: 0, points: 20 },
          { position: 2, schoolName: 'Garsfontein', gamesPlayed: 4, wins: 3, losses: 1, draws: 0, points: 15 },
          { position: 3, schoolName: 'Monument', gamesPlayed: 4, wins: 2, losses: 2, draws: 0, points: 10 },
          { position: 4, schoolName: 'Helpmekaar', gamesPlayed: 4, wins: 1, losses: 3, draws: 0, points: 7 },
          { position: 5, schoolName: 'Middelburg', gamesPlayed: 4, wins: 0, losses: 4, draws: 0, points: 3 },
        ],
      },
    ],
  },
  {
    id: 'tournament-2',
    name: 'Regional Championship',
    sport: 'Rugby',
    divisions: [
      {
        name: '1st Team',
        standings: [
          { position: 1, schoolName: 'Northridge', gamesPlayed: 6, wins: 6, losses: 0, draws: 0, points: 28 },
          { position: 2, schoolName: 'Eastside', gamesPlayed: 6, wins: 4, losses: 2, draws: 0, points: 20 },
          { position: 3, schoolName: 'Westfield', gamesPlayed: 6, wins: 3, losses: 3, draws: 0, points: 15 },
          { position: 4, schoolName: 'Southpark', gamesPlayed: 6, wins: 1, losses: 5, draws: 0, points: 7 },
        ],
      },
      {
        name: 'U16A',
        standings: [
          { position: 1, schoolName: 'Eastside', gamesPlayed: 5, wins: 5, losses: 0, draws: 0, points: 25 },
          { position: 2, schoolName: 'Northridge', gamesPlayed: 5, wins: 3, losses: 2, draws: 0, points: 15 },
          { position: 3, schoolName: 'Westfield', gamesPlayed: 5, wins: 2, losses: 3, draws: 0, points: 10 },
          { position: 4, schoolName: 'Southpark', gamesPlayed: 5, wins: 0, losses: 5, draws: 0, points: 2 },
        ],
      },
      {
        name: 'U15A',
        standings: [
          { position: 1, schoolName: 'Westfield', gamesPlayed: 5, wins: 4, losses: 1, draws: 0, points: 19 },
          { position: 2, schoolName: 'Northridge', gamesPlayed: 5, wins: 3, losses: 2, draws: 0, points: 14 },
          { position: 3, schoolName: 'Eastside', gamesPlayed: 5, wins: 2, losses: 3, draws: 0, points: 9 },
          { position: 4, schoolName: 'Southpark', gamesPlayed: 5, wins: 1, losses: 4, draws: 0, points: 6 },
        ],
      },
      {
        name: 'U14A',
        standings: [
          { position: 1, schoolName: 'Southpark', gamesPlayed: 4, wins: 3, losses: 1, draws: 0, points: 14 },
          { position: 2, schoolName: 'Northridge', gamesPlayed: 4, wins: 2, losses: 2, draws: 0, points: 10 },
          { position: 3, schoolName: 'Westfield', gamesPlayed: 4, wins: 1, losses: 3, draws: 0, points: 6 },
          { position: 4, schoolName: 'Eastside', gamesPlayed: 4, wins: 0, losses: 4, draws: 0, points: 2 },
        ],
      },
    ],
  },
];
