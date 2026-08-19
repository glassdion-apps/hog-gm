import type {
    ManagerPredictionScore,
} from './managerPredictionScore'

export type ManagerPredictionExplanation = {
    summary: string
    reasons: string[]
}


export function explainManagerPrediction(
    breakdown: ManagerPredictionScore,
): ManagerPredictionExplanation {
    const reasons: string[] = []

    if (
        breakdown.roundScore >=
        20
    ) {
        reasons.push(
            'Strong historical position preference in this round.',
        )
    }

    if (
        breakdown.draftZoneScore >=
        12
    ) {
        reasons.push(
            'This position fits the manager’s historical draft-slot behavior.',
        )
    }

    if (
        breakdown.positionScore >=
        12
    ) {
        reasons.push(
            'The manager drafts this position frequently overall.',
        )
    }

    if (
        breakdown.rookieScore >=
        6
    ) {
        reasons.push(
            'The player fits the manager’s historical rookie tendency.',
        )
    }

    if (
        breakdown.adpBehaviorScore >=
        6
    ) {
        reasons.push(
            'The pick fits the manager’s historical ADP behavior.',
        )
    }

    if (
        reasons.length ===
        0
    ) {
        reasons.push(
            'Historical signals are mixed or weak for this player.',
        )
    }

    const summary =
        `Historical interest score ${Math.round(
            breakdown.score,
        )}/100 across ${breakdown.sampleSize} prior picks.`

    return {
        summary,
        reasons,
    }
}