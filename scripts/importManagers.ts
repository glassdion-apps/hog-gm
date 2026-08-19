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

/*
 * ---------------------------------------------------------
 * CONSTANTS
 * ---------------------------------------------------------
 */

const EMPTY_POSITION_RATES:
    PositionDraftRates = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
    K: 0,
    DST: 0,
}

/*
 * ---------------------------------------------------------
 * BASIC HELPERS
 * ---------------------------------------------------------
 */

function roundNumber(
    value: number,
    decimals = 3,
) {
    const multiplier =
        10 ** decimals

    return (
        Math.round(
            value *
            multiplier,
        ) /
        multiplier
    )
}

function normalizeConfig(
    config: ManagerImportConfig,
): ManagerImportConfig {
    /*
     * Canonicalize every historical fantasy-team
     * name before calculating tendencies.
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

/*
 * ---------------------------------------------------------
 * POSITION BEHAVIOR
 * ---------------------------------------------------------
 */

function getPositionRates(
    picks: HistoricalDraftPick[],
): PositionDraftRates {
    if (
        picks.length === 0
    ) {
        return {
            ...EMPTY_POSITION_RATES,
        }
    }

    const counts:
        Record<
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

    for (
        const pick of
        picks
    ) {
        counts[
            pick.position
        ] += 1
    }

    return {
        QB:
            roundNumber(
                counts.QB /
                picks.length,
            ),

        RB:
            roundNumber(
                counts.RB /
                picks.length,
            ),

        WR:
            roundNumber(
                counts.WR /
                picks.length,
            ),

        TE:
            roundNumber(
                counts.TE /
                picks.length,
            ),

        K:
            roundNumber(
                counts.K /
                picks.length,
            ),

        DST:
            roundNumber(
                counts.DST /
                picks.length,
            ),
    }
}

function getPreferredPositions(
    rates: PositionDraftRates,
): ManagerPosition[] {
    return (
        Object.entries(
            rates,
        ) as [
            ManagerPosition,
            number,
        ][]
    )
        .sort(
            (
                [, rateA],
                [, rateB],
            ) =>
                rateB -
                rateA,
        )
        .filter(
            (
                [, rate],
            ) =>
                rate > 0,
        )
        .slice(
            0,
            3,
        )
        .map(
            (
                [position],
            ) =>
                position,
        )
}

function getTendency(
    rates: PositionDraftRates,
) {
    if (
        rates.WR >=
        0.4
    ) {
        return 'WR Heavy'
    }

    if (
        rates.RB >=
        0.4
    ) {
        return 'RB Heavy'
    }

    if (
        rates.QB >=
        0.18
    ) {
        return 'QB Early'
    }

    if (
        rates.TE >=
        0.15
    ) {
        return 'TE Aggressive'
    }

    return 'Balanced'
}

/*
 * ---------------------------------------------------------
 * ADP BEHAVIOR
 * ---------------------------------------------------------
 */

function getPicksWithAdp(
    picks: HistoricalDraftPick[],
) {
    return picks.filter(
        (pick) =>
            typeof pick.publicAdp ===
            'number',
    )
}

function getAverageAdpReach(
    picks: HistoricalDraftPick[],
) {
    const picksWithAdp =
        getPicksWithAdp(
            picks,
        )

    if (
        picksWithAdp.length ===
        0
    ) {
        return 0
    }

    const total =
        picksWithAdp.reduce(
            (
                sum,
                pick,
            ) =>
                sum +
                (
                    (
                        pick.publicAdp ??
                        pick.overallPick
                    ) -
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
        getPicksWithAdp(
            picks,
        )

    if (
        picksWithAdp.length ===
        0
    ) {
        return 0
    }

    /*
     * A reach is defined as taking the player
     * at least 6 overall selections before ADP.
     */
    const reaches =
        picksWithAdp.filter(
            (pick) =>
                pick.overallPick <
                (
                    pick.publicAdp ??
                    pick.overallPick
                ) -
                6,
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
        getPicksWithAdp(
            picks,
        )

    if (
        picksWithAdp.length ===
        0
    ) {
        return 0
    }

    /*
     * Value means the player survived at least
     * 6 selections beyond public ADP.
     */
    const values =
        picksWithAdp.filter(
            (pick) =>
                pick.overallPick >
                (
                    pick.publicAdp ??
                    pick.overallPick
                ) +
                6,
        ).length

    return roundNumber(
        values /
        picksWithAdp.length,
    )
}

/*
 * ---------------------------------------------------------
 * EARLY POSITION BEHAVIOR
 * ---------------------------------------------------------
 */

function getEarlyPositionRate(
    picks: HistoricalDraftPick[],
    position: ManagerPosition,
) {
    const earlyPicks =
        picks.filter(
            (pick) =>
                pick.round <=
                5,
        )

    if (
        earlyPicks.length ===
        0
    ) {
        return 0
    }

    const matching =
        earlyPicks.filter(
            (pick) =>
                pick.position ===
                position,
        ).length

    return roundNumber(
        matching /
        earlyPicks.length,
    )
}

/*
 * ---------------------------------------------------------
 * NFL TEAM BIAS
 * ---------------------------------------------------------
 */

function getTeamBias(
    picks: HistoricalDraftPick[],
) {
    const counts:
        Record<
            string,
            number
        > = {}

    /*
     * Only use picks with season-correct
     * historical NFL team enrichment.
     *
     * Currently this dataset is empty, which
     * is preferable to using CBS's unsafe
     * current-team values.
     */
    const picksWithTeam =
        picks.filter(
            (pick) =>
                Boolean(
                    pick.team,
                ),
        )

    if (
        picksWithTeam.length ===
        0
    ) {
        return {}
    }

    for (
        const pick of
        picksWithTeam
    ) {
        if (
            !pick.team
        ) {
            continue
        }

        counts[
            pick.team
        ] =
            (
                counts[
                pick.team
                ] ??
                0
            ) +
            1
    }

    const result:
        Record<
            string,
            number
        > = {}

    for (
        const [
            team,
            count,
        ] of
        Object.entries(
            counts,
        )
    ) {
        result[
            team
        ] =
            roundNumber(
                count /
                picksWithTeam.length,
            )
    }

    return result
}

/*
 * ---------------------------------------------------------
 * FILTERED TENDENCIES
 * ---------------------------------------------------------
 */

function getFilteredDraftRate(
    picks: HistoricalDraftPick[],
    predicate: (
        pick:
            HistoricalDraftPick,
    ) => boolean,
) {
    if (
        picks.length ===
        0
    ) {
        return 0
    }

    const matches =
        picks.filter(
            predicate,
        ).length

    return roundNumber(
        matches /
        picks.length,
    )
}

function getFilteredReachRate(
    picks: HistoricalDraftPick[],
    predicate: (
        pick:
            HistoricalDraftPick,
    ) => boolean,
) {
    const matchingPicks =
        picks.filter(
            (pick) =>
                predicate(
                    pick,
                ) &&
                typeof pick.publicAdp ===
                'number',
        )

    if (
        matchingPicks.length ===
        0
    ) {
        return 0
    }

    const reaches =
        matchingPicks.filter(
            (pick) =>
                pick.overallPick <
                (
                    pick.publicAdp ??
                    pick.overallPick
                ) -
                6,
        ).length

    return roundNumber(
        reaches /
        matchingPicks.length,
    )
}

function getFilteredAverageReach(
    picks: HistoricalDraftPick[],
    predicate: (
        pick:
            HistoricalDraftPick,
    ) => boolean,
) {
    const matchingPicks =
        picks.filter(
            (pick) =>
                predicate(
                    pick,
                ) &&
                typeof pick.publicAdp ===
                'number',
        )

    if (
        matchingPicks.length ===
        0
    ) {
        return 0
    }

    const total =
        matchingPicks.reduce(
            (
                sum,
                pick,
            ) =>
                sum +
                (
                    (
                        pick.publicAdp ??
                        pick.overallPick
                    ) -
                    pick.overallPick
                ),
            0,
        )

    return roundNumber(
        total /
        matchingPicks.length,
        1,
    )
}

/*
 * ---------------------------------------------------------
 * BUILD MANAGER PROFILE
 * ---------------------------------------------------------
 */

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
                        pick.isRookie,

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
                pick.round <=
                5,
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

    /*
     * -----------------------------------------------------
     * GENERAL ADP BEHAVIOR
     * -----------------------------------------------------
     *
     * These remain 0 until historical ADP
     * enrichment is available.
     */

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

    /*
     * -----------------------------------------------------
     * POSITION TENDENCIES
     * -----------------------------------------------------
     */

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

    /*
     * -----------------------------------------------------
     * NFL TEAM / BEARS TENDENCIES
     * -----------------------------------------------------
     *
     * These remain empty/0 until season-correct
     * historical NFL teams are attached.
     */

    const teamBias =
        getTeamBias(
            managerPicks,
        )

    const bearsDraftRate =
        getFilteredDraftRate(
            managerPicks,
            (pick) =>
                pick.team ===
                'CHI',
        )

    const bearsReachRate =
        getFilteredReachRate(
            managerPicks,
            (pick) =>
                pick.team ===
                'CHI',
        )

    const averageBearsAdpReach =
        getFilteredAverageReach(
            managerPicks,
            (pick) =>
                pick.team ===
                'CHI',
        )

    /*
     * -----------------------------------------------------
     * ROOKIE TENDENCIES
     * -----------------------------------------------------
     *
     * THESE ARE NOW REAL.
     *
     * manager-history.json currently contains
     * rookie status on all 1,260 historical
     * Honda selections.
     */

    const rookieDraftRate =
        getFilteredDraftRate(
            managerPicks,
            (pick) =>
                pick.isRookie ===
                true,
        )

    /*
     * This answers:
     *
     * "What percentage of this manager's
     * historical selections were rookies?"
     */

    const earlyRoundRookieRate =
        getFilteredDraftRate(
            earlyPicks,
            (pick) =>
                pick.isRookie ===
                true,
        )

    /*
     * These two require historical ADP.
     *
     * The code is ready, but they correctly
     * remain 0 until we obtain that dataset.
     */

    const rookieReachRate =
        getFilteredReachRate(
            managerPicks,
            (pick) =>
                pick.isRookie ===
                true,
        )

    const averageRookieAdpReach =
        getFilteredAverageReach(
            managerPicks,
            (pick) =>
                pick.isRookie ===
                true,
        )

    /*
     * -----------------------------------------------------
     * KEEPERS
     * -----------------------------------------------------
     */

    const keeperRate =
        seasonsTracked > 0
            ? roundNumber(
                managerKeepers.length /
                seasonsTracked,
            )
            : 0

    /*
     * -----------------------------------------------------
     * HONDA SCORES
     * -----------------------------------------------------
     */

    /*
     * Do not manufacture an ADP aggression signal
     * when historical ADP does not exist.
     *
     * 50 means neutral / unknown until the
     * historical ADP layer is populated.
     */
    const hasHistoricalAdp =
        managerPicks.some(
            (pick) =>
                typeof pick.publicAdp ===
                'number',
        )

    const aggressionScore =
        hasHistoricalAdp
            ? roundNumber(
                Math.min(
                    100,
                    Math.max(
                        0,
                        50 +
                        averageAdpReach *
                        2 +
                        reachRate *
                        30,
                    ),
                ),
                1,
            )
            : 50

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
                        positionRates.K,
                        positionRates.DST,
                    ) *
                    100,
                ),
            ),
            1,
        )

    const draftOrderIndex =
        config.currentDraftOrder
            .indexOf(
                managerName,
            )

    return {
        /*
         * Identity
         */
        id:
            managerIndex +
            1,

        name:
            managerName,

        /*
         * Current draft
         */
        draftSlot:
            draftOrderIndex >=
                0
                ? draftOrderIndex +
                1
                : 0,

        tendency:
            getTendency(
                positionRates,
            ),

        preferredPositions:
            getPreferredPositions(
                positionRates,
            ),

        /*
         * Historical data
         */
        historicalDrafts:
            managerPicks,

        keepers:
            managerKeepers,

        seasonsTracked,

        totalHistoricalPicks:
            managerPicks.length,

        /*
         * Position behavior
         */
        positionRates,

        earlyRoundPositionRates,

        roundProfiles: [],

        /*
         * ADP behavior
         */
        averageAdpReach,

        reachRate,

        valueRate,

        /*
         * General behavior
         */
        earlyQbRate,

        earlyTeRate,

        rbHeavyRate,

        wrHeavyRate,

        /*
         * NFL-team behavior
         */
        teamBias,

        bearsDraftRate,

        bearsReachRate,

        averageBearsAdpReach,

        /*
         * Rookie behavior
         */
        rookieDraftRate,

        rookieReachRate,

        averageRookieAdpReach,

        earlyRoundRookieRate,

        /*
         * Keeper behavior
         */
        keeperRate,

        /*
         * Honda intelligence
         */
        aggressionScore,

        predictabilityScore,
    }
}

/*
 * ---------------------------------------------------------
 * ROOKIE REPORT
 * ---------------------------------------------------------
 */

function printRookieReport(
    managers:
        ManagerProfile[],
) {
    console.log('')
    console.log(
        'Rookie Draft Tendencies:',
    )
    console.log('')

    const ranked =
        [...managers]
            .filter(
                (manager) =>
                    manager.totalHistoricalPicks >
                    0,
            )
            .sort(
                (a, b) =>
                    b.rookieDraftRate -
                    a.rookieDraftRate,
            )

    for (
        const manager of
        ranked
    ) {
        const rookiePicks =
            manager.historicalDrafts.filter(
                (pick) =>
                    pick.isRookie ===
                    true,
            )

        const rookieCount =
            rookiePicks.length

        const averageRookieRound =
            rookieCount >
                0
                ? roundNumber(
                    rookiePicks.reduce(
                        (
                            sum,
                            pick,
                        ) =>
                            sum +
                            pick.round,
                        0,
                    ) /
                    rookieCount,
                    2,
                )
                : 0

        const earliestRookie =
            rookiePicks
                .slice()
                .sort(
                    (a, b) =>
                        a.overallPick -
                        b.overallPick,
                )[0]

        const rookiePositions =
            rookiePicks.reduce<
                Record<
                    ManagerPosition,
                    number
                >
            >(
                (
                    counts,
                    pick,
                ) => {
                    counts[
                        pick.position
                    ] +=
                        1

                    return counts
                },
                {
                    QB: 0,
                    RB: 0,
                    WR: 0,
                    TE: 0,
                    K: 0,
                    DST: 0,
                },
            )

        const favoriteRookiePosition =
            (
                Object.entries(
                    rookiePositions,
                ) as [
                    ManagerPosition,
                    number,
                ][]
            )
                .sort(
                    (
                        [, countA],
                        [, countB],
                    ) =>
                        countB -
                        countA,
                )[0]

        console.log(
            `${manager.name}: ` +
            `${rookieCount}/${manager.totalHistoricalPicks} ` +
            `(${roundNumber(
                manager.rookieDraftRate *
                100,
                1,
            )}%) | ` +
            `early=${roundNumber(
                manager.earlyRoundRookieRate *
                100,
                1,
            )}% | ` +
            `avg round=${averageRookieRound} | ` +
            `favorite=${favoriteRookiePosition &&
                favoriteRookiePosition[1] >
                0
                ? favoriteRookiePosition[0]
                : 'none'
            } | ` +
            `earliest=${earliestRookie
                ? `${earliestRookie.player} ` +
                `(${earliestRookie.season}, ` +
                `${earliestRookie.round}.${String(
                    earliestRookie.pickInRound,
                ).padStart(
                    2,
                    '0',
                )})`
                : 'none'
            }`,
        )
    }
}

/*
 * ---------------------------------------------------------
 * MAIN
 * ---------------------------------------------------------
 */

function main() {
    const inputPath =
        path.join(
            process.cwd(),
            'data',
            'manager-history.json',
        )

    if (
        !fs.existsSync(
            inputPath,
        )
    ) {
        throw new Error(
            [
                '',
                'Manager history was not found.',
                '',
                `Expected: ${inputPath}`,
                '',
                'Run first:',
                'npx tsx scripts/buildManagerHistory.ts',
                '',
            ].join(
                '\n',
            ),
        )
    }

    const rawInput =
        fs.readFileSync(
            inputPath,
            'utf8',
        )

    const rawConfig =
        JSON.parse(
            rawInput,
        ) as ManagerImportConfig

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
        `import type { ManagerProfile } from './managerTypes.js'\n\n` +
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

    const totalHistoricalPicks =
        managers.reduce(
            (
                total,
                manager,
            ) =>
                total +
                manager.totalHistoricalPicks,
            0,
        )

    const totalRookiePicks =
        managers.reduce(
            (
                total,
                manager,
            ) =>
                total +
                manager.historicalDrafts.filter(
                    (pick) =>
                        pick.isRookie ===
                        true,
                ).length,
            0,
        )

    console.log('')
    console.log(
        `✅ Manager profiles written to: ${outputPath}`,
    )

    console.log(
        `Managers generated: ${managers.length}`,
    )

    console.log(
        `Historical picks: ${totalHistoricalPicks}`,
    )

    console.log(
        `Historical rookie picks: ${totalRookiePicks}`,
    )

    console.log(
        `Keeper records: ${config.keepers.length}`,
    )

    printRookieReport(
        managers,
    )
}

main()