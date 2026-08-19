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
    source: string
    seasons: number[]
    rookies: RookieReferenceRecord[]
}

type NflverseDraftPick = {
    season?: string
    round?: string
    pick?: string
    team?: string

    pfr_player_name?: string
    position?: string
}

/*
 * ---------------------------------------------------------
 * CONFIG
 * ---------------------------------------------------------
 */

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

const outputPath =
    path.join(
        rookieDirectory,
        'rookies.json',
    )

/*
 * nflverse official release used by nflreadr.
 *
 * Draft-pick data includes:
 * season
 * round
 * pick
 * team
 * pfr_player_name
 * position
 */
const NFLVERSE_DRAFT_URL =
    'https://github.com/nflverse/nflverse-data/releases/download/draft_picks/draft_picks.csv'

/*
 * Honda historical seasons currently available.
 *
 * 2020 is intentionally absent because we do
 * not currently have a 2020 Honda draft-history
 * file in the manager-history dataset.
 */
const TARGET_SEASONS =
    new Set([
        2018,
        2019,
        2021,
        2022,
        2023,
        2024,
        2025,
    ])

/*
 * Fantasy-relevant NFL positions.
 *
 * NFL draft data has many defensive/offensive
 * line positions that Honda does not draft.
 */
const FANTASY_POSITIONS =
    new Set([
        'QB',
        'RB',
        'WR',
        'TE',
        'K',
    ])

/*
 * ---------------------------------------------------------
 * NORMALIZATION
 * ---------------------------------------------------------
 */

function normalizePlayerName(
    value: string,
) {
    return value
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(
            /[\u0300-\u036f]/g,
            '',
        )
        .replace(
            /['’`]/g,
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
            /[^a-z0-9\s]/g,
            '',
        )
        .replace(
            /\s+/g,
            ' ',
        )
        .trim()
}

function makePlayerKey(
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

/*
 * ---------------------------------------------------------
 * CSV PARSER
 * ---------------------------------------------------------
 */

function parseCsvLine(
    line: string,
) {
    const values:
        string[] = []

    let current = ''
    let insideQuotes = false

    for (
        let index = 0;
        index < line.length;
        index += 1
    ) {
        const character =
            line[index]

        if (
            character === '"'
        ) {
            const nextCharacter =
                line[
                index + 1
                ]

            if (
                insideQuotes &&
                nextCharacter === '"'
            ) {
                current += '"'

                index += 1

                continue
            }

            insideQuotes =
                !insideQuotes

            continue
        }

        if (
            character === ',' &&
            !insideQuotes
        ) {
            values.push(
                current,
            )

            current = ''

            continue
        }

        current +=
            character
    }

    values.push(
        current,
    )

    return values
}

function parseCsv(
    raw: string,
) {
    const lines =
        raw
            .replace(
                /^\uFEFF/,
                '',
            )
            .split(
                /\r?\n/,
            )
            .filter(
                (line) =>
                    line.trim().length >
                    0,
            )

    if (
        lines.length <
        2
    ) {
        throw new Error(
            'NFL draft CSV contains no data.',
        )
    }

    const headers =
        parseCsvLine(
            lines[0],
        ).map(
            (header) =>
                header.trim(),
        )

    const records:
        NflverseDraftPick[] = []

    for (
        const line of
        lines.slice(1)
    ) {
        const columns =
            parseCsvLine(
                line,
            )

        const record:
            Record<
                string,
                string
            > = {}

        for (
            let index = 0;
            index <
            headers.length;
            index += 1
        ) {
            const header =
                headers[index]

            if (!header) {
                continue
            }

            record[
                header
            ] =
                (
                    columns[
                    index
                    ] ??
                    ''
                ).trim()
        }

        records.push(
            record as
            NflverseDraftPick,
        )
    }

    return records
}

/*
 * ---------------------------------------------------------
 * READ HONDA HISTORICAL PLAYER DATA
 * ---------------------------------------------------------
 */

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
                'Run first:',
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

/*
 * ---------------------------------------------------------
 * DOWNLOAD NFLVERSE DRAFT DATA
 * ---------------------------------------------------------
 */

async function downloadDraftData() {
    console.log(
        'Downloading NFL draft reference data...',
    )

    const response =
        await fetch(
            NFLVERSE_DRAFT_URL,
        )

    if (
        !response.ok
    ) {
        throw new Error(
            `NFL draft download failed: HTTP ${response.status}`,
        )
    }

    return await response.text()
}

/*
 * ---------------------------------------------------------
 * MAIN
 * ---------------------------------------------------------
 */

async function main() {
    console.log('')
    console.log(
        'Building Honda rookie reference...',
    )
    console.log('')

    const historicalData =
        readHistoricalPlayerData()

    /*
     * Build exact Honda player-season lookup.
     *
     * We only care about NFL rookies who were
     * actually drafted in Honda.
     */
    const hondaPlayerKeys =
        new Map<
            string,
            HistoricalPlayerRecord
        >()

    for (
        const record of
        historicalData.records
    ) {
        if (
            !TARGET_SEASONS.has(
                record.season,
            )
        ) {
            continue
        }

        hondaPlayerKeys.set(
            makePlayerKey(
                record.season,
                record.player,
            ),
            record,
        )
    }

    console.log(
        `Honda player-seasons considered: ${hondaPlayerKeys.size}`,
    )

    const rawDraftData =
        await downloadDraftData()

    const draftPicks =
        parseCsv(
            rawDraftData,
        )

    console.log(
        `NFL draft records loaded: ${draftPicks.length}`,
    )

    const rookieMap =
        new Map<
            string,
            RookieReferenceRecord
        >()

    let fantasyDraftPicks =
        0

    let matched =
        0

    let unmatched =
        0

    for (
        const draftPick of
        draftPicks
    ) {
        const season =
            Number(
                draftPick.season,
            )

        if (
            !Number.isFinite(
                season,
            )
        ) {
            continue
        }

        if (
            !TARGET_SEASONS.has(
                season,
            )
        ) {
            continue
        }

        const position =
            (
                draftPick.position ??
                ''
            )
                .trim()
                .toUpperCase()

        if (
            !FANTASY_POSITIONS.has(
                position,
            )
        ) {
            continue
        }

        const player =
            (
                draftPick.pfr_player_name ??
                ''
            ).trim()

        if (!player) {
            continue
        }

        fantasyDraftPicks +=
            1

        const key =
            makePlayerKey(
                season,
                player,
            )

        const hondaPlayer =
            hondaPlayerKeys.get(
                key,
            )

        if (
            !hondaPlayer
        ) {
            unmatched +=
                1

            continue
        }

        rookieMap.set(
            key,
            {
                season,

                /*
                 * Preserve Honda's player spelling
                 * so later matching is guaranteed.
                 */
                player:
                    hondaPlayer.player,
            },
        )

        matched +=
            1
    }

    const rookies =
        Array.from(
            rookieMap.values(),
        ).sort(
            (a, b) => {
                if (
                    a.season !==
                    b.season
                ) {
                    return (
                        a.season -
                        b.season
                    )
                }

                return (
                    a.player.localeCompare(
                        b.player,
                    )
                )
            },
        )

    fs.mkdirSync(
        rookieDirectory,
        {
            recursive: true,
        },
    )

    const output:
        RookieReferenceFile = {
        generatedAt:
            new Date().toISOString(),

        source:
            NFLVERSE_DRAFT_URL,

        seasons:
            Array.from(
                TARGET_SEASONS,
            ).sort(
                (a, b) =>
                    a - b,
            ),

        rookies,
    }

    fs.writeFileSync(
        outputPath,
        JSON.stringify(
            output,
            null,
            2,
        ),
    )

    console.log('')
    console.log(
        '--------------------------------',
    )

    console.log(
        `Fantasy-position NFL draft picks: ${fantasyDraftPicks}`,
    )

    console.log(
        `Honda rookies matched: ${rookies.length}`,
    )

    console.log(
        `Drafted rookies not found in Honda: ${unmatched}`,
    )

    console.log('')

    for (
        const season of
        Array.from(
            TARGET_SEASONS,
        ).sort(
            (a, b) =>
                a - b,
        )
    ) {
        const seasonRookies =
            rookies.filter(
                (rookie) =>
                    rookie.season ===
                    season,
            )

        console.log(
            `${season}: ${seasonRookies.length} Honda rookies`,
        )

        if (
            seasonRookies.length >
            0
        ) {
            console.log(
                `   ${seasonRookies
                    .map(
                        (rookie) =>
                            rookie.player,
                    )
                    .join(' | ')}`,
            )
        }
    }

    console.log('')
    console.log(
        `✅ Rookie reference written to: ${outputPath}`,
    )
}

main().catch(
    (error) => {
        console.error('')
        console.error(
            '❌ Failed to build rookie reference.',
        )

        console.error(
            error,
        )

        process.exitCode =
            1
    },
)