import managerHistoryJson from '../data/manager-history.json'
import {
    getHistoricalPlayer,
    type HistoricalPlayerRecord,
} from '../data/historicalPlayerData'

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

export type EnrichedManagerPick =
    HistoricalManagerPick & {
        historicalPlayer?: HistoricalPlayerRecord
        adpDelta?: number
    }

export type ManagerHistoricalProfile = {
    manager: string
    picks: EnrichedManagerPick[]
    seasons: number[]
    totalPicks: number
    picksWithAdp: number
    averageAdpDelta?: number
    rookiePicks: number
    rookieRate: number
    positionCounts: Record<string, number>
}

const managerHistory =
    managerHistoryJson as ManagerHistoryFile

function enrichPick(
    pick: HistoricalManagerPick,
): EnrichedManagerPick {
    const historicalPlayer =
        getHistoricalPlayer(
            pick.season,
            pick.player,
        )

    const publicAdp =
        historicalPlayer?.publicAdp ??
        pick.publicAdp

    const adpDelta =
        typeof publicAdp === 'number'
            ? publicAdp - pick.overallPick
            : undefined

    return {
        ...pick,
        historicalPlayer,
        publicAdp,
        isRookie:
            historicalPlayer?.isRookie ??
            pick.isRookie,
        adpDelta,
    }
}

export function getManagerHistoricalPicks(
    manager: string,
) {
    return managerHistory.historicalPicks
        .filter(
            (pick) =>
                pick.manager ===
                manager,
        )
        .map(
            enrichPick,
        )
}

export function buildManagerHistoricalProfile(
    manager: string,
): ManagerHistoricalProfile {
    const picks =
        getManagerHistoricalPicks(
            manager,
        )

    const seasons =
        Array.from(
            new Set(
                picks.map(
                    (pick) =>
                        pick.season,
                ),
            ),
        ).sort(
            (a, b) =>
                a - b,
        )

    const picksWithAdp =
        picks.filter(
            (pick) =>
                typeof pick.publicAdp ===
                'number',
        )

    const adpDeltas =
        picks
            .map(
                (pick) =>
                    pick.adpDelta,
            )
            .filter(
                (
                    value,
                ): value is number =>
                    typeof value ===
                    'number',
            )

    const averageAdpDelta =
        adpDeltas.length >
        0
            ? adpDeltas.reduce(
                (
                    total,
                    value,
                ) =>
                    total +
                    value,
                0,
            ) /
            adpDeltas.length
            : undefined

    const rookiePicks =
        picks.filter(
            (pick) =>
                pick.isRookie ===
                true,
        ).length

    const positionCounts:
        Record<
            string,
            number
        > = {}

    for (
        const pick of
        picks
    ) {
        const position =
            pick.position ||
            'UNKNOWN'

        positionCounts[
            position
        ] =
            (
                positionCounts[
                    position
                ] ??
                0
            ) +
            1
    }

    return {
        manager,
        picks,
        seasons,
        totalPicks:
            picks.length,
        picksWithAdp:
            picksWithAdp.length,
        averageAdpDelta,
        rookiePicks,
        rookieRate:
            picks.length >
            0
                ? rookiePicks /
                picks.length
                : 0,
        positionCounts,
    }
}

export const managerHistoricalProfiles =
    Object.fromEntries(
        managerHistory.managerNames.map(
            (manager) => [
                manager,
                buildManagerHistoricalProfile(
                    manager,
                ),
            ],
        ),
    ) as Record<
        string,
        ManagerHistoricalProfile
    >

export function getManagerHistoricalProfile(
    manager: string,
) {
    return (
        managerHistoricalProfiles[
            manager
        ] ??
        buildManagerHistoricalProfile(
            manager,
        )
    )
}