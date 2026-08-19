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
    season?: number
    rows?: FantasyProsRow[]
}

function normalize(
    value: string,
) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[’']/g, '')
        .replace(/\./g, '')
        .replace(/-/g, ' ')
        .replace(/\b(jr|sr|ii|iii|iv|v)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}

function basePosition(
    value?: string,
) {
    if (!value) {
        return undefined
    }

    return value
        .trim()
        .toUpperCase()
        .match(/^(QB|RB|WR|TE|K|DST)/)?.[1]
}

function distance(
    a: string,
    b: string,
) {
    const dp =
        Array.from(
            { length: a.length + 1 },
            () =>
                Array<number>(
                    b.length + 1,
                ).fill(0),
        )

    for (
        let i = 0;
        i <= a.length;
        i += 1
    ) {
        dp[i][0] = i
    }

    for (
        let j = 0;
        j <= b.length;
        j += 1
    ) {
        dp[0][j] = j
    }

    for (
        let i = 1;
        i <= a.length;
        i += 1
    ) {
        for (
            let j = 1;
            j <= b.length;
            j += 1
        ) {
            dp[i][j] =
                Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] +
                        (
                            a[i - 1] ===
                            b[j - 1]
                                ? 0
                                : 1
                        ),
                )
        }
    }

    return dp[a.length][b.length]
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

const missing =
    historical.records.filter(
        (record) =>
            record.publicAdp == null &&
            record.position !== 'DST',
    )

console.log('')
console.log(
    `Non-DST records without ADP: ${missing.length}`,
)

for (const record of missing) {
    const sourcePath =
        path.join(
            process.cwd(),
            'data',
            'historical-adp',
            `fantasypros-adp-${record.season}.json`,
        )

    const source =
        JSON.parse(
            fs.readFileSync(
                sourcePath,
                'utf8',
            ),
        ) as FantasyProsFile

    const target =
        normalize(
            record.player,
        )

    const targetPosition =
        basePosition(
            record.position,
        )

    const candidates =
        (source.rows ?? [])
            .map((row) => {
                const player =
                    row.player?.name?.trim() ??
                    ''

                const position =
                    basePosition(
                        row.pos,
                    )

                const adp =
                    typeof row.avg === 'number'
                        ? row.avg
                        : Number.parseFloat(
                            String(
                                row.avg ?? '',
                            ),
                        )

                return {
                    player,
                    position,
                    adp,
                    normalized:
                        normalize(
                            player,
                        ),
                }
            })
            .filter(
                (candidate) =>
                    candidate.player &&
                    Number.isFinite(
                        candidate.adp,
                    ) &&
                    (
                        !targetPosition ||
                        !candidate.position ||
                        candidate.position ===
                            targetPosition
                    ),
            )
            .map(
                (candidate) => ({
                    ...candidate,
                    distance:
                        distance(
                            target,
                            candidate.normalized,
                        ),
                }),
            )
            .sort(
                (a, b) =>
                    a.distance -
                        b.distance ||
                    a.adp -
                        b.adp,
            )
            .slice(
                0,
                3,
            )

    console.log('')
    console.log(
        `${record.season} | ${record.player} | ${record.position ?? '?'}`,
    )

    for (const candidate of candidates) {
        console.log(
            `  ${candidate.player} | ${candidate.position ?? '?'} | ADP ${candidate.adp} | distance ${candidate.distance}`,
        )
    }
}

console.log('')
console.log(
    `TOTAL NON-DST WITHOUT ADP: ${missing.length}`,
)