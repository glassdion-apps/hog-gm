export type PlayerPosition = 'QB' | 'RB' | 'WR' | 'TE'

export type Player = {
  rank: number
  name: string
  position: PlayerPosition
  team: string
  tier: string
  score: number
  action: string
  hondaAdp: string
  publicAdp: string
  floor: number
  ceiling: number
  risk: 'Low' | 'Medium' | 'High'
  xFactor: string
  greenFlags: string[]
  redFlags: string[]
}

export const players: Player[] = [
  {
    rank: 1,
    name: 'Jahmyr Gibbs',
    position: 'RB',
    team: 'DET',
    tier: 'Franchise',
    score: 100,
    action: 'HAMMER',
    hondaAdp: '1.01–1.03',
    publicAdp: '1.01–1.03',
    floor: 95,
    ceiling: 100,
    risk: 'Low',
    xFactor: 'Can finish as the highest-scoring player in fantasy.',
    greenFlags: [
      'Elite explosive-play ability',
      'High-value receiving usage',
      'Weekly RB1 overall ceiling',
    ],
    redFlags: [
      'Premium draft cost',
    ],
  },
  {
    rank: 2,
    name: 'Bijan Robinson',
    position: 'RB',
    team: 'ATL',
    tier: 'Franchise',
    score: 99.9,
    action: 'HAMMER',
    hondaAdp: '1.01–1.03',
    publicAdp: '1.01–1.03',
    floor: 96,
    ceiling: 99,
    risk: 'Low',
    xFactor: 'The safest elite running back foundation.',
    greenFlags: [
      'Three-down workload',
      'Goal-line role',
      'Strong receiving profile',
    ],
    redFlags: [
      'Premium opportunity cost',
    ],
  },
  {
    rank: 3,
    name: "Ja'Marr Chase",
    position: 'WR',
    team: 'CIN',
    tier: 'Franchise',
    score: 99.8,
    action: 'TARGET',
    hondaAdp: '1.02–1.05',
    publicAdp: '1.02–1.05',
    floor: 94,
    ceiling: 100,
    risk: 'Low',
    xFactor: 'The receiver most capable of outscoring entire positional tiers.',
    greenFlags: [
      'Elite target share',
      'Week-winning ceiling',
      'True WR1 overall upside',
    ],
    redFlags: [
      'RB opportunity cost',
    ],
  },
  {
    rank: 4,
    name: 'Josh Allen',
    position: 'QB',
    team: 'BUF',
    tier: 'Franchise',
    score: 99,
    action: 'HAMMER',
    hondaAdp: '1.09–2.02',
    publicAdp: 'Round 2',
    floor: 99,
    ceiling: 100,
    risk: 'Low',
    xFactor: 'Creates the largest weekly positional edge in Honda scoring.',
    greenFlags: [
      'Six-point passing touchdown boost',
      'Elite floor',
      'Elite rushing production',
    ],
    redFlags: [
      'Early quarterback opportunity cost',
    ],
  },
  {
    rank: 5,
    name: 'James Cook',
    position: 'RB',
    team: 'BUF',
    tier: 'Cornerstone',
    score: 95.9,
    action: 'TARGET',
    hondaAdp: '2.01–2.06',
    publicAdp: 'Round 2',
    floor: 88,
    ceiling: 95,
    risk: 'Medium',
    xFactor: 'Championship upside without paying a top-five overall price.',
    greenFlags: [
      'Three-down upside',
      'Strong scoring fit',
      'Favorable Honda value',
    ],
    redFlags: [
      'Touchdown volatility',
    ],
  },
]