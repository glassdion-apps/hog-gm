import { players } from '../data/players'

export function getBestAvailableValue(
    draftedPlayerNames: string[],
    targetPlayerName?: string,
) {
    const availablePlayers = players.filter(
        (player) =>
            !draftedPlayerNames.includes(player.name) &&
            (
                !targetPlayerName ||
                player.name === targetPlayerName
            ),
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

        const publicRank =
            player.fantasyProsRank ??
            player.publicAdpOverall ??
            player.rank

        const hondaRank =
            player.hondaDraftRank ??
            player.rank

        const rawHondaEdge =
            publicRank - hondaRank

        const hondaEdge =
            Math.max(
                -10,
                Math.min(
                    10,
                    rawHondaEdge * 0.5,
                ),
            )

        const hondaRankValue =
            Math.max(
                0,
                100 -
                (hondaRank - 1) * 0.5,
            )

        const vorBonus =
            Math.max(
                -10,
                Math.min(
                    20,
                    (player.valueOverReplacement ?? 0) / 10,
                ),
            )

        const riskBonus =
            player.risk === 'Low'
                ? 3
                : player.risk === 'Medium'
                    ? 1
                    : 0

        const valueScore =
            hondaRankValue +
            vorBonus +
            adpValue +
            hondaEdge +
            riskBonus

        return {
            player,
            valueScore,
            baseScore: hondaRankValue + vorBonus,
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