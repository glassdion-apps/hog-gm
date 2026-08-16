import { getBestAvailableValue } from './valueEngine'
import { getPositionalScarcity } from './scarcity'
import { getSurvivalChance } from './survival'
import { getManagerSnipeRisk } from './snipeRisk'
import { draftManagers } from '../data/managers'
import { getRosterFitScore } from './rosterFit'
import { getHondaRankings } from './hondaRankings'

export function getHondaDecision(
    draftedPlayerNames: string[],
    currentPickIndex: number,
) {
    const rankings = getHondaRankings(draftedPlayerNames)
    const topRanked = rankings[0]

    if (!topRanked) {
        return null
    }

    const player = topRanked.player

    const bestValue = getBestAvailableValue(draftedPlayerNames)

    if (!bestValue) {
        return null
    }

    const positionalScarcity = getPositionalScarcity(
        draftedPlayerNames,
        player.position,
    )

    const survivalChance = getSurvivalChance(
        currentPickIndex,
        player.publicAdp,
    )

    const managerSnipeRisk = getManagerSnipeRisk(
        currentPickIndex,
        player.position,
        draftManagers,
    )

    const rosterFit = getRosterFitScore(
        draftedPlayerNames,
        player.position,
    )

    const decisionScore =
        bestValue.valueScore +
        rosterFit
    return {
        player,
        decisionScore,
        baseScore: bestValue.baseScore,
        adpBonus: bestValue.adpBonus,
        riskBonus: bestValue.riskBonus,
        hondaEdge: bestValue.hondaEdge,
        positionalScarcity,
        survivalChance,
        managerSnipeRisk,
        rosterFit,
    }
}