import { players } from '../data/players'
import { getManagerNeeds } from './managerNeeds'
import { getManagerDraftScore } from './managerDraftScore'
import type { DraftManager } from '../types/draft'

export function getManagerPrediction(
    manager: DraftManager,
    roster: string[],
    draftedPlayerNames: string[],
) {

    const needs = getManagerNeeds(roster)

    const highNeeds = needs.filter(
        (need) => need.need === 'High',
    )

    const highNeed = highNeeds.sort((a, b) => {
        const aPreference =
            manager.preferredPositions.indexOf(a.position)

        const bPreference =
            manager.preferredPositions.indexOf(b.position)

        return aPreference - bPreference
    })[0]

    if (!highNeed) {
        return null
    }

    const candidates = players
        .filter(
            (player) =>
                player.position === highNeed.position &&
                !draftedPlayerNames.includes(player.name),
        )
        .map((player) => ({
            player,
            score: getManagerDraftScore(player, manager),
        }))
        .sort((a, b) => b.score - a.score)
    const topScore = candidates[0]?.score ?? 0
    const secondScore = candidates[1]?.score ?? 0

    const scoreGap = topScore - secondScore

    const confidence = Math.min(
        98,
        Math.max(55, Math.round(70 + scoreGap * 2)),
    )
    if (candidates.length === 0) {
        return null
    }
    const topPlayer = candidates[0]?.player

    const reasons = [
        `${highNeed.position} is a high roster need`,
        `${manager.tendency} draft tendency`,
    ]

    if (topPlayer) {
        reasons.push(
            `${topPlayer.name} is the highest-rated available ${highNeed.position}`,
        )
    }
    return {
        position: highNeed.position,
        confidence,
        players: candidates.slice(0, 3).map((candidate) => candidate.player),
        reasons,
    }
}