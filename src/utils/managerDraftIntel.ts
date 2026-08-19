import {
    predictManagerPlayerInterest,
    rankPlayersForManager,
} from './managerPlayerPrediction'

export type ManagerDraftIntelPlayer = {
    name: string
    position: string
    publicAdp?: number
    isRookie?: boolean
}

export type ManagerDraftIntelInput = {
    manager: string
    round: number
    pickInRound: number
    overallPick: number
    availablePlayers: ManagerDraftIntelPlayer[]
}

export function getManagerDraftIntel(
    input: ManagerDraftIntelInput,
) {
    const ranked =
        rankPlayersForManager(
            input.manager,
            input.round,
            input.pickInRound,
            input.overallPick,
            input.availablePlayers.map(
                (player) => ({
                    player:
                        player.name,

                    position:
                        player.position,

                    publicAdp:
                        player.publicAdp,

                    isRookie:
                        player.isRookie,
                }),
            ),
        )

    return {
        manager:
            input.manager,

        round:
            input.round,

        pickInRound:
            input.pickInRound,

        overallPick:
            input.overallPick,

        ranked,

        topTargets:
            ranked.slice(
                0,
                5,
            ),

        likelyTarget:
            ranked[0],
    }
}

export function getManagerInterestInPlayer(
    manager: string,
    round: number,
    pickInRound: number,
    overallPick: number,
    player: ManagerDraftIntelPlayer,
) {
    return predictManagerPlayerInterest({
        manager,

        round,

        pickInRound,

        overallPick,

        player:
            player.name,

        position:
            player.position,

        publicAdp:
            player.publicAdp,

        isRookie:
            player.isRookie,
    })
}