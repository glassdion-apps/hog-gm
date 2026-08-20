import {
    getManagerHistoricalProfile,
    type ManagerHistoricalProfile,
} from './managerHistoricalProfile'

export type PositionTendency = {
    position: string
    picks: number
    rate: number
}

export type ManagerHistoricalTendencies = {
    manager: string
    totalPicks: number
    seasons: number[]
    averageAdpDelta?: number
    rookieRate: number
    reachesRate: number
    valuesRate: number
    neutralRate: number
    positionTendencies: PositionTendency[]
    favoritePosition?: string
}

const REACH_THRESHOLD =
    -8

const VALUE_THRESHOLD =
    8

function buildPositionTendencies(
    profile: ManagerHistoricalProfile,
): PositionTendency[] {
    if (
        profile.totalPicks ===
        0
    ) {
        return []
    }

    return Object.entries(
        profile.positionCounts,
    )
        .map(
            ([
                position,
                picks,
            ]) => ({
                position,
                picks,
                rate:
                    picks /
                    profile.totalPicks,
            }),
        )
        .sort(
            (a, b) =>
                b.picks -
                    a.picks ||
                a.position.localeCompare(
                    b.position,
                ),
        )
}

const managerTendenciesCache =
    new Map<string, ManagerHistoricalTendencies>()

export function buildManagerHistoricalTendencies(
    manager: string,
): ManagerHistoricalTendencies {
    const cached = managerTendenciesCache.get(manager)

    if (cached) {
        return cached
    }

    const profile =
        getManagerHistoricalProfile(
            manager,
        )

    const picksWithAdp =
        profile.picks.filter(
            (pick) =>
                typeof pick.adpDelta ===
                'number',
        )

    let reaches =
        0

    let values =
        0

    let neutral =
        0

    for (
        const pick of
        picksWithAdp
    ) {
        const delta =
            pick.adpDelta

        if (
            typeof delta !==
            'number'
        ) {
            continue
        }

        if (
            delta <=
            REACH_THRESHOLD
        ) {
            reaches +=
                1

            continue
        }

        if (
            delta >=
            VALUE_THRESHOLD
        ) {
            values +=
                1

            continue
        }

        neutral +=
            1
    }

    const denominator =
        picksWithAdp.length

    const positionTendencies =
        buildPositionTendencies(
            profile,
        )

    const tendencies: ManagerHistoricalTendencies = {
        manager:
            profile.manager,

        totalPicks:
            profile.totalPicks,

        seasons:
            profile.seasons,

        averageAdpDelta:
            profile.averageAdpDelta,

        rookieRate:
            profile.rookieRate,

        reachesRate:
            denominator >
            0
                ? reaches /
                    denominator
                : 0,

        valuesRate:
            denominator >
            0
                ? values /
                    denominator
                : 0,

        neutralRate:
            denominator >
            0
                ? neutral /
                    denominator
                : 0,

        positionTendencies,

        favoritePosition:
            positionTendencies[0]
                ?.position,
    }

    managerTendenciesCache.set(
        manager,
        tendencies,
    )

    return tendencies
}

export function getManagerPositionRate(
    manager: string,
    position: string,
) {
    const tendencies =
        buildManagerHistoricalTendencies(
            manager,
        )

    return (
        tendencies.positionTendencies.find(
            (item) =>
                item.position ===
                position,
        )?.rate ??
        0
    )
}

export function getManagerReachRate(
    manager: string,
) {
    return buildManagerHistoricalTendencies(
        manager,
    ).reachesRate
}

export function getManagerValueRate(
    manager: string,
) {
    return buildManagerHistoricalTendencies(
        manager,
    ).valuesRate
}

export function getManagerRookieRate(
    manager: string,
) {
    return buildManagerHistoricalTendencies(
        manager,
    ).rookieRate
}