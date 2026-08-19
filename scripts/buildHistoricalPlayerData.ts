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

type SeasonInputRecord = {
    season?: number
    player: string

    position?: string
    team?: string

    publicAdp?: number
    isRookie?: boolean

    adpSource?: string
}

type SeasonEnrichmentFile = {
    generatedAt?: string
    season?: number
    source?: string
    scoring?: string
    records?: SeasonInputRecord[]
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

const historicalPlayerDataDirectory =
    path.join(
        projectRoot,
        'data',
        'historical-player-data',
    )

const enrichmentDirectory =
    path.join(
        historicalPlayerDataDirectory,
        'enrichment',
    )

const outputPath =
    path.join(
        historicalPlayerDataDirectory,
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
 * READ SEASON ENRICHMENT
 * ---------------------------------------------------------
 */

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
        ) as
        | SeasonEnrichmentFile
        | SeasonInputRecord[]

    /*
     * Support both formats:
     *
     * Old:
     * [
     *   { player, publicAdp, ... }
     * ]
     *
     * New importer:
     * {
     *   generatedAt,
     *   season,
     *   source,
     *   scoring,
     *   records: [...]
     * }
     */
    if (
        Array.isArray(
            parsed,
        )
    ) {
        return parsed
    }

    if (
        Array.isArray(
            parsed.records,
        )
    ) {
        return parsed.records
    }

    throw new Error(
        `${seasonPath} does not contain a valid records array.`,
    )
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

                team:
                    pick.team,

                publicAdp:
                    pick.publicAdp,

                isRookie:
                    pick.isRookie,
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
    let matched =
        0

    let unmatched =
        0

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
            unmatched +=
                1

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

        matched +=
            1
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
        historicalPlayerDataDirectory,
        {
            recursive: true,
        },
    )

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

    let totalMatched =
        0

    for (
        const season of
        seasons
    ) {
        const enrichment =
            readSeasonEnrichment(
                season,
            )

        if (
            enrichment.length ===
            0
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

        totalMatched +=
            matched

        console.log(
            `✅ ${season}: ${matched} Honda players matched, ${unmatched} FantasyPros players unused`,
        )
    }

    const output:
        HistoricalPlayerDataFile = {
        generatedAt:
            new Date()
                .toISOString(),

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

    const withoutAdp =
        output.records.length -
        withAdp

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
        `FantasyPros matches: ${totalMatched}`,
    )

    console.log(
        `With NFL team: ${withTeam}`,
    )

    console.log(
        `With ADP: ${withAdp}`,
    )

    console.log(
        `Without ADP: ${withoutAdp}`,
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