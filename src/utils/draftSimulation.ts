import type { Player } from '../data/players/types'
import type { DraftManager } from '../types/draft'
import { getManagerPrediction } from './managerPrediction'

export type PlayerSurvivalResult = {
    player: Player
    available: number
    survived: number
    survivalRate: number
}

export type SimulatedManagerPick = {
    manager: DraftManager
    round: number
    pickInRound: number
    overallPick: number
}

type ManagerAwareSimulationContext = {
    upcomingPicks: SimulatedManagerPick[]
    managerRosters: Record<string, string[]>
    draftedPlayerNames: string[]
}

function ratingOutOfFive(
    value: string | null | undefined,
) {
    if (!value) {
        return 0
    }

    const match =
        value.match(/\d+/)

    if (!match) {
        return 0
    }

    const rating =
        Number(match[0])

    return Number.isFinite(rating)
        ? rating
        : 0
}

export function getOpponentDraftScore(
    player: Player,
) {
    const hondaRank =
        player.hondaDraftRank ??
        player.rank ??
        999

    const fantasyProsRank =
        player.fantasyProsRank ??
        player.publicAdpOverall ??
        999

    const tier =
        player.fantasyProsTier ??
        20

    const upside =
        ratingOutOfFive(
            player.upside,
        )

    const bust =
        ratingOutOfFive(
            player.bust,
        )

    const hondaPressure =
        Math.max(
            0,
            300 - hondaRank,
        )

    const marketPressure =
        Math.max(
            0,
            300 - fantasyProsRank,
        )

    const tierPressure =
        Math.max(
            0,
            15 - tier,
        ) * 3

    const upsidePressure =
        upside * 2

    const bustPenalty =
        bust * 1.5

    return Number(
        (
            hondaPressure * 0.4 +
            marketPressure * 0.6 +
            tierPressure +
            upsidePressure -
            bustPenalty
        ).toFixed(2),
    )
}

function createSeededRandom(
    seed: number,
) {
    let state =
        seed >>> 0

    return () => {
        state =
            (
                state * 1664525 +
                1013904223
            ) >>> 0

        return (
            state /
            4294967296
        )
    }
}

export function simulateOpponentPicks(
    players: Player[],
    numberOfPicks: number,
    seed: number,
) {
    if (numberOfPicks <= 0) {
        return {
            draftedPlayers:
                [] as Player[],

            remainingPlayers:
                [...players],
        }
    }

    let remainingPlayers =
        [...players]

    const draftedPlayers:
        Player[] = []

    const random =
        createSeededRandom(
            seed +
            players.length * 31 +
            numberOfPicks * 17,
        )

    for (
        let pickIndex = 0;
        pickIndex < numberOfPicks;
        pickIndex++
    ) {
        if (
            remainingPlayers.length ===
            0
        ) {
            break
        }

        const marketBoard =
            [...remainingPlayers]
                .sort(
                    (a, b) =>
                        getOpponentDraftScore(
                            b,
                        ) -
                        getOpponentDraftScore(
                            a,
                        ),
                )

        const draftWindow =
            marketBoard.slice(
                0,
                Math.min(
                    6,
                    marketBoard.length,
                ),
            )

        if (
            draftWindow.length ===
            0
        ) {
            break
        }

        const roll =
            random()

        const selectedIndex =
            Math.min(
                draftWindow.length - 1,
                Math.floor(
                    roll *
                    roll *
                    draftWindow.length,
                ),
            )

        const selectedPlayer =
            draftWindow[
            selectedIndex
            ]

        if (!selectedPlayer) {
            break
        }

        draftedPlayers.push(
            selectedPlayer,
        )

        remainingPlayers =
            remainingPlayers.filter(
                (player) =>
                    player.name !==
                    selectedPlayer.name,
            )
    }

    return {
        draftedPlayers,
        remainingPlayers,
    }
}

function simulateManagerAwarePicks(
    players: Player[],
    context:
        ManagerAwareSimulationContext,
    seed: number,
) {
    let remainingPlayers =
        [...players]

    const draftedPlayers:
        Player[] = []

    const simulatedRosters:
        Record<string, string[]> =
        Object.fromEntries(
            Object.entries(
                context.managerRosters,
            ).map(
                ([
                    manager,
                    roster,
                ]) => [
                        manager,
                        [...roster],
                    ],
            ),
        )

    const simulatedDraftedNames =
        new Set(
            context.draftedPlayerNames,
        )

    const random =
        createSeededRandom(
            seed +
            players.length * 31 +
            context.upcomingPicks.length *
            17,
        )

    for (
        const upcoming of
        context.upcomingPicks
    ) {
        if (
            remainingPlayers.length ===
            0
        ) {
            break
        }

        const prediction =
            getManagerPrediction(
                upcoming.manager,
                simulatedRosters[
                upcoming.manager.name
                ] ?? [],
                [
                    ...simulatedDraftedNames,
                ],
                {
                    round:
                        upcoming.round,

                    pickInRound:
                        upcoming.pickInRound,

                    overallPick:
                        upcoming.overallPick,
                },
            )

        const predictedNames =
            new Set(
                prediction?.players.map(
                    (player) =>
                        player.name,
                ) ?? [],
            )

        const managerBoard =
            [...remainingPlayers]
                .map((player) => {
                    const predictionIndex =
                        prediction?.players.findIndex(
                            (
                                predictedPlayer,
                            ) =>
                                predictedPlayer.name ===
                                player.name,
                        ) ?? -1

                    const predictionBonus =
                        predictionIndex === 0
                            ? 80
                            : predictionIndex === 1
                                ? 50
                                : predictionIndex === 2
                                    ? 30
                                    : 0

                    return {
                        player,

                        score:
                            getOpponentDraftScore(
                                player,
                            ) +
                            predictionBonus,
                    }
                })
                .sort(
                    (a, b) =>
                        b.score -
                        a.score,
                )

        const preferredWindow =
            managerBoard.filter(
                ({ player }) =>
                    predictedNames.has(
                        player.name,
                    ),
            )

        const draftWindow =
            (
                preferredWindow.length >
                    0
                    ? [
                        ...preferredWindow,
                        ...managerBoard.filter(
                            ({ player }) =>
                                !predictedNames.has(
                                    player.name,
                                ),
                        ),
                    ]
                    : managerBoard
            ).slice(
                0,
                Math.min(
                    6,
                    managerBoard.length,
                ),
            )

        if (
            draftWindow.length ===
            0
        ) {
            break
        }

        const roll =
            random()

        const selectedIndex =
            Math.min(
                draftWindow.length - 1,
                Math.floor(
                    roll *
                    roll *
                    draftWindow.length,
                ),
            )

        const selectedPlayer =
            draftWindow[
                selectedIndex
            ]?.player

        if (!selectedPlayer) {
            break
        }

        draftedPlayers.push(
            selectedPlayer,
        )

        simulatedDraftedNames.add(
            selectedPlayer.name,
        )

        simulatedRosters[
            upcoming.manager.name
        ] = [
                ...(
                    simulatedRosters[
                    upcoming.manager.name
                    ] ?? []
                ),
                selectedPlayer.name,
            ]

        remainingPlayers =
            remainingPlayers.filter(
                (player) =>
                    player.name !==
                    selectedPlayer.name,
            )
    }

    return {
        draftedPlayers,
        remainingPlayers,
    }
}

export function simulateNextPickAvailability(
    availablePlayers: Player[],
    picksUntilNext: number,
    simulationCount = 100,
    context?:
        ManagerAwareSimulationContext,
): PlayerSurvivalResult[] {
    const results =
        new Map<
            string,
            {
                player: Player
                available: number
                survived: number
            }
        >()

    for (
        const player of
        availablePlayers
    ) {
        results.set(
            player.name,
            {
                player,
                available: 0,
                survived: 0,
            },
        )
    }

    for (
        let simulation = 1;
        simulation <=
        simulationCount;
        simulation++
    ) {
        for (
            const player of
            availablePlayers
        ) {
            const result =
                results.get(
                    player.name,
                )

            if (result) {
                result.available += 1
            }
        }

        const simulationResult =
            context
                ? simulateManagerAwarePicks(
                    availablePlayers,
                    context,
                    simulation,
                )
                : simulateOpponentPicks(
                    availablePlayers,
                    picksUntilNext,
                    simulation,
                )

        const survivingNames =
            new Set(
                simulationResult
                    .remainingPlayers
                    .map(
                        (player) =>
                            player.name,
                    ),
            )

        for (
            const playerName of
            survivingNames
        ) {
            const result =
                results.get(
                    playerName,
                )

            if (result) {
                result.survived += 1
            }
        }
    }

    return [
        ...results.values(),
    ].map(
        ({
            player,
            available,
            survived,
        }) => ({
            player,
            available,
            survived,

            survivalRate:
                available > 0
                    ? survived /
                    available
                    : 0,
        }),
    )
}