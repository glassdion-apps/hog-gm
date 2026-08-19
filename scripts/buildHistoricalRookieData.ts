import fs from 'node:fs'
import path from 'node:path'

type HistoricalPlayerRecord = {
    season: number
    player: string

    position?: string
    team?: string

    publicAdp?: number
    isRookie?: boolean
}

type HistoricalPlayerDataFile = {
    generatedAt: string
    seasons: number[]
    records: HistoricalPlayerRecord[]
}

type RookieReferenceRecord = {
    season: number
    player: string
}

type RookieReferenceFile = {
    generatedAt: string
    seasons: number[]
    rookies: RookieReferenceRecord[]
}

const projectRoot =
    process.cwd()

const historicalPlayerDataPath =
    path.join(
        projectRoot,
        'data',
        'historical-player-data',
        'historical-player-data.json',
    )

const rookieDirectory =
    path.join(
        projectRoot,
        'data',
        'historical-rookies',
    )

const rookieReferencePath =
    path.join(
        rookieDirectory,
        'rookies.json',
    )

const outputPath =
    path.join(
        projectRoot,
        'data',
        'historical-player-data',
        'historical-player-data.json',
    )

function normalizePlayerName(
    value: string,
) {
    return value
        .trim()
        .toLowerCase()
        .replace(
            /['’]/g,
            "'",
        )
        .replace(
            /\./g,
            '',
        )
        .replace(
            /\s+/g,
            ' ',
        )
}

function makeKey(
    season: number,
    player: string,
) {
    return (
        `${season}:` +
        normalizePlayerName(
            player,
        )
    )
}

function readHistoricalPlayerData() {
    if (
        !fs.existsSync(
            historicalPlayerDataPath,
        )
    ) {
        throw new Error(
            [
                '',
                'Historical player data was not found.',
                '',
                `Expected: ${historicalPlayerDataPath}`,
                '',
                'Run:',
                'npx tsx scripts/buildHistoricalPlayerData.ts',
                '',
            ].join(
                '\n',
            ),
        )
    }

    return JSON.parse(
        fs.readFileSync(
            historicalPlayerDataPath,
            'utf8',
        ),
    ) as HistoricalPlayerDataFile
}

function readRookieReference() {
    if (
        !fs.existsSync(
            rookieReferencePath,
        )
    ) {
        return null
    }

    return JSON.parse(
        fs.readFileSync(
            rookieReferencePath,
            'utf8',
        ),
    ) as RookieReferenceFile
}

function createEmptyRookieReference(
    seasons: number[],
) {
    fs.mkdirSync(
        rookieDirectory,
        {
            recursive: true,
        },
    )

    const emptyReference:
        RookieReferenceFile = {
        generatedAt:
            new Date().toISOString(),

        seasons,

        rookies: [],
    }

    fs.writeFileSync(
        rookieReferencePath,
        JSON.stringify(
            emptyReference,
            null,
            2,
        ),
    )

    return emptyReference
}

function main() {
    console.log('')
    console.log(
        'Building Honda historical rookie data...',
    )
    console.log('')

    const historicalData =
        readHistoricalPlayerData()

    let rookieReference =
        readRookieReference()

    if (
        !rookieReference
    ) {
        rookieReference =
            createEmptyRookieReference(
                historicalData.seasons,
            )

        console.log(
            '⚠️ Rookie reference file did not exist.',
        )

        console.log(
            `Created: ${rookieReferencePath}`,
        )

        console.log('')
    }

    const rookieKeys =
        new Set(
            rookieReference.rookies.map(
                (rookie) =>
                    makeKey(
                        rookie.season,
                        rookie.player,
                    ),
            ),
        )

    let rookiesMatched = 0
    let veteransMarked = 0

    for (
        const record of
        historicalData.records
    ) {
        const key =
            makeKey(
                record.season,
                record.player,
            )

        if (
            rookieKeys.has(
                key,
            )
        ) {
            record.isRookie = true
            rookiesMatched += 1

            continue
        }

        /*
         * Only mark false when the season has
         * actually been represented in our
         * rookie reference file.
         *
         * This prevents an incomplete rookie
         * list from silently labeling everyone
         * as a veteran.
         */
        /*
 * A season is only considered complete when
 * the rookie reference actually contains
 * rookie records for that season.
 *
 * An empty/generated reference must NOT
 * classify every player as a veteran.
 */
        const completedSeasons =
            new Set(
                rookieReference.rookies.map(
                    (rookie) =>
                        rookie.season,
                ),
            )

        if (
            completedSeasons.has(
                record.season,
            )
        ) {
            record.isRookie = false
            veteransMarked += 1
        }
    }

    historicalData.generatedAt =
        new Date().toISOString()

    fs.writeFileSync(
        outputPath,
        JSON.stringify(
            historicalData,
            null,
            2,
        ),
    )

    const knownRookieStatus =
        historicalData.records.filter(
            (record) =>
                typeof record.isRookie ===
                'boolean',
        ).length

    const rookieCount =
        historicalData.records.filter(
            (record) =>
                record.isRookie === true,
        ).length

    console.log(
        `Historical player-seasons: ${historicalData.records.length}`,
    )

    console.log(
        `Rookie reference entries: ${rookieReference.rookies.length}`,
    )

    console.log('')
    console.log(
        '--------------------------------',
    )

    console.log(
        `Rookies matched: ${rookiesMatched}`,
    )

    console.log(
        `Veterans marked: ${veteransMarked}`,
    )

    console.log(
        `Known rookie status: ${knownRookieStatus}`,
    )

    console.log(
        `Rookie player-seasons: ${rookieCount}`,
    )

    console.log('')
    console.log(
        `✅ Historical rookie data written to: ${outputPath}`,
    )

    console.log('')

    if (
        rookieReference.rookies.length === 0
    ) {
        console.log(
            'NEXT:',
        )

        console.log(
            `Add confirmed rookies to: ${rookieReferencePath}`,
        )

        console.log('')
        console.log(
            'Example:',
        )

        console.log(
            JSON.stringify(
                {
                    generatedAt:
                        new Date().toISOString(),

                    seasons: [
                        2018,
                        2019,
                        2021,
                        2022,
                        2023,
                        2024,
                        2025,
                    ],

                    rookies: [
                        {
                            season: 2018,
                            player: 'Saquon Barkley',
                        },
                        {
                            season: 2021,
                            player: 'Ja’Marr Chase',
                        },
                        {
                            season: 2023,
                            player: 'Bijan Robinson',
                        },
                    ],
                },
                null,
                2,
            ),
        )
    }
}

main()