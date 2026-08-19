export function getDraftRound(
    pickIndex: number,
    managerCount: number,
) {
    if (
        managerCount <= 0
    ) {
        return 1
    }

    return (
        Math.floor(
            pickIndex /
                managerCount,
        ) + 1
    )
}

export function getPickInRound(
    pickIndex: number,
    managerCount: number,
) {
    if (
        managerCount <= 0
    ) {
        return 1
    }

    return (
        (
            pickIndex %
            managerCount
        ) + 1
    )
}

export function getSnakeManagerIndex(
    pickIndex: number,
    managerCount: number,
) {
    if (
        managerCount <= 0
    ) {
        return 0
    }

    const round =
        getDraftRound(
            pickIndex,
            managerCount,
        )

    const positionInRound =
        pickIndex %
        managerCount

    const isOddRound =
        round %
            2 ===
        1

    if (
        isOddRound
    ) {
        return positionInRound
    }

    return (
        managerCount -
        1 -
        positionInRound
    )
}

export function getSnakeManagerAtPick<
    T,
>(
    managers: T[],
    pickIndex: number,
) {
    if (
        managers.length ===
        0
    ) {
        return undefined
    }

    return managers[
        getSnakeManagerIndex(
            pickIndex,
            managers.length,
        )
    ]
}

export function getUpcomingSnakePicks<
    T,
>(
    managers: T[],
    currentPickIndex: number,
    count: number,
) {
    const upcoming: Array<{
        manager: T
        pickIndex: number
        overallPick: number
        round: number
        pickInRound: number
        managerIndex: number
    }> = []

    if (
        managers.length ===
            0 ||
        count <=
            0
    ) {
        return upcoming
    }

    for (
        let offset = 1;
        offset <= count;
        offset += 1
    ) {
        const pickIndex =
            currentPickIndex +
            offset

        const managerIndex =
            getSnakeManagerIndex(
                pickIndex,
                managers.length,
            )

        const manager =
            managers[
                managerIndex
            ]

        if (
            !manager
        ) {
            continue
        }

        upcoming.push({
            manager,

            pickIndex,

            overallPick:
                pickIndex +
                1,

            round:
                getDraftRound(
                    pickIndex,
                    managers.length,
                ),

            pickInRound:
                getPickInRound(
                    pickIndex,
                    managers.length,
                ),

            managerIndex,
        })
    }

    return upcoming
}