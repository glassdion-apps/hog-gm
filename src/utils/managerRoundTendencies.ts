import {
    getManagerHistoricalPicks,
} from './managerHistoricalProfile'

export type ManagerRoundPositionTendency = {
    position: string
    picks: number
    rate: number
}

export type ManagerRoundTendency = {
    round: number
    totalPicks: number
    rookiePicks: number
    rookieRate: number
    averageAdpDelta?: number
    positions: ManagerRoundPositionTendency[]
    favoritePosition?: string
}

export type ManagerRoundTendencies = {
    manager: string
    rounds: ManagerRoundTendency[]
}

export function buildManagerRoundTendencies(
    manager: string,
): ManagerRoundTendencies {
    const picks =
        getManagerHistoricalPicks(
            manager,
        )

    const roundNumbers =
        Array.from(
            new Set(
                picks.map(
                    (pick) =>
                        pick.round,
                ),
            ),
        ).sort(
            (a, b) =>
                a - b,
        )

    const rounds =
        roundNumbers.map(
            (
                round,
            ): ManagerRoundTendency => {
                const roundPicks =
                    picks.filter(
                        (pick) =>
                            pick.round ===
                            round,
                    )

                const positionCounts:
                    Record<
                        string,
                        number
                    > = {}

                for (
                    const pick of
                    roundPicks
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

                const positions =
                    Object.entries(
                        positionCounts,
                    )
                        .map(
                            ([
                                position,
                                count,
                            ]) => ({
                                position,
                                picks:
                                    count,
                                rate:
                                    roundPicks.length >
                                    0
                                        ? count /
                                            roundPicks.length
                                        : 0,
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

                const rookiePicks =
                    roundPicks.filter(
                        (pick) =>
                            pick.isRookie ===
                            true,
                    ).length

                const adpDeltas =
                    roundPicks
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

                return {
                    round,

                    totalPicks:
                        roundPicks.length,

                    rookiePicks,

                    rookieRate:
                        roundPicks.length >
                        0
                            ? rookiePicks /
                                roundPicks.length
                            : 0,

                    averageAdpDelta,

                    positions,

                    favoritePosition:
                        positions[0]
                            ?.position,
                }
            },
        )

    return {
        manager,
        rounds,
    }
}

export function getManagerRoundTendency(
    manager: string,
    round: number,
) {
    return buildManagerRoundTendencies(
        manager,
    ).rounds.find(
        (item) =>
            item.round ===
            round,
    )
}

export function getManagerRoundPositionRate(
    manager: string,
    round: number,
    position: string,
) {
    const tendency =
        getManagerRoundTendency(
            manager,
            round,
        )

    return (
        tendency?.positions.find(
            (item) =>
                item.position ===
                position,
        )?.rate ??
        0
    )
}
