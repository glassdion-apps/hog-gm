import fs from 'node:fs'

type HistoricalRecord = {
    season: number
    player: string
    position?: string
    publicAdp?: number
}

type HistoricalFile = {
    records: HistoricalRecord[]
}

type AdpRecord = {
    player: string
    position?: string
    publicAdp: number
}

type AdpFile = {
    records: AdpRecord[]
}

function normalize(
    value: string,
) {
    return value
        .toLowerCase()
        .trim()
        .replace(
            /[’']/g,
            '',
        )
        .replace(
            /\./g,
            '',
        )
        .replace(
            /-/g,
            ' ',
        )
        .replace(
            /\b(jr|sr|ii|iii|iv|v)\b/g,
            '',
        )
        .replace(
            /\s+/g,
            ' ',
        )
        .trim()
}

function distance(
    a: string,
    b: string,
) {
    const m =
        a.length

    const n =
        b.length

    const dp =
        Array.from(
            {
                length:
                    m + 1,
            },
            () =>
                Array<number>(
                    n + 1,
                ).fill(
                    0,
                ),
        )

    for (
        let i = 0;
        i <= m;
        i += 1
    ) {
        dp[i][0] =
            i
    }

    for (
        let j = 0;
        j <= n;
        j += 1
    ) {
        dp[0][j] =
            j
    }

    for (
        let i = 1;
        i <= m;
        i += 1
    ) {
        for (
            let j = 1;
            j <= n;
            j += 1
        ) {
            dp[i][j] =
                Math.min(
                    dp[i - 1][j] +
                    1,

                    dp[i][j - 1] +
                    1,

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

    return dp[m][n]
}

const historical =
    JSON.parse(
        fs.readFileSync(
            'data/historical-player-data/historical-player-data.json',
            'utf8',
        ),
    ) as HistoricalFile

const missing =
    historical.records.filter(
        (record) =>
            typeof record.publicAdp !==
            'number',
    )

const seasons =
    Array.from(
        new Set(
            missing.map(
                (record) =>
                    record.season,
            ),
        ),
    ).sort(
        (a, b) =>
            a - b,
    )

for (
    const season of
    seasons
) {
    const adpFile =
        JSON.parse(
            fs.readFileSync(
                `data/historical-player-data/enrichment/${season}.json`,
                'utf8',
            ),
        ) as AdpFile

    console.log(
        `\n================ ${season} ================`,
    )

    const seasonMissing =
        missing.filter(
            (record) =>
                record.season ===
                season,
        )

    for (
        const honda of
        seasonMissing
    ) {
        const hondaName =
            normalize(
                honda.player,
            )

        const candidates =
            adpFile.records
                .filter(
                    (candidate) =>
                        !honda.position ||
                        !candidate.position ||
                        candidate.position ===
                        honda.position,
                )
                .map(
                    (candidate) => ({
                        ...candidate,

                        distance:
                            distance(
                                hondaName,
                                normalize(
                                    candidate.player,
                                ),
                            ),
                    }),
                )
                .sort(
                    (a, b) =>
                        a.distance -
                        b.distance ||
                        a.publicAdp -
                        b.publicAdp,
                )
                .slice(
                    0,
                    3,
                )

        console.log(
            `\nHONDA: ${honda.player} | ${honda.position ?? '?'}`,
        )

        for (
            const candidate of
            candidates
        ) {
            console.log(
                `   ${candidate.player} | ${candidate.position ?? '?'} | ADP ${candidate.publicAdp} | distance ${candidate.distance}`,
            )
        }
    }
}

console.log(
    `\nTOTAL WITHOUT ADP: ${missing.length}`,
)