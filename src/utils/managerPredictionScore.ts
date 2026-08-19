import {
    getManagerHistoricalProfile,
} from './managerHistoricalProfile'

import {
    getManagerRoundPositionRate,
} from './managerRoundTendencies'

import {
    getManagerPickZonePositionRate,
} from './managerPickTendencies'

import {
    getManagerPositionRate,
    getManagerReachRate,
    getManagerRookieRate,
} from './managerHistoricalTendencies'

export type ManagerPredictionInput = {
    manager: string
    round: number
    pickInRound: number
    position: string
    isRookie?: boolean
    publicAdp?: number
    overallPick?: number
}

export type ManagerPredictionScore = {
    manager: string
    score: number
    positionScore: number
    roundScore: number
    draftZoneScore: number
    rookieScore: number
    adpBehaviorScore: number
    sampleSize: number
}

function clamp(
    value: number,
    min: number,
    max: number,
) {
    return Math.max(
        min,
        Math.min(
            max,
            value,
        ),
    )
}

export function scoreManagerPrediction(
    input: ManagerPredictionInput,
): ManagerPredictionScore {
    const profile =
        getManagerHistoricalProfile(
            input.manager,
        )

    const overallPositionRate =
        getManagerPositionRate(
            input.manager,
            input.position,
        )

    const roundPositionRate =
        getManagerRoundPositionRate(
            input.manager,
            input.round,
            input.position,
        )

    const zonePositionRate =
        getManagerPickZonePositionRate(
            input.manager,
            input.pickInRound,
            input.position,
        )

    const rookieRate =
        getManagerRookieRate(
            input.manager,
        )

    const reachRate =
        getManagerReachRate(
            input.manager,
        )

    const positionScore =
        overallPositionRate *
        25

    const roundScore =
        roundPositionRate *
        35

    const draftZoneScore =
        zonePositionRate *
        20

    const rookieScore =
        input.isRookie ===
        true
            ? rookieRate *
                10
            : (
                1 -
                rookieRate
            ) *
                5

    let adpBehaviorScore =
        0

    if (
        typeof input.publicAdp ===
            'number' &&
        typeof input.overallPick ===
            'number'
    ) {
        const playerDelta =
            input.publicAdp -
            input.overallPick

        if (
            playerDelta <
            -8
        ) {
            adpBehaviorScore =
                reachRate *
                10
        } else if (
            playerDelta >
            8
        ) {
            adpBehaviorScore =
                (
                    1 -
                    reachRate
                ) *
                10
        } else {
            adpBehaviorScore =
                5
        }
    }

    const rawScore =
        positionScore +
        roundScore +
        draftZoneScore +
        rookieScore +
        adpBehaviorScore

    const sampleFactor =
        clamp(
            profile.totalPicks /
                90,
            0.35,
            1,
        )

    const score =
        clamp(
            rawScore *
                sampleFactor,
            0,
            100,
        )

    return {
        manager:
            input.manager,

        score,

        positionScore,

        roundScore,

        draftZoneScore,

        rookieScore,

        adpBehaviorScore,

        sampleSize:
            profile.totalPicks,
    }
}