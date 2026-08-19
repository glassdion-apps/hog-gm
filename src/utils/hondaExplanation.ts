type ExplanationInput = {
    action: string
    survivalChance: number
    managerSnipeRisk: string
    managerThreatScore: number
    managerThreatBonus: number
    positionalScarcity: string
    rosterFit: number
    hondaEdge: number
    recommendedPlayer: string

    liveThreats: {
        manager: string
        position: string
        confidence: number
        player: string
    }[]
}

export function getHondaExplanation({
    action,
    survivalChance,
    managerSnipeRisk,
    managerThreatScore,
    managerThreatBonus,
    positionalScarcity,
    rosterFit,
    hondaEdge,
    recommendedPlayer,
    liveThreats,
}: ExplanationInput) {
    const bullets: string[] = []

    const seriousThreats = liveThreats.filter(
        (threat) => threat.confidence >= 80,
    )

    const recommendationThreats = seriousThreats.filter(
        (threat) => threat.player === recommendedPlayer,
    )
    if (
        recommendationThreats.length === 0 &&
        managerThreatScore >= 0.65
    ) {
        bullets.push(
            `Managers drafting before your next turn show strong historical interest in ${recommendedPlayer}'s position (+${managerThreatBonus.toFixed(1)} urgency adjustment).`,
        )
    } else if (
        recommendationThreats.length === 0 &&
        managerThreatScore >= 0.4
    ) {
        bullets.push(
            `Upcoming managers create meaningful pressure at ${recommendedPlayer}'s position (+${managerThreatBonus.toFixed(1)} urgency adjustment).`,
        )
    }

    if (survivalChance < 25) {
        bullets.push(
            `Only a ${survivalChance}% chance ${recommendedPlayer} reaches your next pick.`,
        )
    } else if (survivalChance < 50) {
        bullets.push(
            `${recommendedPlayer} has a ${survivalChance}% chance of surviving to your next selection.`,
        )
    } else {
        bullets.push(
            `${recommendedPlayer} has a ${survivalChance}% estimated chance of remaining available.`,
        )
    }

    if (recommendationThreats.length > 0) {
        recommendationThreats.forEach((threat) => {
            bullets.push(
                `${threat.manager} is ${threat.confidence}% likely to target ${threat.position} and is projected to select ${recommendedPlayer}.`,
            )
        })
    } else if (seriousThreats.length > 0) {
        bullets.push(
            `Immediate manager threats currently appear focused on other players.`,
        )
    }

    if (positionalScarcity === 'Critical') {
        bullets.push(
            'A positional tier break is approaching.',
        )
    }

    if (rosterFit >= 6) {
        bullets.push(
            `This improves your roster construction (+${rosterFit.toFixed(1)}).`,
        )
    }

    if (hondaEdge > 0) {
        bullets.push(
            `Honda identifies an additional value edge (+${hondaEdge.toFixed(1)}).`,
        )
    }

    const veryHighUrgency =
        survivalChance < 25 ||
        recommendationThreats.length >= 2

    const highUrgency =
        survivalChance < 50 ||
        recommendationThreats.length === 1 ||
        (
            managerSnipeRisk === 'Very High' &&
            positionalScarcity === 'Critical'
        )

    return {
        title: `Recommendation: ${action}`,
        urgency: veryHighUrgency
            ? 'VERY HIGH'
            : highUrgency
                ? 'HIGH'
                : 'MODERATE',
        bullets,
    }
}