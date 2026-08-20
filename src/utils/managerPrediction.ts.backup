import { players } from '../data/players'
import { getManagerNeeds } from './managerNeeds'
import { getManagerDraftScore } from './managerDraftScore'
import { rankPlayersForManager } from './managerPlayerPrediction'
import type { DraftManager } from '../types/draft'

type ManagerPredictionContext = {
    round?: number
    pickInRound?: number
    overallPick?: number
}

export function getManagerPrediction(
    manager: DraftManager,
    roster: string[],
    draftedPlayerNames: string[],
    context: ManagerPredictionContext = {},
) {
    const needs =
        getManagerNeeds(roster)

    const availablePlayers =
        players.filter(
            (player) =>
                !draftedPlayerNames.includes(
                    player.name,
                ),
        )

    if (
        availablePlayers.length ===
        0
    ) {
        return null
    }

    const round =
        context.round ?? 1

    const pickInRound =
        context.pickInRound ??
        manager.id

    const overallPick =
        context.overallPick ??
        pickInRound

    const historicalRankings =
        rankPlayersForManager(
            manager.name,
            round,
            pickInRound,
            overallPick,
            availablePlayers.map(
                (player) => ({
                    player:
                        player.name,

                    position:
                        player.position,

                    publicAdp:
                        player.publicAdpOverall,
                }),
            ),
        )

    const historicalByPlayer =
        new Map(
            historicalRankings.map(
                (prediction) => [
                    prediction.player,
                    prediction,
                ],
            ),
        )

    const needByPosition =
        new Map(
            needs.map(
                (need) => [
                    need.position,
                    need.need,
                ],
            ),
        )

    const candidates =
        availablePlayers
            .map((player) => {
                const historical =
                    historicalByPlayer.get(
                        player.name,
                    )

                const draftScore =
                    getManagerDraftScore(
                        player,
                        manager,
                    )

                const need =
                    needByPosition.get(
                        player.position,
                    )

                const needBonus =
                    need === 'High'
                        ? 15
                        : need === 'Medium'
                            ? 8
                            : need === 'Low'
                                ? 2
                                : 0

                const preferenceIndex =
                    manager.preferredPositions.indexOf(
                        player.position,
                    )

                const preferenceBonus =
                    preferenceIndex === 0
                        ? 8
                        : preferenceIndex === 1
                            ? 5
                            : preferenceIndex >= 0
                                ? 2
                                : 0

                const historicalScore =
                    historical?.score ??
                    0

                const combinedScore =
                    historicalScore *
                    0.5 +
                    draftScore *
                    0.3 +
                    needBonus +
                    preferenceBonus

                return {
                    player,
                    historical,
                    historicalScore,
                    combinedScore,
                    need,
                }
            })
            .sort(
                (a, b) =>
                    b.combinedScore -
                    a.combinedScore,
            )

    const topCandidate =
        candidates[0]

    if (
        !topCandidate
    ) {
        return null
    }

    const topPosition =
        topCandidate.player.position

    const positionCandidates =
        candidates.filter(
            (candidate) =>
                candidate.player.position ===
                topPosition,
        )

    const topScore =
        topCandidate.combinedScore

    const secondScore =
        candidates[1]
            ?.combinedScore ??
        topScore

    const scoreGap =
        Math.max(
            0,
            topScore -
            secondScore,
        )

    const historicalConfidence =
        topCandidate.historicalScore

    const confidence =
        Math.min(
            98,
            Math.max(
                50,
                Math.round(
                    historicalConfidence *
                    0.65 +
                    25 +
                    scoreGap,
                ),
            ),
        )

    const reasons: string[] = []

    if (
        topCandidate.need ===
        'High'
    ) {
        reasons.push(
            `${topPosition} is a high roster need`,
        )
    } else if (
        topCandidate.need ===
        'Medium'
    ) {
        reasons.push(
            `${topPosition} is a current roster need`,
        )
    }

    if (
        manager.preferredPositions.includes(
            topPosition,
        )
    ) {
        reasons.push(
            `${topPosition} matches ${manager.name}'s preferred-position profile`,
        )
    }

    if (
        topCandidate.historical
    ) {
        reasons.push(
            ...topCandidate.historical.explanation.reasons,
        )
    }

    if (
        reasons.length ===
        0
    ) {
        reasons.push(
            `${topCandidate.player.name} is the strongest available fit for ${manager.name}`,
        )
    }

    return {
        position:
            topPosition,

        confidence,

        players:
            positionCandidates
                .slice(0, 3)
                .map(
                    (candidate) =>
                        candidate.player,
                ),

        reasons:
            [...new Set(reasons)]
                .slice(0, 5),
    }
}