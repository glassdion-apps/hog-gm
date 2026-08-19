import fs from 'node:fs'
import path from 'node:path'

import type {
    HistoricalDraftPick,
    KeeperRecord,
    ManagerPosition,
    ManagerProfile,
    PositionDraftRates,
} from '../src/data/managerTypes.js'

import {
    getCanonicalManagerName,
} from '../src/data/managerAliases.js'

type RawManagerPick = {
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

type RawKeeper = {
    manager: string
    season: number

    player: string
    position: ManagerPosition

    keeperRound?: number
    keeperCost?: number
    yearsKept?: number
}

type ManagerImportConfig = {
    managerNames: string[]
    currentDraftOrder: string[]

    historicalPicks: RawManagerPick[]
    keepers: RawKeeper[]
}

const EMPTY_POSITION_RATES: PositionDraftRates = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
    K: 0,
    DST: 0,
}

function roundNumber(
    value: number,
    decimals = 3,
) {
    const multiplier =
        10 ** decimals

    return (
        Math.round(
            value * multiplier,
        ) / multiplier
    )
}

function getPositionRates(
    picks: HistoricalDraftPick[],
): PositionDraftRates {
    if (picks.length === 0) {
        return {
            ...EMPTY_POSITION_RATES,
        }
    }

    const counts: Record<
        ManagerPosition,
        number
    > = {
        QB: 0,
        RB: 0,
        WR: 0,
        TE: 0,
        K: 0,
        DST: 0,
    }

    for (const pick of picks) {
        counts[pick.position] += 1
    }

    return {
        QB: roundNumber(
            counts.QB / picks.length,
        ),

        RB: roundNumber(
            counts.RB / picks.length,
        ),

        WR: roundNumber(
            counts.WR / picks.length,
        ),

        TE: roundNumber(
            counts.TE / picks.length,
        ),

        K: roundNumber(
            counts.K / picks.length,
        ),

        DST: roundNumber(
            counts.DST / picks.length,
        ),
    }
}

function getAverageAdpReach(
    picks: HistoricalDraftPick[],
) {
    const picksWithAdp =
        picks.filter(
            (pick) =>
                typeof pick.publicAdp ===
                'number',
        )

    if (picksWithAdp.length === 0) {
        return 0
    }

    const total =
        picksWithAdp.reduce(
            (sum, pick) =>
                sum +
                (
                    (pick.publicAdp ?? 0) -
                    pick.overallPick
                ),
            0,
        )

    return roundNumber(
        total /
        picksWithAdp.length,
        1,
    )
}

function getReachRate(
    picks: HistoricalDraftPick[],
) {
    const picksWithAdp =
        picks.filter(
            (pick) =>
                typeof pick.publicAdp ===
                'number',
        )

    if (picksWithAdp.length === 0) {
        return 0
    }

    const reaches =
        picksWithAdp.filter(
            (pick) =>
                pick.overallPick <
                (pick.publicAdp ?? 0) - 6,
        ).length

    return roundNumber(
        reaches /
        picksWithAdp.length,
    )
}

function getValueRate(
    picks: HistoricalDraftPick[],
) {
    const picksWithAdp =
        picks.filter(
            (pick) =>
                typeof pick.publicAdp ===
                'number',
        )

    if (picksWithAdp.length === 0) {
        return 0
    }

    const values =
        picksWithAdp.filter(
            (pick) =>
                pick.overallPick >
                (pick.publicAdp ?? 0) + 6,
        ).length

    return roundNumber(
        values /
        picksWithAdp.length,
    )
}

function getEarlyPositionRate(
    picks: HistoricalDraftPick[],
    position: ManagerPosition,
) {
    const earlyPicks =
        picks.filter(
            (pick) =>
                pick.round <= 5,
        )

    if (earlyPicks.length === 0) {
        return 0
    }

    const matches =
        earlyPicks.filter(
            (pick) =>
                pick.position ===
                position,
        ).length

    return roundNumber(
        matches /
        earlyPicks.length,
    )
}

function getPreferredPositions(
    rates: PositionDraftRates,
): ManagerPosition[] {
    return (
        Object.entries(rates) as [
            ManagerPosition,
            number,
        ][]
    )
        .sort(
            (a, b) =>
                b[1] - a[1],
        )
        .map(
            ([position]) =>
                position,
        )
        .slice(0, 3)
}

function getTendency(
    rates: PositionDraftRates,
) {
    if (rates.WR >= 0.4) {
        return 'WR Heavy'
    }

    if (rates.RB >= 0.4) {
        return 'RB Heavy'
    }

    if (rates.QB >= 0.18) {
        return 'QB Early'
    }

    if (rates.TE >= 0.15) {
        return 'TE Aggressive'
    }

    return 'Balanced'
}

function getTeamBias(
    picks: HistoricalDraftPick[],
) {
    const counts:
        Record<string, number> = {}

    const picksWithTeam =
        picks.filter(
            (pick) =>
                Boolean(pick.team),
        )

    if (picksWithTeam.length === 0) {
        return {}
    }

    for (const pick of picksWithTeam) {
        if (!pick.team) {
            continue
        }

        counts[pick.team] =
            (counts[pick.team] ?? 0) + 1
    }

    const teamBias:
        Record<string, number> = {}

    for (
        const [team, count] of
        Object.entries(counts)
    ) {
        teamBias[team] =
            roundNumber(
                count /
                picksWithTeam.length,
                3,
            )
    }

    return teamBias
}

function getFilteredDraftRate(
    picks: HistoricalDraftPick[],
    predicate: (
        pick: HistoricalDraftPick,
    ) => boolean,
) {
    if (picks.length === 0) {
        return 0
    }

    const matches =
        picks.filter(
            predicate,
        ).length

    return roundNumber(
        matches / picks.length,
    )
}

function getFilteredReachRate(
    picks: HistoricalDraftPick[],
    predicate: (
        pick: HistoricalDraftPick,
    ) => boolean,
) {
    const matchingPicks =
        picks.filter(
            (pick) =>
                predicate(pick) &&
                typeof pick.publicAdp ===
                'number',
        )

    if (matchingPicks.length === 0) {
        return 0
    }

    const reaches =
        matchingPicks.filter(
            (pick) =>
                pick.overallPick <
                (pick.publicAdp ?? 0) - 6,
        ).length

    return roundNumber(
        reaches /
        matchingPicks.length,
    )
}

function getFilteredAverageReach(
    picks: HistoricalDraftPick[],
    predicate: (
        pick: HistoricalDraftPick,
    ) => boolean,
) {
    const matchingPicks =
        picks.filter(
            (pick) =>
                predicate(pick) &&
                typeof pick.publicAdp ===
                'number',
        )

    if (matchingPicks.length === 0) {
        return 0
    }

    const totalReach =
        matchingPicks.reduce(
            (sum, pick) =>
                sum +
                (
                    (pick.publicAdp ?? 0) -
                    pick.overallPick
                ),
            0,
        )

    return roundNumber(
        totalReach /
        matchingPicks.length,
        1,
    )
}

function normalizeConfig(
    config: ManagerImportConfig,
): ManagerImportConfig {
    /*
     * Convert every historical fantasy-team
     * name to the permanent manager identity
     * before doing any analysis.
     */

    const managerNames =
        Array.from(
            new Set(
                config.managerNames.map(
                    (name) =>
                        getCanonicalManagerName(
                            name,
                        ),
                ),
            ),
        )

    const currentDraftOrder =
        config.currentDraftOrder.map(
            (name) =>
                getCanonicalManagerName(
                    name,
                ),
        )

    const historicalPicks =
        config.historicalPicks.map(
            (pick) => ({
                ...pick,

                manager:
                    getCanonicalManagerName(
                        pick.manager,
                    ),
            }),
        )

    const keepers =
        config.keepers.map(
            (keeper) => ({
                ...keeper,

                manager:
                    getCanonicalManagerName(
                        keeper.manager,
                    ),
            }),
        )

    return {
        managerNames,
        currentDraftOrder,
        historicalPicks,
        keepers,
    }
}

function buildManagerProfile(
    managerName: string,
    managerIndex: number,
    config: ManagerImportConfig,
): ManagerProfile {
    const managerPicks =
        config.historicalPicks
            .filter(
                (pick) =>
                    pick.manager ===
                    managerName,
            )
            .map<HistoricalDraftPick>(
                (pick) => ({
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

                    publicAdp:
                        pick.publicAdp,

                    adpDifference:
                        typeof pick.publicAdp ===
                            'number'
                            ? roundNumber(
                                pick.publicAdp -
                                pick.overallPick,
                                1,
                            )
                            : undefined,

                    isRookie:
                        pick.isRookie ??
                        false,

                    wasKeeper:
                        pick.wasKeeper ??
                        false,
                }),
            )

    const managerKeepers =
        config.keepers
            .filter(
                (keeper) =>
                    keeper.manager ===
                    managerName,
            )
            .map<KeeperRecord>(
                (keeper) => ({
                    season:
                        keeper.season,

                    player:
                        keeper.player,

                    position:
                        keeper.position,

                    keeperRound:
                        keeper.keeperRound,

                    keeperCost:
                        keeper.keeperCost,

                    yearsKept:
                        keeper.yearsKept,
                }),
            )

    const positionRates =
        getPositionRates(
            managerPicks,
        )

    const earlyPicks =
        managerPicks.filter(
            (pick) =>
                pick.round <= 5,
        )

    const earlyRoundPositionRates =
        getPositionRates(
            earlyPicks,
        )

    const seasonsTracked =
        new Set(
            managerPicks.map(
                (pick) =>
                    pick.season,
            ),
        ).size

    const averageAdpReach =
        getAverageAdpReach(
            managerPicks,
        )

    const reachRate =
        getReachRate(
            managerPicks,
        )

    const valueRate =
        getValueRate(
            managerPicks,
        )

    const earlyQbRate =
        getEarlyPositionRate(
            managerPicks,
            'QB',
        )

    const earlyTeRate =
        getEarlyPositionRate(
            managerPicks,
            'TE',
        )

    const rbHeavyRate =
        positionRates.RB

    const wrHeavyRate =
        positionRates.WR

    const teamBias =
        getTeamBias(
            managerPicks,
        )

    const bearsDraftRate =
        getFilteredDraftRate(
            managerPicks,
            (pick) =>
                pick.team === 'CHI',
        )

    const bearsReachRate =
        getFilteredReachRate(
            managerPicks,
            (pick) =>
                pick.team === 'CHI',
        )

    const averageBearsAdpReach =
        getFilteredAverageReach(
            managerPicks,
            (pick) =>
                pick.team === 'CHI',
        )

    const rookieDraftRate =
        getFilteredDraftRate(
            managerPicks,
            (pick) =>
                pick.isRookie === true,
        )

    const rookieReachRate =
        getFilteredReachRate(
            managerPicks,
            (pick) =>
                pick.isRookie === true,
        )

    const averageRookieAdpReach =
        getFilteredAverageReach(
            managerPicks,
            (pick) =>
                pick.isRookie === true,
        )

    const earlyRoundRookieRate =
        getFilteredDraftRate(
            earlyPicks,
            (pick) =>
                pick.isRookie === true,
        )

    const keeperRate =
        seasonsTracked > 0
            ? roundNumber(
                managerKeepers.length /
                seasonsTracked,
            )
            : 0

    const aggressionScore =
        roundNumber(
            Math.min(
                100,
                Math.max(
                    0,
                    50 +
                    averageAdpReach * 2 +
                    reachRate * 30,
                ),
            ),
            1,
        )

    const predictabilityScore =
        roundNumber(
            Math.min(
                100,
                Math.max(
                    0,
                    Math.max(
                        positionRates.QB,
                        positionRates.RB,
                        positionRates.WR,
                        positionRates.TE,
                    ) * 100,
                ),
            ),
            1,
        )

    return {
        id:
            managerIndex + 1,

        name:
            managerName,

        draftSlot:
            config.currentDraftOrder
                .indexOf(
                    managerName,
                ) + 1,

        tendency:
            getTendency(
                positionRates,
            ),

        preferredPositions:
            getPreferredPositions(
                positionRates,
            ),

        historicalDrafts:
            managerPicks,

        keepers:
            managerKeepers,

        seasonsTracked,

        totalHistoricalPicks:
            managerPicks.length,

        positionRates,

        earlyRoundPositionRates,

        roundProfiles: [],

        averageAdpReach,

        reachRate,

        valueRate,

        earlyQbRate,

        earlyTeRate,

        rbHeavyRate,

        wrHeavyRate,

        teamBias,

        bearsDraftRate,
        bearsReachRate,
        averageBearsAdpReach,

        rookieDraftRate,
        rookieReachRate,
        averageRookieAdpReach,
        earlyRoundRookieRate,

        keeperRate,

        aggressionScore,

        predictabilityScore,
    }
}

function main() {
    const inputPath =
        path.join(
            process.cwd(),
            'data',
            'manager-history.json',
        )

    const rawInput =
        fs.readFileSync(
            inputPath,
            'utf8',
        )

    const rawConfig =
        JSON.parse(
            rawInput,
        ) as ManagerImportConfig

    /*
     * Normalize aliases BEFORE building
     * any manager profiles.
     */
    const config =
        normalizeConfig(
            rawConfig,
        )

    const managers =
        config.managerNames.map(
            (
                managerName,
                index,
            ) =>
                buildManagerProfile(
                    managerName,
                    index,
                    config,
                ),
        )

    const outputPath =
        path.join(
            process.cwd(),
            'src',
            'data',
            'managers.generated.ts',
        )

    const source =
        `import type { ManagerProfile } from './managerTypes'\n\n` +
        `export const generatedManagers: ManagerProfile[] = ` +
        `${JSON.stringify(
            managers,
            null,
            2,
        )}\n`

    fs.writeFileSync(
        outputPath,
        source,
    )

    console.log('')
    console.log(
        `✅ Manager profiles written to: ${outputPath}`,
    )

    console.log(
        `Managers generated: ${managers.length}`,
    )

    console.log(
        `Historical picks: ${config.historicalPicks.length}`,
    )

    console.log(
        `Keeper records: ${config.keepers.length}`,
    )
}

main()