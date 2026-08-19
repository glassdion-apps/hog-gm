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

    /*
     * This will eventually be replaced
     * by the actual 2026 draft order.
     */
    currentDraftOrder: string[]

    historicalPicks:
    ManagerHistoryPick[]

    keepers:
    ManagerHistoryKeeper[]
}

function main() {
    const historicalPicks:
        ManagerHistoryPick[] = []

    const allManagerNames =
        new Set<string>()

    /*
     * Keep each season's draft order.
     *
     * For now the newest historical
     * season becomes our temporary
     * current order until the actual
     * 2026 order is loaded.
     */
    let latestSeason = 0

    let latestDraftOrder:
        string[] = []

    console.log('')
    console.log(
        'Building Honda manager history...',
    )
    console.log('')

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
         * Normalize historical fantasy
         * team names into permanent
         * manager identities.
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

                team:
                    pick.team,

                /*
                 * ADP and rookie status
                 * will be enriched in the
                 * next stage from the CBS
                 * ranking/ADP data.
                 */
                publicAdp:
                    undefined,

                isRookie:
                    undefined,

                /*
                 * None of the historical
                 * drafts through 2025 were
                 * keeper-affected.
                 *
                 * 2026 is the first draft
                 * where keepers will occupy
                 * draft capital.
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
                a.season !== b.season
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
     * Put managers from the newest
     * available draft first.
     *
     * Historical managers who are no
     * longer in the league remain in
     * the dataset afterward.
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
         * Temporary only.
         *
         * Later we will replace this
         * with the actual 2026 draft
         * order you supplied.
         */
        currentDraftOrder:
            latestDraftOrder,

        historicalPicks,

        /*
         * 2026 will be the first
         * keeper-affected draft.
         * We will load the actual
         * 2026 keeper assignments
         * separately.
         */
        keepers: [],
    }

    const outputDirectory =
        path.join(
            process.cwd(),
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
        `✅ Manager history written to: ${outputPath}`,
    )
}

main()