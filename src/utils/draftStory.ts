import { players } from '../data/players'

export type DraftStoryEvent = {
    type: 'value' | 'reach' | 'run'
    title: string
    description: string
}

type DraftPick = {
    player: string
    manager: string
    pick: number
}

export function generateDraftStory(
    draftHistory: DraftPick[],
): DraftStoryEvent[] {
    const story: DraftStoryEvent[] = []

    draftHistory.forEach((pick) => {
        const player = players.find(
            (item) => item.name === pick.player,
        )

        if (!player) {
            return
        }
        const recentPicks = draftHistory.slice(-5)

        const recentPositions = recentPicks
            .map((pick) => {
                const player = players.find(
                    (item) => item.name === pick.player,
                )

                return player?.position
            })
            .filter(Boolean)

        const positionCounts = {
            QB: recentPositions.filter((position) => position === 'QB').length,
            RB: recentPositions.filter((position) => position === 'RB').length,
            WR: recentPositions.filter((position) => position === 'WR').length,
            TE: recentPositions.filter((position) => position === 'TE').length,
        }

        Object.entries(positionCounts).forEach(([position, count]) => {
            if (count >= 3) {
                story.push({
                    type: 'run',
                    title: `${position} run developing`,
                    description: `${count} ${position}s have been selected in the last ${recentPicks.length} picks.`,
                })
            }
        })
        const hondaDelta = pick.pick - player.rank

        if (hondaDelta >= 2) {
            story.push({
                type: 'value',
                title: `${player.name} was a Honda value`,
                description: `${pick.manager} selected ${player.name} ${Math.round(
                    hondaDelta,
                )} picks later than Honda Rank #${player.rank}.`,
            })
        }

        if (hondaDelta <= -2) {
            story.push({
                type: 'reach',
                title: `${player.name} was a Honda reach`,
                description: `${pick.manager} selected ${player.name} ${Math.abs(
                    Math.round(hondaDelta),
                )} picks earlier than Honda Rank #${player.rank}.`,
            })
        }
    })

    return story
}