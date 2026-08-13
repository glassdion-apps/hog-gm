import { players } from '../data/players'

export function getBestAvailableValue(
    draftedPlayerNames: string[],
) {
    const availablePlayers = players.filter(
        (player) => !draftedPlayerNames.includes(player.name),
    )

    if (availablePlayers.length === 0) {
        return null
    }

    const scoredPlayers = availablePlayers.map((player) => {
        const adpNumber = Number(
            player.publicAdp
                .replace('Round ', '')
                .replace(/[^\d.]/g, ''),
        )

        const adpValue =
            Number.isNaN(adpNumber) || adpNumber === 0
                ? 0
                : Math.max(0, 10 - adpNumber)

        const publicAdpNumber = Number(
            player.publicAdp.replace(/[^\d.]/g, ''),
        )

        const hondaEdge =
            Number.isNaN(publicAdpNumber)
                ? 0
                : publicAdpNumber - player.rank

        const valueScore =
            player.score +
            adpValue +
            hondaEdge +
            (player.risk === 'Low' ? 3 : 0) +
            (player.risk === 'Medium' ? 1 : 0)

        return {
            player,
            valueScore,
            baseScore: player.score,
            adpBonus: adpValue,
            hondaEdge,
            riskBonus:
                player.risk === 'Low'
                    ? 3
                    : player.risk === 'Medium'
                        ? 1
                        : 0,
        }
    })

    scoredPlayers.sort(
        (a, b) => b.valueScore - a.valueScore,
    )

    return scoredPlayers[0]
}