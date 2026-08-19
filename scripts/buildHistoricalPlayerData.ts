import fs from 'node:fs'
import path from 'node:path'

type HistoricalManagerPick = {
    manager: string
    season: number

    round: number
    pickInRound: number
    overallPick: number

    player: string
    position: string

    team?: string
    publicAdp?: number
    isRookie?: boolean
    wasKeeper?: boolean
}

type ManagerHistoryFile = {
    managerNames: string[]
    currentDraftOrder: string[]
    historicalPicks: HistoricalManagerPick[]
    keepers: unknown[]
}

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
 * PATHS
 * ---------------------------------------------------------
 */

const projectRoot =
    process.cwd()

const managerHistoryPath =
    path.join(
        projectRoot,
        'data',
        'manager-history.json',
    )

const enrichmentDirectory =
    path.join(
        projectRoot,
        'data',
        'historical-player-data',
    )

const outputPath =
    path.join(
        enrichmentDirectory,
        'historical-player-data.json',
    )

/*
 * ---------------------------------------------------------
 * READ MANAGER HISTORY
 * ---------------------------------------------------------
 */

function readManagerHistory() {
    if (
        !fs.existsSync(
            managerHistoryPath,
        )
    ) {
        throw new Error(
            [
                '',
                'manager-history.json was not found.',
                '',
                `Expected: ${managerHistoryPath}`,
                '',
                'Run:',
                'npx tsx scripts/buildManagerHistory.ts',
                '',
            ].join(
                '\n',
            ),
        )
    }

    return JSON.parse(
        fs.readFileSync(
            managerHistoryPath,
            'utf8',
        ),
    ) as ManagerHistoryFile
}

/*
 * ---------------------------------------------------------
 * READ OPTIONAL SEASON ENRICHMENT FILES
 * ---------------------------------------------------------
 *
 * Eventually each season can have a JSON file:
 *
 * data/historical-player-data/2018.json
 * data/historical-player-data/2019.json
 * ...
 *
 * Format:
 *
 * [
 *   {
 *     "player": "Saquon Barkley",
 *     "team": "NYG",
 *     "publicAdp": 6.2,
 *     "isRookie": true
 *   }
 * ]
 */

type SeasonInputRecord = {
    player: string

    position?: string
    team?: string

    publicAdp?: number
    isRookie?: boolean
}

function readSeasonEnrichment(
    season: number,
): SeasonInputRecord[] {
    const seasonPath =
        path.join(
            enrichmentDirectory,
            `${season}.json`,
        )

    if (
        !fs.existsSync(
            seasonPath,
        )
    ) {
        return []
    }

    const parsed =
        JSON.parse(
            fs.readFileSync(
                seasonPath,
                'utf8',
            ),
        )

    if (
        !Array.isArray(
            parsed,
        )
    ) {
        throw new Error(
            `${seasonPath} must contain a JSON array.`,
        )
    }

    return parsed as SeasonInputRecord[]
}

/*
 * ---------------------------------------------------------
 * BUILD BASE RECORDS
 * ---------------------------------------------------------
 */

function buildBaseRecords(
    history: ManagerHistoryFile,
) {
    const byPlayer =
        new Map<
            string,
            HistoricalPlayerRecord
        >()

    for (
        const pick of
        history.historicalPicks
    ) {
        const key =
            makePlayerKey(
                pick.season,
                pick.player,
            )

        const existing =
            byPlayer.get(
                key,
            )

        if (
            existing
        ) {
            continue
        }

        byPlayer.set(
            key,
            {
                season:
                    pick.season,

                player:
                    pick.player,

                position:
                    pick.position,
            },
        )
    }

    return byPlayer
}

/*
 * ---------------------------------------------------------
 * APPLY SEASON ENRICHMENT
 * ---------------------------------------------------------
 */

function applySeasonEnrichment(
    records:
        Map<
            string,
            HistoricalPlayerRecord
        >,
    season: number,
    enrichment:
        SeasonInputRecord[],
) {
    let matched = 0
    let unmatched = 0

    for (
        const item of
        enrichment
    ) {
        const key =
            makePlayerKey(
                season,
                item.player,
            )

        const existing =
            records.get(
                key,
            )

        if (
            !existing
        ) {
            unmatched += 1

            continue
        }

        if (
            item.position
        ) {
            existing.position =
                item.position
        }

        if (
            item.team
        ) {
            existing.team =
                item.team
                    .trim()
                    .toUpperCase()
        }

        if (
            typeof item.publicAdp ===
            'number'
        ) {
            existing.publicAdp =
                item.publicAdp
        }

        if (
            typeof item.isRookie ===
            'boolean'
        ) {
            existing.isRookie =
                item.isRookie
        }

        matched += 1
    }

    return {
        matched,
        unmatched,
    }
}

/*
 * ---------------------------------------------------------
 * MAIN
 * ---------------------------------------------------------
 */

function main() {
    console.log('')
    console.log(
        'Building Honda historical player data...',
    )
    console.log('')

    const history =
        readManagerHistory()

    fs.mkdirSync(
        enrichmentDirectory,
        {
            recursive: true,
        },
    )

    const seasons =
        Array.from(
            new Set(
                history.historicalPicks.map(
                    (pick) =>
                        pick.season,
                ),
            ),
        ).sort(
            (a, b) =>
                a - b,
        )

    const records =
        buildBaseRecords(
            history,
        )

    console.log(
        `Historical draft picks: ${history.historicalPicks.length}`,
    )

    console.log(
        `Unique player-seasons: ${records.size}`,
    )

    console.log('')

    for (
        const season of
        seasons
    ) {
        const enrichment =
            readSeasonEnrichment(
                season,
            )

        if (
            enrichment.length === 0
        ) {
            console.log(
                `⚠️ ${season}: no enrichment file`,
            )

            continue
        }

        const {
            matched,
            unmatched,
        } =
            applySeasonEnrichment(
                records,
                season,
                enrichment,
            )

        console.log(
            `✅ ${season}: ${matched} matched, ${unmatched} unmatched`,
        )
    }

    const output:
        HistoricalPlayerDataFile = {
        generatedAt:
            new Date().toISOString(),

        seasons,

        records:
            Array.from(
                records.values(),
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
            ),
    }

    fs.writeFileSync(
        outputPath,
        JSON.stringify(
            output,
            null,
            2,
        ),
    )

    const withTeam =
        output.records.filter(
            (record) =>
                Boolean(
                    record.team,
                ),
        ).length

    const withAdp =
        output.records.filter(
            (record) =>
                typeof record.publicAdp ===
                'number',
        ).length

    const withRookieStatus =
        output.records.filter(
            (record) =>
                typeof record.isRookie ===
                'boolean',
        ).length

    console.log('')
    console.log(
        '--------------------------------',
    )

    console.log(
        `Seasons: ${seasons.join(', ')}`,
    )

    console.log(
        `Player-season records: ${output.records.length}`,
    )

    console.log(
        `With NFL team: ${withTeam}`,
    )

    console.log(
        `With ADP: ${withAdp}`,
    )

    console.log(
        `With rookie status: ${withRookieStatus}`,
    )

    console.log('')
    console.log(
        `✅ Historical player data written to: ${outputPath}`,
    )
}

main()
