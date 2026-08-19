import fs from 'node:fs'
import path from 'node:path'

type HistoricalRecord = {
    season: number
    player: string
    position?: string
    publicAdp?: number
}

type HistoricalFile = {
    records: HistoricalRecord[]
}

type FantasyProsRow = {
    player?: {
        name?: string
    }
    pos?: string
    avg?: number | string | null
}

type FantasyProsFile = {
    rows?: FantasyProsRow[]
}

const historicalPath =
    path.join(
        process.cwd(),
        'data',
        'historical-player-data',
        'historical-player-data.json',
    )

const historical =
    JSON.parse(
        fs.readFileSync(
            historicalPath,
            'utf8',
        ),
    ) as HistoricalFile

const missingDst =
    historical.records.filter(
        (record) =>
            record.position === 'DST' &&
            record.publicAdp == null,
    )

const seasons =
    [...new Set(
        missingDst.map(
            (record) => record.season,
        ),
    )].sort(
        (a, b) => a - b,
    )

console.log('')
console.log(
    `DST records without ADP: ${missingDst.length}`,
)

for (const season of seasons) {
    const sourcePath =
        path.join(
            process.cwd(),
            'data',
            'historical-adp',
            `fantasypros-adp-${season}.json`,
        )

    const source =
        JSON.parse(
            fs.readFileSync(
                sourcePath,
                'utf8',
            ),
        ) as FantasyProsFile

    const honda =
        missingDst
            .filter(
                (record) =>
                    record.season === season,
            )
            .map(
                (record) =>
                    record.player,
            )

    const fantasyPros =
        (source.rows ?? [])
            .filter(
                (row) =>
                    String(
                        row.pos ?? '',
                    )
                        .toUpperCase()
                        .startsWith('DST'),
            )
            .map(
                (row) => ({
                    player:
                        row.player?.name ??
                        '?',
                    adp:
                        row.avg ?? null,
                }),
            )

    console.log('')
    console.log(
        `===== ${season} =====`,
    )

    console.log('')
    console.log('HONDA DST:')
    for (const player of honda) {
        console.log(
            `  ${player}`,
        )
    }

    console.log('')
    console.log('FANTASYPROS DST:')
    for (const row of fantasyPros) {
        console.log(
            `  ${row.player} | ADP ${row.adp}`,
        )
    }
}

console.log('')
console.log(
    `TOTAL DST WITHOUT ADP: ${missingDst.length}`,
)
