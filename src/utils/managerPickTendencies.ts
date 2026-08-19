import {
    getManagerHistoricalPicks,
} from './managerHistoricalProfile'

export type DraftZone =
    | 'EARLY'
    | 'MIDDLE'
    | 'LATE'

export type ManagerPickZoneTendency = {
    zone: DraftZone
    totalPicks: number
    rookieRate: number
    averageAdpDelta?: number
    positionRates: Record<
        string,
        number
    >
}

export type ManagerPickTendencies = {
    manager: string
    zones: ManagerPickZoneTendency[]
}

function getDraftZone(
    pickInRound: number,
): DraftZone {
    if (
        pickInRound <=
        4
    ) {
        return 'EARLY'
    }

    if (
        pickInRound <=
        8
    ) {
        return 'MIDDLE'
    }

    return 'LATE'
}

export function buildManagerPickTendencies(
    manager: string,
): ManagerPickTendencies {
    const picks =
        getManagerHistoricalPicks(
            manager,
        )

    const zones:
        DraftZone[] = [
            'EARLY',
            'MIDDLE',
            'LATE',
        ]

    const tendencies =
        zones.map(
            (
                zone,
            ): ManagerPickZoneTendency => {
                const zonePicks =
                    picks.filter(
                        (pick) =>
                            getDraftZone(
                                pick.pickInRound,
                            ) ===
                            zone,
                    )

                const positionCounts:
                    Record<
                        string,
                        number
                    > = {}

                for (
                    const pick of
                    zonePicks
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

                const positionRates =
                    Object.fromEntries(
                        Object.entries(
                            positionCounts,
                        ).map(
                            ([
                                position,
                                count,
                            ]) => [
                                position,
                                zonePicks.length >
                                0
                                    ? count /
                                        zonePicks.length
                                    : 0,
                            ],
                        ),
                    )

                const rookiePicks =
                    zonePicks.filter(
                        (pick) =>
                            pick.isRookie ===
                            true,
                    ).length

                const adpDeltas =
                    zonePicks
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
                    zone,

                    totalPicks:
                        zonePicks.length,

                    rookieRate:
                        zonePicks.length >
                        0
                            ? rookiePicks /
                                zonePicks.length
                            : 0,

                    averageAdpDelta,

                    positionRates,
                }
            },
        )

    return {
        manager,
        zones:
            tendencies,
    }
}

export function getManagerPickZoneTendency(
    manager: string,
    pickInRound: number,
) {
    const zone =
        getDraftZone(
            pickInRound,
        )

    return buildManagerPickTendencies(
        manager,
    ).zones.find(
        (item) =>
            item.zone ===
            zone,
    )
}

export function getManagerPickZonePositionRate(
    manager: string,
    pickInRound: number,
    position: string,
) {
    const tendency =
        getManagerPickZoneTendency(
            manager,
            pickInRound,
        )

    return (
        tendency
            ?.positionRates[
                position
            ] ??
        0
    )
}