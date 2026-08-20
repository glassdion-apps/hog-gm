export const leagueDraftConfig = {
  teams: 12,
  rounds: 15,
  mySlot: 12,
  
  myManager: 'GiveMeYourMoneyNow',

  currentDraftOrder: [
    'Schmontz Nation',
    'Constipated Commandos',
    'Balls Deep',
    "Jimmy's Johnson",
    'Yeah Daaavvveee!!!',
    'Rice-A-Ronnie72',
    'EL JEFE',
    'ROTY',
    'Papi',
    'Siurek',
    'Potpaska187',
    'GiveMeYourMoneyNow',
  ],


  keepers: [
    {
      player: 'Jalen Hurts',
      round: 4,
      pickInRound: 8,
      overallPick: 44,
    },
    {
      player: 'Jaxon Smith-Njigba',
      round: 4,
      pickInRound: 4,
      overallPick: 40,
    },
    {
      player: 'D.J. Moore',
      round: 5,
      pickInRound: 11,
      overallPick: 59,
    },
    {
      player: 'Tyler Warren',
      round: 6,
      pickInRound: 10,
      overallPick: 70,
    },
    {
      player: 'Rashee Rice',
      round: 6,
      pickInRound: 7,
      overallPick: 67,
    },
    {
      player: 'Deebo Samuel',
      round: 7,
      pickInRound: 1,
      overallPick: 73,
    },
    {
      player: 'Emeka Egbuka',
      round: 7,
      pickInRound: 4,
      overallPick: 76,
    },
    {
      player: 'Travis Etienne',
      round: 8,
      pickInRound: 3,
      overallPick: 87,
    },
    {
      player: 'Drake Maye',
      round: 12,
      pickInRound: 6,
      overallPick: 138,
    },
    {
      player: 'Justin Herbert',
      round: 12,
      pickInRound: 5,
      overallPick: 137,
    },
  ],
} as const