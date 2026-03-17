window.CBCL_CONFIG = {
  appName: 'Break Wali League',
  dailyFreePlays: 5,
  billPattern: /^\d{4}\/\d{4}\/\d{4}$/,
  matchBoost: {
    startHour: 19,
    startMinute: 0,
    endHour: 23,
    endMinute: 30,
    multiplier: 2
  },
  scoring: {
    bowlingDisplay: {
      Bowled: 12,
      Catch: 8,
      LBW: 4,
      '-1': -1,
      '-4': -4,
      '-6': -6
    }
  },
  outcomes: {
    bat: [
      { label: '6', points: 6, weight: 10, type: 'positive', runs: 6, sixes: 1 },
      { label: '4', points: 4, weight: 20, type: 'positive', runs: 4 },
      { label: '3', points: 3, weight: 10, type: 'positive', runs: 3 },
      { label: '2', points: 2, weight: 20, type: 'positive', runs: 2 },
      { label: '1', points: 1, weight: 25, type: 'positive', runs: 1 },
      { label: 'Dot', points: 0, weight: 15, type: 'gold', dots: 1 }
    ],
    bowl: [
      { label: 'Bowled', points: 12, weight: 12, type: 'positive', wickets: 1 },
      { label: 'Catch', points: 8, weight: 16, type: 'positive', wickets: 1 },
      { label: 'LBW', points: 4, weight: 18, type: 'positive', wickets: 1 },
      { label: '-1', points: -1, weight: 20, type: 'negative' },
      { label: '-4', points: -4, weight: 20, type: 'negative' },
      { label: '-6', points: -6, weight: 14, type: 'negative' }
    ]
  },
  demoUsers: [
    {
      id: 'u1',
      name: 'Riya Sen',
      nickname: 'SkySix',
      phone: '9999999991',
      profilePhoto: '',
      totalPoints: 86,
      matchesPlayed: 17,
      runs: 58,
      wickets: 3,
      sixes: 7,
      dots: 4,
      streak: 4,
      playsToday: 2,
      lastPlayDate: '',
      history: []
    },
    {
      id: 'u2',
      name: 'Aman Das',
      nickname: 'YorkerYoddha',
      phone: '9999999992',
      profilePhoto: '',
      totalPoints: 74,
      matchesPlayed: 15,
      runs: 35,
      wickets: 5,
      sixes: 3,
      dots: 8,
      streak: 2,
      playsToday: 3,
      lastPlayDate: '',
      history: []
    },
    {
      id: 'u3',
      name: 'Sneha Roy',
      nickname: 'PowerPlay',
      phone: '9999999993',
      profilePhoto: '',
      totalPoints: 63,
      matchesPlayed: 14,
      runs: 44,
      wickets: 2,
      sixes: 5,
      dots: 5,
      streak: 5,
      playsToday: 1,
      lastPlayDate: '',
      history: []
    }
  ]
};