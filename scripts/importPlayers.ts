import fs from 'node:fs'
import path from 'node:path'

import { calculateProjectedFantasyPoints } from '../src/utils/fantasyPoints.ts'

import { leagueDraftConfig } from '../src/data/draftConfig.ts'

const importsFolder = path.join(
  process.cwd(),
  'imports',
)
const rosterTargets = {
  QB: 2,
  RB: 5,
  WR: 6,
  TE: 2,
} as const

function parseCsvLine(line: string): string[] {
  const values: string[] = []

  let current = ''
  let insideQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      const nextChar = line[i + 1]

      // Escaped quote: ""
      if (insideQuotes && nextChar === '"') {
        current += '"'
        i++
        continue
      }

      insideQuotes = !insideQuotes
      continue
    }

    if (char === ',' && !insideQuotes) {
      values.push(current.trim())
      current = ''
      continue
    }

    current += char
  }

  values.push(current.trim())

  return values
}

function readLines(filePath: string) {
  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
}

function toNumber(
  value: string | undefined,
): number {
  if (!value) {
    return 0
  }

  const cleaned = value
    .replace(/,/g, '')
    .replace(/[^\d.-]/g, '')

  const number = Number(cleaned)

  return Number.isFinite(number)
    ? number
    : 0
}

function normalizePosition(
  position: string,
) {
  const match = position
    .toUpperCase()
    .match(/^(QB|RB|WR|TE|K|DST)/)

  return match?.[1] ?? position
}

function normalizePlayerName(
  name: string,
) {
  return name
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\b(jr|sr|ii|iii|iv)\b/g, '')
    .replace(/[^a-z0-9]/g, '')
}

function ratingOutOfFive(
  value: string | null | undefined,
) {
  if (!value) {
    return 0
  }

  const match =
    value.match(/\d+/)

  if (!match) {
    return 0
  }

  const rating =
    Number(match[0])

  return Number.isFinite(rating)
    ? rating
    : 0
}

type RatingPlayer = {
  rank: number
  tier: number
  name: string
  team: string
  position: string
  positionRank: string
  byeWeek: number | null
  upside: string
  bust: string
  strengthOfSchedule: string
  ecrVsAdp: number
}



function readRatings(
  filePath: string,
): RatingPlayer[] {
  const lines = readLines(filePath)

  // First row is the header.
  const dataLines = lines.slice(1)

  const players: RatingPlayer[] = []

  for (const line of dataLines) {
    const columns = parseCsvLine(line)

    /*
      Ratings columns:

      0 RK
      1 TIERS
      2 PLAYER NAME
      3 TEAM
      4 POS
      5 BYE WEEK
      6 UPSIDE
      7 BUST
      8 SOS SEASON
      9 ECR VS. ADP
    */

    const rank = toNumber(columns[0])
    const name = columns[2]?.trim() ?? ''

    // FantasyPros sometimes inserts blank tier rows.
    if (!rank || !name) {
      continue
    }

    const rawPosition =
      columns[4]?.trim() ?? ''

    players.push({
      rank,
      tier: toNumber(columns[1]),
      name,
      team:
        columns[3]?.trim().toUpperCase() ?? '',
      position:
        normalizePosition(rawPosition),
      positionRank: rawPosition,
      byeWeek:
        columns[5] &&
          columns[5] !== '-'
          ? toNumber(columns[5])
          : null,
      upside: columns[6]?.trim() ?? '',
      bust: columns[7]?.trim() ?? '',
      strengthOfSchedule:
        columns[8]?.trim() ?? '',
      ecrVsAdp:
        toNumber(columns[9]),
    })
  }

  return players
}

type QbProjection = {
  name: string
  team: string

  passingAttempts: number
  passingCompletions: number
  passingYards: number
  passingTouchdowns: number
  interceptions: number

  rushingAttempts: number
  rushingYards: number
  rushingTouchdowns: number

  fumblesLost: number

  fantasyProsPoints: number
}

function readQbProjections(
  filePath: string,
): QbProjection[] {
  const lines = readLines(filePath)

  const dataLines = lines.slice(1)

  const players: QbProjection[] = []

  for (const line of dataLines) {
    const columns = parseCsvLine(line)

    /*
      QB projection columns:

      0 Player
      1 Team

      PASSING
      2 ATT
      3 CMP
      4 YDS
      5 TDS
      6 INTS

      RUSHING
      7 ATT
      8 YDS
      9 TDS

      10 FL
      11 FPTS
    */

    const name =
      columns[0]?.trim() ?? ''

    if (!name) {
      continue
    }

    players.push({
      name,
      team:
        columns[1]?.trim().toUpperCase() ?? '',

      passingAttempts:
        toNumber(columns[2]),

      passingCompletions:
        toNumber(columns[3]),

      passingYards:
        toNumber(columns[4]),

      passingTouchdowns:
        toNumber(columns[5]),

      interceptions:
        toNumber(columns[6]),

      rushingAttempts:
        toNumber(columns[7]),

      rushingYards:
        toNumber(columns[8]),

      rushingTouchdowns:
        toNumber(columns[9]),

      fumblesLost:
        toNumber(columns[10]),

      fantasyProsPoints:
        toNumber(columns[11]),
    })
  }

  return players
}
type RbProjection = {
  name: string
  team: string

  rushingAttempts: number
  rushingYards: number
  rushingTouchdowns: number

  receptions: number
  receivingYards: number
  receivingTouchdowns: number

  fumblesLost: number

  fantasyProsPoints: number
}

function readRbProjections(
  filePath: string,
): RbProjection[] {
  const lines = readLines(filePath)
  const dataLines = lines.slice(1)

  const players: RbProjection[] = []

  for (const line of dataLines) {
    const columns = parseCsvLine(line)

    const name = columns[0]?.trim() ?? ''

    if (!name) {
      continue
    }

    players.push({
      name,
      team:
        columns[1]?.trim().toUpperCase() ?? '',

      rushingAttempts:
        toNumber(columns[2]),

      rushingYards:
        toNumber(columns[3]),

      rushingTouchdowns:
        toNumber(columns[4]),

      receptions:
        toNumber(columns[5]),

      receivingYards:
        toNumber(columns[6]),

      receivingTouchdowns:
        toNumber(columns[7]),

      fumblesLost:
        toNumber(columns[8]),

      fantasyProsPoints:
        toNumber(columns[9]),
    })
  }

  return players
}

type WrProjection = {
  name: string
  team: string

  receptions: number
  receivingYards: number
  receivingTouchdowns: number

  rushingAttempts: number
  rushingYards: number
  rushingTouchdowns: number

  fumblesLost: number

  fantasyProsPoints: number
}

function readWrProjections(
  filePath: string,
): WrProjection[] {
  const lines = readLines(filePath)
  const dataLines = lines.slice(1)

  const players: WrProjection[] = []

  for (const line of dataLines) {
    const columns = parseCsvLine(line)

    const name = columns[0]?.trim() ?? ''

    if (!name) {
      continue
    }

    players.push({
      name,
      team:
        columns[1]?.trim().toUpperCase() ?? '',

      receptions:
        toNumber(columns[2]),

      receivingYards:
        toNumber(columns[3]),

      receivingTouchdowns:
        toNumber(columns[4]),

      rushingAttempts:
        toNumber(columns[5]),

      rushingYards:
        toNumber(columns[6]),

      rushingTouchdowns:
        toNumber(columns[7]),

      fumblesLost:
        toNumber(columns[8]),

      fantasyProsPoints:
        toNumber(columns[9]),
    })
  }

  return players
}

type TeProjection = {
  name: string
  team: string

  receptions: number
  receivingYards: number
  receivingTouchdowns: number

  fumblesLost: number

  fantasyProsPoints: number
}

function readTeProjections(
  filePath: string,
): TeProjection[] {
  const lines = readLines(filePath)
  const dataLines = lines.slice(1)

  const players: TeProjection[] = []

  for (const line of dataLines) {
    const columns = parseCsvLine(line)

    const name = columns[0]?.trim() ?? ''

    if (!name) {
      continue
    }

    players.push({
      name,
      team:
        columns[1]?.trim().toUpperCase() ?? '',

      receptions:
        toNumber(columns[2]),

      receivingYards:
        toNumber(columns[3]),

      receivingTouchdowns:
        toNumber(columns[4]),

      fumblesLost:
        toNumber(columns[5]),

      fantasyProsPoints:
        toNumber(columns[6]),
    })
  }

  return players
}

function main() {
  const files = fs
    .readdirSync(importsFolder)
    .filter(
      (file) => !file.startsWith('.'),
    )

  const ratingsFile = files.find(
    (file) =>
      file
        .toLowerCase()
        .includes('ratings'),
  )

  const qbProjectionFile = files.find(
    (file) =>
      file
        .toLowerCase()
        .includes('projections-qb'),
  )
  const rbProjectionFile = files.find(
    (file) =>
      file
        .toLowerCase()
        .includes('projections-rb'),
  )

  const wrProjectionFile = files.find(
    (file) =>
      file
        .toLowerCase()
        .includes('projections-wr'),
  )


  const teProjectionFile = files.find(
    (file) =>
      file
        .toLowerCase()
        .includes('projections-te'),
  )

  if (!ratingsFile) {
    throw new Error(
      'Ratings file not found.',
    )
  }

  if (!qbProjectionFile) {
    throw new Error(
      'QB projections file not found.',
    )
  }

  if (!wrProjectionFile) {
    throw new Error(
      'WR projections file not found.',
    )
  }

  if (!rbProjectionFile) {
    throw new Error(
      'RB projections file not found.',
    )
  }

  if (!teProjectionFile) {
    throw new Error(
      'TE projections file not found.',
    )
  }

  const ratings = readRatings(
    path.join(
      importsFolder,
      ratingsFile,
    ),
  )

  const qbProjections =
    readQbProjections(
      path.join(
        importsFolder,
        qbProjectionFile,
      ),
    )
  const rbProjections =
    readRbProjections(
      path.join(
        importsFolder,
        rbProjectionFile,
      ),
    )

  const wrProjections =
    readWrProjections(
      path.join(
        importsFolder,
        wrProjectionFile,
      ),
    )

  const teProjections =
    readTeProjections(
      path.join(
        importsFolder,
        teProjectionFile,
      ),
    )

  console.log('')
  console.log(
    `RB projection file: ${rbProjectionFile}`,
  )

  console.log('')
  console.log('RB projection columns:')


  console.log('')
  console.log('🏎️ Honda Import Pipeline')
  console.log('')

  console.log(
    `Ratings players: ${ratings.length}`,
  )

  console.log(
    `QB projections: ${qbProjections.length}`,
  )

  console.log('')

  const mergedQbs = qbProjections
    .map((projection) => {
      const rating = ratings.find(
        (player) =>
          player.name === projection.name,
      )

      const hondaProjectedPoints =
        calculateProjectedFantasyPoints({
          passingYards:
            projection.passingYards,

          passingTouchdowns:
            projection.passingTouchdowns,

          interceptions:
            projection.interceptions,

          rushingYards:
            projection.rushingYards,

          rushingTouchdowns:
            projection.rushingTouchdowns,

          fumblesLost:
            projection.fumblesLost,
        })

      return {
        name: projection.name,
        team: projection.team,

        fantasyProsRank:
          rating?.rank ?? null,

        fantasyProsTier:
          rating?.tier ?? null,

        positionRank:
          rating?.positionRank ?? null,

        byeWeek:
          rating?.byeWeek ?? null,

        upside:
          rating?.upside ?? null,

        bust:
          rating?.bust ?? null,

        strengthOfSchedule:
          rating?.strengthOfSchedule ?? null,

        ecrVsAdp:
          rating?.ecrVsAdp ?? null,

        projectedStats: {
          passingAttempts:
            projection.passingAttempts,

          passingCompletions:
            projection.passingCompletions,

          passingYards:
            projection.passingYards,

          passingTouchdowns:
            projection.passingTouchdowns,

          interceptions:
            projection.interceptions,

          rushingAttempts:
            projection.rushingAttempts,

          rushingYards:
            projection.rushingYards,

          rushingTouchdowns:
            projection.rushingTouchdowns,

          fumblesLost:
            projection.fumblesLost,
        },

        fantasyProsPoints:
          projection.fantasyProsPoints,

        hondaProjectedPoints,
      }
    })
    .sort(
      (a, b) =>
        b.hondaProjectedPoints -
        a.hondaProjectedPoints,
    )

  console.log('')
  console.log('Top 15 Honda QBs:')
  console.log('')

  mergedQbs
    .slice(0, 15)
    .forEach((player, index) => {
      console.log(
        `${index + 1}. ${player.name} | Honda ${player.hondaProjectedPoints} | FP ${player.fantasyProsPoints}`,
      )
    })

  const outputFolder = path.join(
    importsFolder,
    'output',
  )

  fs.mkdirSync(
    outputFolder,
    {
      recursive: true,
    },
  )

  const outputPath = path.join(
    outputFolder,
    'qbs-merged.json',
  )

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      mergedQbs,
      null,
      2,
    ),
  )

  console.log('')
  console.log(
    `✅ QB merge written to: ${outputPath}`,
  )

  console.log('')

  const mergedRbs = rbProjections
    .map((projection) => {
      const rating = ratings.find(
        (player) =>
          player.name === projection.name,
      )

      const hondaProjectedPoints =
        calculateProjectedFantasyPoints({
          rushingYards:
            projection.rushingYards,

          rushingTouchdowns:
            projection.rushingTouchdowns,

          receptions:
            projection.receptions,

          receivingYards:
            projection.receivingYards,

          receivingTouchdowns:
            projection.receivingTouchdowns,

          fumblesLost:
            projection.fumblesLost,
        })

      return {
        name: projection.name,
        team: projection.team,

        fantasyProsRank:
          rating?.rank ?? null,

        fantasyProsTier:
          rating?.tier ?? null,

        positionRank:
          rating?.positionRank ?? null,

        byeWeek:
          rating?.byeWeek ?? null,

        upside:
          rating?.upside ?? null,

        bust:
          rating?.bust ?? null,

        strengthOfSchedule:
          rating?.strengthOfSchedule ?? null,

        ecrVsAdp:
          rating?.ecrVsAdp ?? null,

        projectedStats: {
          rushingAttempts:
            projection.rushingAttempts,

          rushingYards:
            projection.rushingYards,

          rushingTouchdowns:
            projection.rushingTouchdowns,

          receptions:
            projection.receptions,

          receivingYards:
            projection.receivingYards,

          receivingTouchdowns:
            projection.receivingTouchdowns,

          fumblesLost:
            projection.fumblesLost,
        },

        fantasyProsPoints:
          projection.fantasyProsPoints,

        hondaProjectedPoints,
      }
    })
    .sort(
      (a, b) =>
        b.hondaProjectedPoints -
        a.hondaProjectedPoints,
    )

  console.log('')
  console.log('Top 15 Honda RBs:')
  console.log('')

  mergedRbs
    .slice(0, 15)
    .forEach((player, index) => {
      console.log(
        `${index + 1}. ${player.name} | Honda ${player.hondaProjectedPoints} | FP ${player.fantasyProsPoints}`,
      )
    })

  const rbOutputPath = path.join(
    outputFolder,
    'rbs-merged.json',
  )

  fs.writeFileSync(
    rbOutputPath,
    JSON.stringify(
      mergedRbs,
      null,
      2,
    ),
  )

  console.log('')
  console.log(
    `✅ RB merge written to: ${rbOutputPath}`,
  )

  console.log('')

  console.log('')
  console.log(
    `WR projection file: ${wrProjectionFile}`,
  )
  const mergedWrs = wrProjections
    .map((projection) => {
      const rating = ratings.find(
        (player) =>
          player.name === projection.name,
      )

      const hondaProjectedPoints =
        calculateProjectedFantasyPoints({
          receptions:
            projection.receptions,

          receivingYards:
            projection.receivingYards,

          receivingTouchdowns:
            projection.receivingTouchdowns,

          rushingYards:
            projection.rushingYards,

          rushingTouchdowns:
            projection.rushingTouchdowns,

          fumblesLost:
            projection.fumblesLost,
        })

      return {
        name: projection.name,
        team: projection.team,

        fantasyProsRank:
          rating?.rank ?? null,

        fantasyProsTier:
          rating?.tier ?? null,

        positionRank:
          rating?.positionRank ?? null,

        byeWeek:
          rating?.byeWeek ?? null,

        upside:
          rating?.upside ?? null,

        bust:
          rating?.bust ?? null,

        strengthOfSchedule:
          rating?.strengthOfSchedule ?? null,

        ecrVsAdp:
          rating?.ecrVsAdp ?? null,

        projectedStats: {
          receptions:
            projection.receptions,

          receivingYards:
            projection.receivingYards,

          receivingTouchdowns:
            projection.receivingTouchdowns,

          rushingAttempts:
            projection.rushingAttempts,

          rushingYards:
            projection.rushingYards,

          rushingTouchdowns:
            projection.rushingTouchdowns,

          fumblesLost:
            projection.fumblesLost,
        },

        fantasyProsPoints:
          projection.fantasyProsPoints,

        hondaProjectedPoints,
      }
    })
    .sort(
      (a, b) =>
        b.hondaProjectedPoints -
        a.hondaProjectedPoints,
    )

  console.log('')
  console.log('Top 15 Honda WRs:')
  console.log('')

  mergedWrs
    .slice(0, 15)
    .forEach((player, index) => {
      console.log(
        `${index + 1}. ${player.name} | Honda ${player.hondaProjectedPoints} | FP ${player.fantasyProsPoints}`,
      )
    })

  const wrOutputPath = path.join(
    outputFolder,
    'wrs-merged.json',
  )

  fs.writeFileSync(
    wrOutputPath,
    JSON.stringify(
      mergedWrs,
      null,
      2,
    ),
  )

  console.log('')
  console.log(
    `✅ WR merge written to: ${wrOutputPath}`,
  )

  console.log('')

  console.log('')
  const mergedTes = teProjections
    .map((projection) => {
      const rating = ratings.find(
        (player) =>
          player.name === projection.name,
      )

      const hondaProjectedPoints =
        calculateProjectedFantasyPoints({
          receptions:
            projection.receptions,

          receivingYards:
            projection.receivingYards,

          receivingTouchdowns:
            projection.receivingTouchdowns,

          fumblesLost:
            projection.fumblesLost,
        })

      return {
        name: projection.name,
        team: projection.team,

        fantasyProsRank:
          rating?.rank ?? null,

        fantasyProsTier:
          rating?.tier ?? null,

        positionRank:
          rating?.positionRank ?? null,

        byeWeek:
          rating?.byeWeek ?? null,

        upside:
          rating?.upside ?? null,

        bust:
          rating?.bust ?? null,

        strengthOfSchedule:
          rating?.strengthOfSchedule ?? null,

        ecrVsAdp:
          rating?.ecrVsAdp ?? null,

        projectedStats: {
          receptions:
            projection.receptions,

          receivingYards:
            projection.receivingYards,

          receivingTouchdowns:
            projection.receivingTouchdowns,

          fumblesLost:
            projection.fumblesLost,
        },

        fantasyProsPoints:
          projection.fantasyProsPoints,

        hondaProjectedPoints,
      }
    })
    .sort(
      (a, b) =>
        b.hondaProjectedPoints -
        a.hondaProjectedPoints,
    )
  console.log('')
  console.log('Top 15 Honda TEs:')
  console.log('')

  mergedTes
    .slice(0, 15)
    .forEach((player, index) => {
      console.log(
        `${index + 1}. ${player.name} | Honda ${player.hondaProjectedPoints} | FP ${player.fantasyProsPoints}`,
      )
    })

  const teOutputPath = path.join(
    outputFolder,
    'tes-merged.json',
  )

  fs.writeFileSync(
    teOutputPath,
    JSON.stringify(
      mergedTes,
      null,
      2,
    ),
  )

  console.log('')
  console.log(
    `✅ TE merge written to: ${teOutputPath}`,
  )

  console.log('')
  const canonicalPlayers = [
    ...mergedQbs.map((player) => ({
      ...player,
      position: 'QB',
    })),

    ...mergedRbs.map((player) => ({
      ...player,
      position: 'RB',
    })),

    ...mergedWrs.map((player) => ({
      ...player,
      position: 'WR',
    })),

    ...mergedTes.map((player) => ({
      ...player,
      position: 'TE',
    })),
  ]

  const canonicalOutputPath = path.join(
    outputFolder,
    'players-canonical.json',
  )

  const replacementRanks = {
    QB: 13,
    RB: 31,
    WR: 37,
    TE: 13,
  } as const

  function getReplacementPoints(
    position: 'QB' | 'RB' | 'WR' | 'TE',
  ) {
    const positionPlayers = canonicalPlayers
      .filter(
        (player) =>
          player.position === position,
      )
      .sort(
        (a, b) =>
          b.hondaProjectedPoints -
          a.hondaProjectedPoints,
      )

    const replacementIndex =
      replacementRanks[position] - 1

    return (
      positionPlayers[replacementIndex]
        ?.hondaProjectedPoints ?? 0
    )
  }

  const replacementPoints = {
    QB: getReplacementPoints('QB'),
    RB: getReplacementPoints('RB'),
    WR: getReplacementPoints('WR'),
    TE: getReplacementPoints('TE'),
  }

  console.log('')
  console.log('Replacement Levels:')
  console.log('')

  console.log(
    `QB13: ${replacementPoints.QB}`,
  )

  console.log(
    `RB31: ${replacementPoints.RB}`,
  )

  console.log(
    `WR37: ${replacementPoints.WR}`,
  )

  console.log(
    `TE13: ${replacementPoints.TE}`,
  )

  const playersWithVor =
    canonicalPlayers.map((player) => {
      const position =
        player.position as
        | 'QB'
        | 'RB'
        | 'WR'
        | 'TE'

      const replacement =
        replacementPoints[position]

      const valueOverReplacement =
        Number(
          (
            player.hondaProjectedPoints -
            replacement
          ).toFixed(1),
        )

      return {
        ...player,
        replacementPoints:
          replacement,
        valueOverReplacement,
      }
    })

  const playersWithPositionRank =
    ['QB', 'RB', 'WR', 'TE'].flatMap(
      (position) => {
        const positionPlayers =
          playersWithVor
            .filter(
              (player) =>
                player.position === position,
            )
            .sort(
              (a, b) =>
                b.hondaProjectedPoints -
                a.hondaProjectedPoints,
            )

        return positionPlayers.map(
          (player, index) => ({
            ...player,
            hondaPositionRank:
              index + 1,
          }),
        )
      },
    )

  const playersWithVorRank =
    [...playersWithPositionRank]
      .sort(
        (a, b) =>
          b.valueOverReplacement -
          a.valueOverReplacement,
      )
      .map((player, index) => ({
        ...player,
        vorRank:
          index + 1,
      }))

  const playersWithDraftValue =
    playersWithVorRank.map((player) => ({
      ...player,

      estimatedMarketAdp: null,
      draftValueGap: null,
      marketLabel: 'Pending ADP',
    }))

  const hondaOverall =
    [...playersWithDraftValue]
      .sort(
        (a, b) =>
          b.valueOverReplacement -
          a.valueOverReplacement,
      )
      .map((player, index) => ({
        ...player,
        hondaOverallRank:
          index + 1,
      }))

  console.log('')
  console.log('Top 25 Honda Overall:')
  console.log('')

  hondaOverall
    .slice(0, 25)
    .forEach((player) => {
      console.log(
        `${player.hondaOverallRank}. ${player.name} | ${player.position} | VOR ${player.valueOverReplacement} | PTS ${player.hondaProjectedPoints}`,
      )
    })

  const hondaOverallPath = path.join(
    outputFolder,
    'honda-overall.json',
  )

  fs.writeFileSync(
    hondaOverallPath,
    JSON.stringify(
      hondaOverall,
      null,
      2,
    ),
  )

  console.log('')
  console.log(
    `✅ Honda overall ranking written to: ${hondaOverallPath}`,
  )

  const draftablePositionLimits = {
    QB: 32,
    RB: 80,
    WR: 110,
    TE: 38,
  } as const

  const draftablePlayers = (
    ['QB', 'RB', 'WR', 'TE'] as const
  ).flatMap((position) =>
    hondaOverall
      .filter(
        (player) =>
          player.position === position,
      )
      .sort(
        (a, b) =>
          a.hondaOverallRank -
          b.hondaOverallRank,
      )
      .slice(
        0,
        draftablePositionLimits[position],
      ),
  )

  draftablePlayers.sort(
    (a, b) =>
      a.hondaOverallRank -
      b.hondaOverallRank,
  )

  const hondaDraftBoard =
    draftablePlayers.map(
      (player, index) => ({
        ...player,

        hondaDraftRank:
          index + 1,
      }),
    )

  const leagueSize =
    leagueDraftConfig.teams

  const draftRounds =
    leagueDraftConfig.rounds

  const myDraftSlot =
    leagueDraftConfig.mySlot

  const mySnakeDraftPicks = Array.from(
    { length: draftRounds },
    (_, index) => {
      const round = index + 1

      const pickInRound =
        round % 2 === 1
          ? myDraftSlot
          : leagueSize - myDraftSlot + 1

      const overallPick =
        (round - 1) * leagueSize +
        pickInRound

      return {
        round,
        pickInRound,
        overallPick,

        draftSlot:
          `${round}.${String(
            pickInRound,
          ).padStart(2, '0')}`,
      }
    },
  )

  const keeperNames = new Set<string>(
    leagueDraftConfig.keepers.map(
      (keeper) =>
        normalizePlayerName(
          keeper.player,
        ),
    ),
  )

  const hondaDraftBoardWithRound =
    hondaDraftBoard.map((player) => {
      const round =
        Math.ceil(
          player.hondaDraftRank / 12,
        )

      const pickInRound =
        ((player.hondaDraftRank - 1) % 12) + 1

      return {
        ...player,

        projectedRound:
          round,

        projectedPickInRound:
          pickInRound,

        projectedDraftSlot:
          `${round}.${String(
            pickInRound,
          ).padStart(2, '0')}`,
      }
    })

  const availableHondaDraftBoard =
    hondaDraftBoardWithRound.filter(
      (player) =>
        !keeperNames.has(
          normalizePlayerName(
            player.name,
          ),
        ),
    )

  const keeperByOverallPick = new Map<
    number,
    (typeof leagueDraftConfig.keepers)[number]
  >(
    leagueDraftConfig.keepers.map(
      (keeper) => [
        keeper.overallPick,
        keeper,
      ],
    ),
  )

  const realDraftSlots = Array.from(
    {
      length:
        leagueDraftConfig.teams *
        leagueDraftConfig.rounds,
    },
    (_, index) => {
      const overallPick = index + 1

      const round =
        Math.ceil(
          overallPick /
          leagueDraftConfig.teams,
        )

      const pickInRound =
        overallPick -
        (round - 1) *
        leagueDraftConfig.teams

      const keeper =
        keeperByOverallPick.get(
          overallPick,
        )

      return {
        overallPick,
        round,
        pickInRound,

        draftSlot:
          `${round}.${String(
            pickInRound,
          ).padStart(2, '0')}`,

        keeper:
          keeper?.player ?? null,

        isKeeper:
          keeper !== undefined,
      }
    },
  )

  const myDraftPlan =
    mySnakeDraftPicks.map((pick) => {
      const keeper =
        keeperByOverallPick.get(
          pick.overallPick,
        )

      return {
        ...pick,

        isKeeper:
          keeper !== undefined,

        keeper:
          keeper?.player ?? null,

        isLivePick:
          keeper === undefined,
      }
    })

  console.log('')
  console.log('My Draft Plan:')
  console.log('')

  myDraftPlan.forEach((pick) => {
    const status =
      pick.isKeeper
        ? `KEEPER: ${pick.keeper}`
        : 'LIVE PICK'

    console.log(
      `Round ${pick.round} | ${pick.draftSlot} | Overall ${pick.overallPick} | ${status}`,
    )
  })

  const myDraftPlanWithNextPick =
    myDraftPlan.map((pick, index) => {
      const nextPick =
        myDraftPlan[index + 1]

      const picksUntilNext =
        nextPick
          ? nextPick.overallPick -
          pick.overallPick -
          1
          : null

      return {
        ...pick,

        nextOverallPick:
          nextPick?.overallPick ?? null,

        nextDraftSlot:
          nextPick?.draftSlot ?? null,

        picksUntilNext,
      }
    })

  const myDraftPlanWithLiveGaps =
    myDraftPlanWithNextPick.map((pick) => {
      if (pick.nextOverallPick === null) {
        return {
          ...pick,
          livePicksUntilNext: null,
        }
      }

      const livePicksUntilNext =
        realDraftSlots.filter((slot) => {
          return (
            slot.overallPick >
            pick.overallPick &&
            slot.overallPick <
            pick.nextOverallPick &&
            !slot.isKeeper
          )
        }).length

      return {
        ...pick,
        livePicksUntilNext,
      }
    })

  function evaluateTurnPair(
    firstPickIndex: number,
    availablePlayers: typeof availableHondaDraftBoard,
    currentRoster = {
      QB: 0,
      RB: 0,
      WR: 0,
      TE: 0,
    },
  ) {

    const firstPick =
      myDraftPlanWithLiveGaps[
      firstPickIndex
      ]

    const secondPick =
      myDraftPlanWithLiveGaps[
      firstPickIndex + 1
      ]

    const turnNumber =
      Math.floor(firstPickIndex / 2) + 1

    if (!firstPick || !secondPick) {
      return []
    }
    const isBenchPhase =
      turnNumber >= 5


    const liveGap =
      secondPick.livePicksUntilNext ?? 0

    const candidates =
      availablePlayers
        .filter((player) => {
          const position =
            player.position as
            | 'QB'
            | 'RB'
            | 'WR'
            | 'TE'

          return (
            currentRoster[position] <
            rosterTargets[position]
          )
        })
        .slice(0, 24)

    const pairOutcomes: {
      playerOne: typeof candidates[number]
      playerTwo: typeof candidates[number]
      projectedNextPlayer:
      | typeof candidates[number]
      | null
      combinedVor: number
      rosterBalanceBonus: number
      rosterNeedBonus: number
      score: number
      depthBonus: number
      benchValue: number
      benchPositionBonus: number
      upsideBonus: number
      bustPenalty: number
      qbUrgencyBonus: number
      rosterTargetBonus: number
    }[] = []

    for (
      let i = 0;
      i < candidates.length;
      i++
    ) {
      for (
        let j = i + 1;
        j < candidates.length;
        j++
      ) {
        const playerOne =
          candidates[i]

        const playerTwo =
          candidates[j]

        if (!playerOne || !playerTwo) {
          continue
        }

        const selectedNames =
          new Set<string>([
            playerOne.name,
            playerTwo.name,
          ])

        const remainingPlayers =
          availablePlayers.filter(
            (player) =>
              !selectedNames.has(
                player.name,
              ),
          )

        const simulatedTaken =
          remainingPlayers.slice(
            0,
            liveGap,
          )

        const simulatedTakenNames =
          new Set<string>(
            simulatedTaken.map(
              (player) =>
                player.name,
            ),
          )

        const projectedAvailable =
          remainingPlayers.filter(
            (player) =>
              !simulatedTakenNames.has(
                player.name,
              ),
          )

        const projectedNextPlayer =
          projectedAvailable[0] ?? null

        const combinedVor =
          Number(
            (
              playerOne.valueOverReplacement +
              playerTwo.valueOverReplacement
            ).toFixed(1),
          )
        const benchValue =
          isBenchPhase
            ? Number(
              (
                Math.max(
                  0,
                  180 - playerOne.hondaDraftRank,
                ) / 12 +
                Math.max(
                  0,
                  180 - playerTwo.hondaDraftRank,
                ) / 12
              ).toFixed(1),
            )
            : 0

        let benchPositionBonus = 0

        if (isBenchPhase) {
          if (
            playerOne.position === 'RB' ||
            playerOne.position === 'WR'
          ) {
            benchPositionBonus += 2
          }

          if (
            playerTwo.position === 'RB' ||
            playerTwo.position === 'WR'
          ) {
            benchPositionBonus += 2
          }

          if (
            playerOne.position === 'QB' &&
            currentRoster.QB >= 1
          ) {
            benchPositionBonus -= 4
          }

          if (
            playerTwo.position === 'QB' &&
            currentRoster.QB >= 1
          ) {
            benchPositionBonus -= 4
          }

          if (
            playerOne.position === 'TE' &&
            currentRoster.TE >= 1
          ) {
            benchPositionBonus -= 3
          }

          if (
            playerTwo.position === 'TE' &&
            currentRoster.TE >= 1
          ) {
            benchPositionBonus -= 3
          }
        }

        const playerOneUpside =
          ratingOutOfFive(
            playerOne.upside,
          )

        const playerTwoUpside =
          ratingOutOfFive(
            playerTwo.upside,
          )

        const playerOneBust =
          ratingOutOfFive(
            playerOne.bust,
          )

        const playerTwoBust =
          ratingOutOfFive(
            playerTwo.bust,
          )

        const upsideBonus =
          isBenchPhase
            ? Number(
              (
                (
                  playerOneUpside +
                  playerTwoUpside
                ) * 1.5
              ).toFixed(1),
            )
            : 0

        const bustPenalty =
          isBenchPhase
            ? Number(
              (
                (
                  playerOneBust +
                  playerTwoBust
                ) * 1.25
              ).toFixed(1),
            )
            : 0

        const positions = [
          playerOne.position,
          playerTwo.position,
        ]

        let rosterBalanceBonus = 0

        if (
          positions.includes('RB') &&
          positions.includes('WR')
        ) {
          rosterBalanceBonus = 4
        } else if (
          positions.includes('RB') &&
          positions.includes('TE')
        ) {
          rosterBalanceBonus = 2
        } else if (
          positions.includes('WR') &&
          positions.includes('TE')
        ) {
          rosterBalanceBonus = 2
        }
        let rosterNeedBonus = 0

        const projectedRoster = {
          ...currentRoster,
        }


        const rosterPositions = [
          'QB',
          'RB',
          'WR',
          'TE',
        ] as const
        const playerOnePosition =
          playerOne.position as
          | 'QB'
          | 'RB'
          | 'WR'
          | 'TE'

        const playerTwoPosition =
          playerTwo.position as
          | 'QB'
          | 'RB'
          | 'WR'
          | 'TE'

        projectedRoster[playerOnePosition] += 1
        projectedRoster[playerTwoPosition] += 1

        const exceedsRosterTarget =
          (
            [
              'QB',
              'RB',
              'WR',
              'TE',
            ] as const
          ).some(
            (position) =>
              projectedRoster[position] >
              rosterTargets[position],
          )

        if (exceedsRosterTarget) {
          continue
        }

        let rosterTargetBonus = 0


        for (const position of rosterPositions) {
          const target =
            rosterTargets[position]

          const before =
            currentRoster[position]

          const after =
            projectedRoster[position]

          if (
            before < target &&
            after > before
          ) {
            rosterTargetBonus += 3
          }


        }



        // Early draft: prioritize elite RB/WR value.
        // Do not force QB or TE yet.
        if (turnNumber <= 2) {
          if (projectedRoster.RB === 0) {
            rosterNeedBonus -= 4
          }

          if (projectedRoster.WR === 0) {
            rosterNeedBonus -= 4
          }
        }

        // Middle draft: starting lineup begins to matter.
        if (turnNumber >= 3) {
          if (projectedRoster.QB === 0) {
            rosterNeedBonus -= 4
          }

          if (projectedRoster.TE === 0) {
            rosterNeedBonus -= 3
          }

          if (projectedRoster.RB < 2) {
            rosterNeedBonus -= 4
          }

          if (projectedRoster.WR < 2) {
            rosterNeedBonus -= 4
          }

          if (
            currentRoster.QB === 0 &&
            projectedRoster.QB >= 1
          ) {
            rosterNeedBonus += 4
          }

          if (
            currentRoster.TE === 0 &&
            projectedRoster.TE >= 1
          ) {
            rosterNeedBonus += 3
          }
        }

        let qbUrgencyBonus = 0

        if (currentRoster.QB === 0) {
          if (turnNumber === 3) {
            qbUrgencyBonus = 4
          }

          if (turnNumber === 4) {
            qbUrgencyBonus = 8
          }

          if (turnNumber === 5) {
            qbUrgencyBonus = 14
          }

          if (turnNumber >= 6) {
            qbUrgencyBonus = 20
          }
        }

        const pairHasQuarterback =
          playerOne.position === 'QB' ||
          playerTwo.position === 'QB'

        if (!pairHasQuarterback) {
          qbUrgencyBonus = 0
        }

        let depthBonus = 0

        if (turnNumber >= 4) {
          if (projectedRoster.RB >= 3) {
            depthBonus += 2
          }

          if (projectedRoster.WR >= 3) {
            depthBonus += 2
          }
        }

        if (turnNumber >= 6) {
          if (projectedRoster.RB >= 4) {
            depthBonus += 1
          }

          if (projectedRoster.WR >= 4) {
            depthBonus += 1
          }
        }


        // Later draft: strongly discourage leaving
        // starting positions empty.
        if (turnNumber >= 5) {
          if (projectedRoster.QB === 0) {
            rosterNeedBonus -= 10
          }

          if (projectedRoster.TE === 0) {
            rosterNeedBonus -= 8
          }
        }

        // Avoid unnecessary second QB/TE too early.
        if (
          projectedRoster.QB > 1 &&
          turnNumber <= 6
        ) {
          rosterNeedBonus -= 6
        }

        if (
          projectedRoster.TE > 1 &&
          turnNumber <= 6
        ) {
          rosterNeedBonus -= 5
        }
        const score =
          Number(
            (
              combinedVor +
              (
                projectedNextPlayer
                  ?.valueOverReplacement ?? 0
              ) +
              rosterBalanceBonus +
              rosterNeedBonus +
              qbUrgencyBonus +
              rosterTargetBonus +
              depthBonus +
              benchValue +
              benchPositionBonus +
              upsideBonus -
              bustPenalty
            ).toFixed(1),
          )

        pairOutcomes.push({
          playerOne,
          playerTwo,
          projectedNextPlayer,
          combinedVor,
          rosterBalanceBonus,
          rosterNeedBonus,
          depthBonus,
          benchValue,
          benchPositionBonus,
          upsideBonus,
          bustPenalty,
          qbUrgencyBonus,
          score,
          rosterTargetBonus,
        })
      }
    }



    return pairOutcomes.sort(
      (a, b) =>
        b.score - a.score,
    )
  }

  function getOpponentDraftScore(
    player: typeof availableHondaDraftBoard[number],
  ) {
    const hondaRank =
      player.hondaDraftRank ?? 999

    const fantasyProsRank =
      player.fantasyProsRank ?? 999

    const tier =
      player.fantasyProsTier ?? 20

    const upside =
      ratingOutOfFive(
        player.upside,
      )

    const bust =
      ratingOutOfFive(
        player.bust,
      )

    // Lower rank is better, so convert ranks
    // into positive draft-pressure values.
    const hondaPressure =
      Math.max(
        0,
        300 - hondaRank,
      )

    const marketPressure =
      Math.max(
        0,
        300 - fantasyProsRank,
      )

    const tierPressure =
      Math.max(
        0,
        15 - tier,
      ) * 3

    const upsidePressure =
      upside * 2

    const bustPenalty =
      bust * 1.5

    return Number(
      (
        hondaPressure * 0.4 +
        marketPressure * 0.6 +
        tierPressure +
        upsidePressure -
        bustPenalty
      ).toFixed(2),
    )
  }

  function createSeededRandom(
    seed: number,
  ) {
    let state =
      seed >>> 0

    return () => {
      state =
        (
          state * 1664525 +
          1013904223
        ) >>> 0

      return state / 4294967296
    }
  }

  function simulateOpponentPicks(
    players: typeof availableHondaDraftBoard,
    numberOfPicks: number,
    seed: number,
  ) {
    if (numberOfPicks <= 0) {
      return {
        draftedPlayers: [],
        remainingPlayers: [
          ...players,
        ],
      }
    }

    let remainingPlayers =
      [...players]

    const draftedPlayers:
      typeof availableHondaDraftBoard =
      []

    const random =
      createSeededRandom(
        seed +
        players.length * 31 +
        numberOfPicks * 17,
      )

    for (
      let pickIndex = 0;
      pickIndex < numberOfPicks;
      pickIndex++
    ) {
      if (remainingPlayers.length === 0) {
        break
      }

      const marketBoard =
        [...remainingPlayers]
          .sort(
            (a, b) =>
              getOpponentDraftScore(b) -
              getOpponentDraftScore(a),
          )

      const draftWindow =
        marketBoard.slice(
          0,
          Math.min(
            6,
            marketBoard.length,
          ),
        )

      if (draftWindow.length === 0) {
        break
      }

      const roll =
        random()

      // Squaring the roll heavily favors
      // players near the top of the market
      // board while still allowing variance.
      const selectedIndex =
        Math.min(
          draftWindow.length - 1,
          Math.floor(
            roll *
            roll *
            draftWindow.length,
          ),
        )

      const selectedPlayer =
        draftWindow[selectedIndex]

      if (!selectedPlayer) {
        break
      }

      draftedPlayers.push(
        selectedPlayer,
      )

      remainingPlayers =
        remainingPlayers.filter(
          (player) =>
            player.name !==
            selectedPlayer.name,
        )
    }

    return {
      draftedPlayers,
      remainingPlayers,
    }
  }

  type AvailabilityTracker =
    Map<
      string,
      Map<string, number>
    >


function simulateHondaDraftPath(
  startingPlayers: typeof availableHondaDraftBoard,
  simulationSeed = 1,
  availabilityTracker?: AvailabilityTracker,
) {
  let availablePlayers =
    [...startingPlayers]

  const rosterCounts = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
  }

  const draftPath = []

  for (
    let firstPickIndex = 0;
    firstPickIndex < 14;
    firstPickIndex += 2
  ) {
    const firstPick =
      myDraftPlanWithLiveGaps[
        firstPickIndex
      ]

    const secondPick =
      myDraftPlanWithLiveGaps[
        firstPickIndex + 1
      ]

    if (!firstPick || !secondPick) {
      break
    }

    /*
     * Availability at the first pick
     * of this turn.
     */
    if (availabilityTracker) {
      if (
        !availabilityTracker.has(
          firstPick.draftSlot,
        )
      ) {
        availabilityTracker.set(
          firstPick.draftSlot,
          new Map<string, number>(),
        )
      }

      const firstSlotTracker =
        availabilityTracker.get(
          firstPick.draftSlot,
        )

      if (firstSlotTracker) {
        for (
          const player of
          availablePlayers
        ) {
          firstSlotTracker.set(
            player.name,
            (
              firstSlotTracker.get(
                player.name,
              ) ?? 0
            ) + 1,
          )
        }
      }
    }

    /*
     * Evaluate the turn.
     */
    const evaluation =
      evaluateTurnPair(
        firstPickIndex,
        availablePlayers,
        rosterCounts,
      )

    const bestOutcome =
      evaluation[0]

    if (!bestOutcome) {
      break
    }

    /*
     * Availability at the second pick.
     * Player one has already been taken
     * by us, so remove only player one.
     */
    if (availabilityTracker) {
      if (
        !availabilityTracker.has(
          secondPick.draftSlot,
        )
      ) {
        availabilityTracker.set(
          secondPick.draftSlot,
          new Map<string, number>(),
        )
      }

      const secondSlotTracker =
        availabilityTracker.get(
          secondPick.draftSlot,
        )

      if (secondSlotTracker) {
        for (
          const player of
          availablePlayers
        ) {
          if (
            player.name ===
            bestOutcome.playerOne.name
          ) {
            continue
          }

          secondSlotTracker.set(
            player.name,
            (
              secondSlotTracker.get(
                player.name,
              ) ?? 0
            ) + 1,
          )
        }
      }
    }

    const positionOne =
      bestOutcome.playerOne.position as
        | 'QB'
        | 'RB'
        | 'WR'
        | 'TE'

    const positionTwo =
      bestOutcome.playerTwo.position as
        | 'QB'
        | 'RB'
        | 'WR'
        | 'TE'

    rosterCounts[positionOne] += 1
    rosterCounts[positionTwo] += 1

    draftPath.push({
      firstDraftSlot:
        firstPick.draftSlot,

      secondDraftSlot:
        secondPick.draftSlot,

      playerOne:
        bestOutcome.playerOne,

      playerTwo:
        bestOutcome.playerTwo,

      projectedNextPlayer:
        bestOutcome.projectedNextPlayer,

      score:
        bestOutcome.score,

      rosterAfterTurn: {
        ...rosterCounts,
      },
    })

    /*
     * Remove both Honda picks.
     */
    const selectedNames =
      new Set<string>([
        bestOutcome.playerOne.name,
        bestOutcome.playerTwo.name,
      ])

    availablePlayers =
      availablePlayers.filter(
        (player) =>
          !selectedNames.has(
            player.name,
          ),
      )

    /*
     * Simulate opponents until
     * our next turn.
     */
    const liveGap =
      secondPick.livePicksUntilNext

    if (
      liveGap !== null &&
      liveGap > 0
    ) {
      const opponentSimulation =
        simulateOpponentPicks(
          availablePlayers,
          liveGap,
          simulationSeed +
            firstPickIndex * 1000,
        )

      availablePlayers =
        opponentSimulation
          .remainingPlayers
    }
  }

  /*
   * Final standalone pick: 15.12
   */
  const finalPick =
    myDraftPlanWithLiveGaps[14]

  if (
    finalPick &&
    availablePlayers.length > 0
  ) {
    /*
     * Record availability at 15.12.
     */
    if (availabilityTracker) {
      if (
        !availabilityTracker.has(
          finalPick.draftSlot,
        )
      ) {
        availabilityTracker.set(
          finalPick.draftSlot,
          new Map<string, number>(),
        )
      }

      const finalSlotTracker =
        availabilityTracker.get(
          finalPick.draftSlot,
        )

      if (finalSlotTracker) {
        for (
          const player of
          availablePlayers
        ) {
          finalSlotTracker.set(
            player.name,
            (
              finalSlotTracker.get(
                player.name,
              ) ?? 0
            ) + 1,
          )
        }
      }
    }

    /*
     * Only positions still below
     * their roster target.
     */
    const finalCandidates =
      availablePlayers
        .filter((player) => {
          const position =
            player.position as
              | 'QB'
              | 'RB'
              | 'WR'
              | 'TE'

          return (
            rosterCounts[position] <
            rosterTargets[position]
          )
        })
        .slice(0, 12)

    const bestFinalPlayer =
      [...finalCandidates]
        .sort((a, b) => {
          const aUpside =
            ratingOutOfFive(
              a.upside,
            )

          const bUpside =
            ratingOutOfFive(
              b.upside,
            )

          const aBust =
            ratingOutOfFive(
              a.bust,
            )

          const bBust =
            ratingOutOfFive(
              b.bust,
            )

          const aScore =
            a.valueOverReplacement +
            aUpside * 2 -
            aBust

          const bScore =
            b.valueOverReplacement +
            bUpside * 2 -
            bBust

          return bScore - aScore
        })[0]

    if (bestFinalPlayer) {
      const finalPosition =
        bestFinalPlayer.position as
          | 'QB'
          | 'RB'
          | 'WR'
          | 'TE'

      rosterCounts[finalPosition] += 1

      draftPath.push({
        firstDraftSlot:
          finalPick.draftSlot,

        secondDraftSlot:
          null,

        playerOne:
          bestFinalPlayer,

        playerTwo:
          null,

        projectedNextPlayer:
          null,

        score:
          Number(
            (
              bestFinalPlayer
                .valueOverReplacement +
              ratingOutOfFive(
                bestFinalPlayer.upside,
              ) * 2 -
              ratingOutOfFive(
                bestFinalPlayer.bust,
              )
            ).toFixed(1),
          ),

        rosterAfterTurn: {
          ...rosterCounts,
        },
      })
    }
  }

  return draftPath
}




console.log('')
console.log('My Live Pick Gaps:')
console.log('')

myDraftPlanWithLiveGaps.forEach(
  (pick) => {
    const liveGapText =
      pick.livePicksUntilNext === null
        ? 'FINAL PICK'
        : `${pick.livePicksUntilNext} live picks`

    console.log(
      `${pick.draftSlot} | ${liveGapText}`,
    )
  },
)

console.log('')

console.log('')
console.log('My Pick Gaps:')
console.log('')

myDraftPlanWithNextPick.forEach(
  (pick) => {
    const nextText =
      pick.nextDraftSlot
        ? `${pick.nextDraftSlot} in ${pick.picksUntilNext} picks`
        : 'No next pick'

    console.log(
      `${pick.draftSlot} | Overall ${pick.overallPick} | Next: ${nextText}`,
    )
  },
)

const myDraftPlanWithTurnType =
  myDraftPlanWithNextPick.map((pick) => {
    let turnType:
      | 'TURN PICK'
      | 'LONG WAIT PICK'
      | 'FINAL PICK'

    if (pick.picksUntilNext === null) {
      turnType = 'FINAL PICK'
    } else if (pick.picksUntilNext <= 1) {
      turnType = 'TURN PICK'
    } else {
      turnType = 'LONG WAIT PICK'
    }

    return {
      ...pick,
      turnType,
    }
  })

const myDraftPlanWithRiskWindow =
  myDraftPlanWithTurnType.map((pick) => {
    const survivalWindow =
      pick.picksUntilNext === null
        ? null
        : pick.picksUntilNext

    return {
      ...pick,
      survivalWindow,
    }
  })

console.log('')
console.log('My Draft Turn Types:')
console.log('')

myDraftPlanWithTurnType.forEach(
  (pick) => {
    console.log(
      `${pick.draftSlot} | ${pick.turnType}`,
    )
  },
)

console.log('My Draft Risk Windows:')
console.log('')

myDraftPlanWithRiskWindow.forEach(
  (pick) => {
    const windowText =
      pick.survivalWindow === null
        ? 'FINAL PICK'
        : `${pick.survivalWindow} picks`

    console.log(
      `${pick.draftSlot} | Risk Window: ${windowText}`,
    )
  },
)

const getPlayerDecision = (
  player: {
    hondaDraftRank: number
  },
  currentOverallPick: number,
  nextOverallPick: number | null,
) => {
  if (nextOverallPick === null) {
    return 'TAKE NOW'
  }

  const picksUntilPlayer =
    player.hondaDraftRank -
    currentOverallPick

  const picksUntilNextTurn =
    nextOverallPick -
    currentOverallPick

  if (picksUntilPlayer <= 0) {
    return 'TAKE NOW'
  }

  if (
    picksUntilPlayer <
    picksUntilNextTurn - 4
  ) {
    return 'TAKE NOW'
  }

  if (
    picksUntilPlayer <=
    picksUntilNextTurn + 4
  ) {
    return 'BORDERLINE'
  }

  return 'LIKELY SAFE TO WAIT'
}

const openingPick =
  myDraftPlanWithRiskWindow[0]


const picksBeforeOpeningPick =
  openingPick
    ? openingPick.overallPick - 1
    : 0

const simulatedDraftedBeforeOpening =
  availableHondaDraftBoard
    .slice(0, picksBeforeOpeningPick)

const simulatedDraftedNames =
  new Set<string>(
    simulatedDraftedBeforeOpening.map(
      (player) => player.name,
    ),
  )

const openingAvailablePlayers =
  availableHondaDraftBoard.filter(
    (player) =>
      !simulatedDraftedNames.has(
        player.name,
      ),
  )

const openingTurnEvaluation =
  evaluateTurnPair(
    0,
    openingAvailablePlayers,
  )
console.log('')
console.log(
  'Reusable Opening Turn Evaluation:',
)
console.log('')

openingTurnEvaluation
  .slice(0, 10)
  .forEach((outcome, index) => {
    const nextPlayer =
      outcome.projectedNextPlayer

    const nextText =
      nextPlayer
        ? `${nextPlayer.name} (${nextPlayer.position})`
        : 'None'

    console.log(
      `${index + 1}. ${outcome.playerOne.name} + ${outcome.playerTwo.name} | Next Turn: ${nextText} | Balance +${outcome.rosterBalanceBonus} | Score ${outcome.score}`,
    )
  })

console.log('')

const projectedHondaDraftPath =
  simulateHondaDraftPath(
    openingAvailablePlayers,
  )

console.log('')
console.log(
  'Projected Honda Draft Path:',
)
console.log('')

projectedHondaDraftPath.forEach(
  (turn, index) => {
    const secondPlayerText =
      turn.playerTwo
        ? ` + ${turn.playerTwo.name} (${turn.playerTwo.position})`
        : ''

    const slotText =
      turn.secondDraftSlot
        ? `${turn.firstDraftSlot}/${turn.secondDraftSlot}`
        : turn.firstDraftSlot

    console.log(
      `Turn ${index + 1} | ${slotText} | ${turn.playerOne.name} (${turn.playerOne.position})${secondPlayerText} | Roster QB ${turn.rosterAfterTurn.QB} RB ${turn.rosterAfterTurn.RB} WR ${turn.rosterAfterTurn.WR} TE ${turn.rosterAfterTurn.TE} | Score ${turn.score}`,
    )
  },
)

const simulationCount = 100

const availabilityFrequencyBySlot:
  AvailabilityTracker =
  new Map()



const playerFrequencyBySlot =
  new Map<
    string,
    Map<string, number>
  >()

for (
  let simulationIndex = 0;
  simulationIndex < simulationCount;
  simulationIndex++
) {

  const simulatedPath =
    simulateHondaDraftPath(
      openingAvailablePlayers,
      simulationIndex + 1,
      availabilityFrequencyBySlot,
    )

  for (const turn of simulatedPath) {
    const picks = [
      {
        slot: turn.firstDraftSlot,
        player: turn.playerOne,
      },
      {
        slot: turn.secondDraftSlot,
        player: turn.playerTwo,
      },
    ]

    for (const pick of picks) {
      if (
        !pick.slot ||
        !pick.player
      ) {
        continue
      }

      if (
        !playerFrequencyBySlot.has(
          pick.slot,
        )
      ) {
        playerFrequencyBySlot.set(
          pick.slot,
          new Map<string, number>(),
        )
      }

      const slotFrequency =
        playerFrequencyBySlot.get(
          pick.slot,
        )

      if (!slotFrequency) {
        continue
      }

      slotFrequency.set(
        pick.player.name,
        (
          slotFrequency.get(
            pick.player.name,
          ) ?? 0
        ) + 1,
      )
    }
  }
}
console.log('')
console.log(
  `Honda ${simulationCount}-Simulation Availability:`,
)
console.log('')

for (const pick of mySnakeDraftPicks) {
  const slotAvailability =
    availabilityFrequencyBySlot.get(
      pick.draftSlot,
    )

  if (!slotAvailability) {
    continue
  }

  const leaders =
    [...slotAvailability.entries()]
      .sort((a, b) => {
        const playerA =
          availableHondaDraftBoard.find(
            (player) =>
              player.name === a[0],
          )

        const playerB =
          availableHondaDraftBoard.find(
            (player) =>
              player.name === b[0],
          )

        return (
          (playerA?.hondaDraftRank ?? 999) -
          (playerB?.hondaDraftRank ?? 999)
        )
      })
      .slice(0, 10)

  console.log(
    `${pick.draftSlot}:`,
  )

  leaders.forEach(
    ([playerName, count], index) => {
      const percentage =
        Number(
          (
            count /
            simulationCount *
            100
          ).toFixed(1),
        )

      console.log(
        `  ${index + 1}. ${playerName} | Available ${count}/${simulationCount} | ${percentage}%`,
      )
    },
  )

  console.log('')
}
console.log('')
console.log(
  `Honda ${simulationCount}-Simulation Draft Frequencies:`,
)
console.log('')

for (const pick of mySnakeDraftPicks) {
  const slotFrequency =
    playerFrequencyBySlot.get(
      pick.draftSlot,
    )

  if (!slotFrequency) {
    continue
  }

  const leaders =
    [...slotFrequency.entries()]
      .sort(
        (a, b) =>
          b[1] - a[1],
      )
      .slice(0, 5)

  console.log(
    `${pick.draftSlot}:`,
  )

  leaders.forEach(
    ([playerName, count], index) => {
      const percentage =
        Number(
          (
            count /
            simulationCount *
            100
          ).toFixed(1),
        )

      console.log(
        `  ${index + 1}. ${playerName} | ${count}/${simulationCount} | ${percentage}%`,
      )
    },
  )

  console.log('')
}

console.log('')



const projectedFirstTurnPicks =
  openingTurnEvaluation[0]

if (projectedFirstTurnPicks) {
  const selectedNames =
    new Set<string>([
      projectedFirstTurnPicks.playerOne.name,
      projectedFirstTurnPicks.playerTwo.name,
    ])

  const playersAfterOpeningTurn =
    openingAvailablePlayers.filter(
      (player) =>
        !selectedNames.has(
          player.name,
        ),
    )

  const liveGapTo312 =
    myDraftPlanWithLiveGaps[1]
      ?.livePicksUntilNext ?? 0

  const simulatedTakenBefore312 =
    playersAfterOpeningTurn.slice(
      0,
      liveGapTo312,
    )

  const simulatedTakenNames =
    new Set<string>(
      simulatedTakenBefore312.map(
        (player) => player.name,
      ),
    )

  const availableAt312 =
    playersAfterOpeningTurn.filter(
      (player) =>
        !simulatedTakenNames.has(
          player.name,
        ),
    )

  const secondTurnEvaluation =
    evaluateTurnPair(
      2,
      availableAt312,
    )

  console.log('')
  console.log(
    'Reusable 3.12 / 4.01 Turn Evaluation:',
  )
  console.log('')

  secondTurnEvaluation
    .slice(0, 10)
    .forEach((outcome, index) => {
      const nextPlayer =
        outcome.projectedNextPlayer

      const nextText =
        nextPlayer
          ? `${nextPlayer.name} (${nextPlayer.position})`
          : 'None'

      console.log(
        `${index + 1}. ${outcome.playerOne.name} + ${outcome.playerTwo.name} | Next Turn: ${nextText} | Balance +${outcome.rosterBalanceBonus} | Score ${outcome.score}`,
      )
    })

  console.log('')
}

const openingTurnCandidates =
  openingAvailablePlayers
    .slice(0, 12)

const openingTurnPairs: {
  playerOne: typeof openingTurnCandidates[number]
  playerTwo: typeof openingTurnCandidates[number]
  combinedVor: number
}[] = []

for (
  let i = 0;
  i < openingTurnCandidates.length;
  i++
) {
  for (
    let j = i + 1;
    j < openingTurnCandidates.length;
    j++
  ) {
    const playerOne =
      openingTurnCandidates[i]

    const playerTwo =
      openingTurnCandidates[j]

    if (!playerOne || !playerTwo) {
      continue
    }

    openingTurnPairs.push({
      playerOne,
      playerTwo,

      combinedVor:
        Number(
          (
            playerOne.valueOverReplacement +
            playerTwo.valueOverReplacement
          ).toFixed(1),
        ),
    })
  }
}

openingTurnPairs.sort(
  (a, b) =>
    b.combinedVor -
    a.combinedVor,
)

const secondPick =
  myDraftPlanWithLiveGaps[1]

const picksBeforeThirdRoundTurn =
  secondPick?.livePicksUntilNext ?? 0

console.log('')
console.log(
  `Live picks between 2.01 and 3.12: ${picksBeforeThirdRoundTurn}`,
)
console.log('')

const openingTurnPairOutcomes =
  openingTurnPairs.map((pair) => {
    const selectedNames =
      new Set<string>([
        pair.playerOne.name,
        pair.playerTwo.name,
      ])

    const remainingPlayers =
      openingAvailablePlayers.filter(
        (player) =>
          !selectedNames.has(
            player.name,
          ),
      )

    const simulatedTakenBefore312 =
      remainingPlayers.slice(
        0,
        picksBeforeThirdRoundTurn,
      )

    const simulatedTakenNames =
      new Set<string>(
        simulatedTakenBefore312.map(
          (player) => player.name,
        ),
      )

    const availableAt312 =
      remainingPlayers.filter(
        (player) =>
          !simulatedTakenNames.has(
            player.name,
          ),
      )

    const bestPlayerAt312 =
      availableAt312[0] ?? null

    const positions = [
      pair.playerOne.position,
      pair.playerTwo.position,
    ]

    let rosterBalanceBonus = 0

    if (
      positions.includes('RB') &&
      positions.includes('WR')
    ) {
      rosterBalanceBonus = 4
    } else if (
      positions.includes('RB') &&
      positions.includes('TE')
    ) {
      rosterBalanceBonus = 2
    } else if (
      positions.includes('WR') &&
      positions.includes('TE')
    ) {
      rosterBalanceBonus = 2
    }

    const threePickVor =
      Number(
        (
          pair.combinedVor +
          (
            bestPlayerAt312
              ?.valueOverReplacement ?? 0
          ) +
          rosterBalanceBonus
        ).toFixed(1),
      )

    return {
      ...pair,
      bestPlayerAt312,
      rosterBalanceBonus,
      threePickVor,
    }
  })

openingTurnPairOutcomes.sort(
  (a, b) =>
    b.threePickVor -
    a.threePickVor,
)

console.log('')
console.log(
  'Opening Pair + Projected 3.12:',
)
console.log('')

openingTurnPairOutcomes
  .slice(0, 10)
  .forEach((outcome, index) => {
    const thirdPlayer =
      outcome.bestPlayerAt312

    const thirdText =
      thirdPlayer
        ? `${thirdPlayer.name} (${thirdPlayer.position})`
        : 'None'

    console.log(
      `${index + 1}. ${outcome.playerOne.name} + ${outcome.playerTwo.name} | 3.12: ${thirdText} | Balance +${outcome.rosterBalanceBonus} | Score ${outcome.threePickVor}`,
    )
  })

console.log('')



console.log('')
console.log('Top Opening Turn Pairs:')
console.log('')

openingTurnPairs
  .slice(0, 10)
  .forEach((pair, index) => {
    console.log(
      `${index + 1}. ${pair.playerOne.name} (${pair.playerOne.position}) + ${pair.playerTwo.name} (${pair.playerTwo.position}) | Combined VOR ${pair.combinedVor}`,
    )
  })

console.log('')

console.log('')
console.log(
  'Simulated Picks Before 1.12:',
)
console.log('')

simulatedDraftedBeforeOpening
  .forEach((player, index) => {
    console.log(
      `${index + 1}. ${player.name} | ${player.position}`,
    )
  })

console.log('')



if (openingPick) {
  console.log('')
  console.log(
    'Opening Pick Decision Board:',
  )
  console.log('')

  openingAvailablePlayers
    .slice(0, 15)
    .forEach((player) => {
      const decision =
        getPlayerDecision(
          player,
          openingPick.overallPick,
          openingPick.nextOverallPick,
        )

      console.log(
        `${player.name} | Rank ${player.hondaDraftRank} | ${decision}`,
      )
    })

  console.log('')
}



console.log('')

console.log('')


console.log('')

console.log('')



console.log('')
console.log('Keeper Draft Slots:')
console.log('')

realDraftSlots
  .filter(
    (slot) =>
      slot.isKeeper,
  )
  .forEach((slot) => {
    console.log(
      `${slot.draftSlot} | Overall ${slot.overallPick} | ${slot.keeper}`,
    )
  })

console.log('')

console.log('')
console.log('Keepers Removed From Availability:')
console.log('')

leagueDraftConfig.keepers.forEach(
  (keeper) => {
    console.log(
      `${keeper.player} | ${keeper.round}.${String(
        keeper.pickInRound,
      ).padStart(2, '0')} | Overall ${keeper.overallPick}`,
    )
  },
)

console.log('')
console.log(
  `Available Honda players after keepers: ${availableHondaDraftBoard.length}`,
)
console.log('')

console.log('')
console.log('My Actual Draft Picks:')
console.log('')

mySnakeDraftPicks.forEach((pick) => {
  console.log(
    `Round ${pick.round} | ${pick.draftSlot} | Overall ${pick.overallPick}`,
  )
})


const draftableOutputPath = path.join(
  outputFolder,
  'honda-draftable.json',
)

fs.writeFileSync(
  draftableOutputPath,
  JSON.stringify(
    hondaDraftBoardWithRound,
    null,
    2,
  )
)

console.log('')
console.log(
  `✅ Draftable player pool written to: ${draftableOutputPath}`,
)

console.log(
  `Draftable players: ${hondaDraftBoard.length}`,
)

const draftablePositionCounts = {
  QB: hondaDraftBoard.filter(
    (player) => player.position === 'QB',
  ).length,

  RB: hondaDraftBoard.filter(
    (player) => player.position === 'RB',
  ).length,

  WR: hondaDraftBoard.filter(
    (player) => player.position === 'WR',
  ).length,

  TE: hondaDraftBoard.filter(
    (player) => player.position === 'TE',
  ).length,
}

console.log('')
console.log('Draftable Position Counts:')
console.log(draftablePositionCounts)
console.log('')

console.log('')
console.log('Top 20 Honda Draft Board:')
console.log('')

hondaDraftBoardWithRound
  .slice(0, 20)
  .forEach((player) => {
    console.log(
      `${player.hondaDraftRank}. ${player.name} | ${player.position} | Slot ${player.projectedDraftSlot} | VOR ${player.valueOverReplacement}`,
    )
  })

console.log('')



fs.writeFileSync(
  canonicalOutputPath,
  JSON.stringify(
    playersWithDraftValue,
    null,
    2,
  ),
)

console.log('')
console.log(
  `✅ Canonical player pool written to: ${canonicalOutputPath}`,
)

console.log(
  `Total canonical players: ${canonicalPlayers.length}`,
)

console.log('')
console.log('Honda Position Leaders:')
console.log('')

for (const position of [
  'QB',
  'RB',
  'WR',
  'TE',
]) {
  const leaders =
    playersWithVorRank
      .filter(
        (player) =>
          player.position === position,
      )
      .sort(
        (a, b) =>
          a.hondaPositionRank -
          b.hondaPositionRank,
      )
      .slice(0, 5)

  console.log(`${position}:`)

  leaders.forEach((player) => {
    console.log(
      `${player.hondaPositionRank}. ${player.name} | VOR Rank ${player.vorRank} | PTS ${player.hondaProjectedPoints}`,
    )
  })

  console.log('')
}

}

main()