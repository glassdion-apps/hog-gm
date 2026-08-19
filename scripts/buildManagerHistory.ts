import fs from 'node:fs'
import path from 'node:path'

import {
    historicalLeagueSeasons,
} from './managerHistorySources.js'

import {
    parseCbsDraftFile,
} from './parseCbsDraftHistory.js'

import {
    getCanonicalManagerName,
} from '../src/data/managerAliases.js'

import type {
    ManagerPosition,
} from '../src/data/managerTypes.js'

type ManagerHistoryPick = {
    manager: string
    season: number

    round: number
    pickInRound: number
    overallPick: number

    player: string
    position: ManagerPosition

    team?: string
    publicAdp?: number
    isRookie?: boolean

    wasKeeper?: boolean
}

type ManagerHistoryKeeper = {
    manager: string
    season: number

    player: string
    position: ManagerPosition

    keeperRound?: number
    keeperCost?: number
    yearsKept?: number
}

type ManagerHistoryOutput = {
    managerNames: string[]

    currentDraftOrder: string[]

    historicalPicks:
    ManagerHistoryPick[]

    keepers:
    ManagerHistoryKeeper[]
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
 * PATHS
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

/*
 * ---------------------------------------------------------
 * PLAYER NORMALIZATION
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
 * HISTORICAL PLAYER ENRICHMENT
 * ---------------------------------------------------------
 */

function readHistoricalPlayerData() {
    if (
        !fs.existsSync(
            historicalPlayerDataPath,
        )
    ) {
        console.log(
            '⚠️ Historical player enrichment not found.',
        )

        console.log(
            `   ${historicalPlayerDataPath}`,
        )

        console.log(
            '   Continuing without enrichment.',
        )

        console.log('')

        return null
    }

    try {
        return JSON.parse(
            fs.readFileSync(
                historicalPlayerDataPath,
                'utf8',
            ),
        ) as HistoricalPlayerDataFile
    } catch (
    error
    ) {
        console.warn(
            '⚠️ Historical player enrichment could not be parsed.',
        )

        console.warn(
            error,
        )

        console.warn(
            'Continuing without enrichment.',
        )

        console.log('')

        return null
    }
}

function buildHistoricalPlayerLookup(
    historicalPlayerData:
        HistoricalPlayerDataFile | null,
) {
    const lookup =
        new Map<
            string,
            HistoricalPlayerRecord
        >()

    if (
        !historicalPlayerData
    ) {
        return lookup
    }

    for (
        const record of
        historicalPlayerData.records
    ) {
        lookup.set(
            makePlayerKey(
                record.season,
                record.player,
            ),
            record,
        )
    }

    return lookup
}

/*
 * ---------------------------------------------------------
 * TEAM NORMALIZATION
 * ---------------------------------------------------------
 */

const nflTeams =
    new Set([
        'ARI',
        'ATL',
        'BAL',
        'BUF',
        'CAR',
        'CHI',
        'CIN',
        'CLE',
        'DAL',
        'DEN',
        'DET',
        'GB',
        'HOU',
        'IND',
        'JAC',
        'JAX',
        'KC',
        'LV',
        'LAC',
        'LAR',
        'MIA',
        'MIN',
        'NE',
        'NO',
        'NYG',
        'NYJ',
        'PHI',
        'PIT',
        'SEA',
        'SF',
        'TB',
        'TEN',
        'WAS',
    ])

function normalizeNflTeam(
    value:
        string | undefined,
) {
    if (
        !value
    ) {
        return undefined
    }

    const normalized =
        value
            .trim()
            .toUpperCase()

    if (
        normalized ===
        'JAX'
    ) {
        return 'JAC'
    }

    if (
        !nflTeams.has(
            normalized,
        )
    ) {
        return undefined
    }

    return normalized
}

/*
 * ---------------------------------------------------------
 * MAIN
 * ---------------------------------------------------------
 */

function main() {
    const historicalPicks:
        ManagerHistoryPick[] = []

    const allManagerNames =
        new Set<string>()

    let latestSeason =
        0

    let latestDraftOrder:
        string[] = []

    console.log('')
    console.log(
        'Building Honda manager history...',
    )
    console.log('')

    /*
     * Load the enrichment dataset once.
     *
     * Rookie status is already populated.
     * Team and historical ADP can be added
     * later without changing this builder.
     */
    const historicalPlayerData =
        readHistoricalPlayerData()

    const historicalPlayerLookup =
        buildHistoricalPlayerLookup(
            historicalPlayerData,
        )

    console.log(
        `Historical enrichment records loaded: ${historicalPlayerLookup.size}`,
    )

    console.log('')

    let enrichedRookieStatus =
        0

    let enrichedTeams =
        0

    let enrichedAdp =
        0

    let enrichmentMisses =
        0

    for (
        const seasonSource of
        historicalLeagueSeasons
    ) {
        if (
            !seasonSource.draftFile
        ) {
            console.log(
                `⚠️ ${seasonSource.season}: no draft file configured`,
            )

            continue
        }

        if (
            !fs.existsSync(
                seasonSource.draftFile,
            )
        ) {
            console.log(
                `⚠️ ${seasonSource.season}: file not found`,
            )

            console.log(
                `   ${seasonSource.draftFile}`,
            )

            continue
        }

        const parsedSeason =
            parseCbsDraftFile(
                seasonSource.draftFile,
                seasonSource.season,
            )

        /*
         * Normalize historical fantasy team
         * names into permanent manager identities.
         */
        const normalizedDraftOrder =
            parsedSeason.draftOrder.map(
                (managerName) =>
                    getCanonicalManagerName(
                        managerName,
                    ),
            )

        for (
            const managerName of
            normalizedDraftOrder
        ) {
            allManagerNames.add(
                managerName,
            )
        }

        for (
            const pick of
            parsedSeason.picks
        ) {
            const manager =
                getCanonicalManagerName(
                    pick.manager,
                )

            allManagerNames.add(
                manager,
            )

            const enrichment =
                historicalPlayerLookup.get(
                    makePlayerKey(
                        pick.season,
                        pick.player,
                    ),
                )

            if (
                !enrichment
            ) {
                enrichmentMisses +=
                    1
            }

            const team =
                normalizeNflTeam(
                    enrichment
                        ?.team,
                )

            const publicAdp =
                typeof enrichment
                    ?.publicAdp ===
                    'number'
                    ? enrichment.publicAdp
                    : undefined

            const isRookie =
                typeof enrichment
                    ?.isRookie ===
                    'boolean'
                    ? enrichment.isRookie
                    : undefined

            if (
                team
            ) {
                enrichedTeams +=
                    1
            }

            if (
                publicAdp !==
                undefined
            ) {
                enrichedAdp +=
                    1
            }

            if (
                isRookie !==
                undefined
            ) {
                enrichedRookieStatus +=
                    1
            }

            historicalPicks.push({
                manager,

                season:
                    pick.season,

                round:
                    pick.round,

                pickInRound:
                    pick.pickInRound,

                overallPick:
                    pick.overallPick,

                player:
                    pick.player,

                position:
                    pick.position,

                /*
                 * IMPORTANT:
                 *
                 * Do not use pick.team from the
                 * CBS historical draft page.
                 *
                 * Those pages can expose current
                 * NFL team values rather than
                 * the player's team in that
                 * historical season.
                 */
                team,

                publicAdp,

                isRookie,

                /*
                 * 2026 is the first keeper-affected
                 * Honda draft.
                 *
                 * Historical drafts through 2025
                 * remain normal draft selections.
                 */
                wasKeeper:
                    false,
            })
        }

        if (
            seasonSource.season >
            latestSeason
        ) {
            latestSeason =
                seasonSource.season

            latestDraftOrder =
                normalizedDraftOrder
        }

        console.log(
            `✅ ${seasonSource.season}: ` +
            `${parsedSeason.picks.length} picks, ` +
            `${parsedSeason.managerNames.length} teams`,
        )
    }

    historicalPicks.sort(
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
                a.overallPick -
                b.overallPick
            )
        },
    )

    /*
     * Put managers from the newest available
     * draft first.
     *
     * Historical managers no longer active
     * remain afterward.
     */
    const managerNames =
        [
            ...latestDraftOrder,

            ...Array.from(
                allManagerNames,
            ).filter(
                (managerName) =>
                    !latestDraftOrder.includes(
                        managerName,
                    ),
            ),
        ]

    const output:
        ManagerHistoryOutput = {
        managerNames,

        /*
         * Temporary until the actual 2026
         * draft order is wired into this layer.
         */
        currentDraftOrder:
            latestDraftOrder,

        historicalPicks,

        /*
         * Actual 2026 keeper assignments
         * remain a separate upcoming layer.
         */
        keepers: [],
    }

    const outputDirectory =
        path.join(
            projectRoot,
            'data',
        )

    fs.mkdirSync(
        outputDirectory,
        {
            recursive: true,
        },
    )

    const outputPath =
        path.join(
            outputDirectory,
            'manager-history.json',
        )

    fs.writeFileSync(
        outputPath,
        JSON.stringify(
            output,
            null,
            2,
        ),
    )

    const rookiePicks =
        historicalPicks.filter(
            (pick) =>
                pick.isRookie ===
                true,
        ).length

    const veteranPicks =
        historicalPicks.filter(
            (pick) =>
                pick.isRookie ===
                false,
        ).length

    const unknownRookieStatus =
        historicalPicks.filter(
            (pick) =>
                typeof pick.isRookie !==
                'boolean',
        ).length

    console.log('')
    console.log(
        '--------------------------------',
    )

    console.log(
        `Seasons processed: ${new Set(
            historicalPicks.map(
                (pick) =>
                    pick.season,
            ),
        ).size
        }`,
    )

    console.log(
        `Historical picks: ${historicalPicks.length}`,
    )

    console.log(
        `Manager identities: ${managerNames.length}`,
    )

    console.log(
        `Newest historical season: ${latestSeason || 'none'}`,
    )

    console.log('')
    console.log(
        'Enrichment:',
    )

    console.log(
        `Rookie status attached: ${enrichedRookieStatus}`,
    )

    console.log(
        `NFL teams attached: ${enrichedTeams}`,
    )

    console.log(
        `Historical ADP attached: ${enrichedAdp}`,
    )

    console.log(
        `Enrichment misses: ${enrichmentMisses}`,
    )

    console.log('')
    console.log(
        `Rookie picks: ${rookiePicks}`,
    )

    console.log(
        `Veteran picks: ${veteranPicks}`,
    )

    console.log(
        `Unknown rookie status: ${unknownRookieStatus}`,
    )

    console.log('')
    console.log(
        `✅ Manager history written to: ${outputPath}`,
    )
}

main()