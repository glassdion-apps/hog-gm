export type ManagerPosition =
    | 'QB'
    | 'RB'
    | 'WR'
    | 'TE'
    | 'K'
    | 'DST'

export type HistoricalDraftPick = {
    season: number

    round: number
    pickInRound: number
    overallPick: number

    player: string
    position: ManagerPosition
    team?: string

    publicAdp?: number
    adpDifference?: number

    wasKeeper?: boolean
}

export type KeeperRecord = {
    season: number

    player: string
    position: ManagerPosition

    keeperRound?: number
    keeperCost?: number

    yearsKept?: number
}

export type PositionDraftRates = {
    QB: number
    RB: number
    WR: number
    TE: number
    K: number
    DST: number
}

export type ManagerRoundProfile = {
    roundStart: number
    roundEnd: number

    positionRates: PositionDraftRates
}

export type ManagerProfile = {
    /*
     * Identity
     */
    id: number
    name: string

    /*
     * Current draft
     */
    draftSlot: number

    tendency: string
    preferredPositions: ManagerPosition[]

    /*
     * Historical data
     */
    historicalDrafts: HistoricalDraftPick[]
    keepers: KeeperRecord[]

    seasonsTracked: number
    totalHistoricalPicks: number

    /*
     * Draft tendencies
     */
    positionRates: PositionDraftRates

    earlyRoundPositionRates: PositionDraftRates

    roundProfiles: ManagerRoundProfile[]

    /*
     * ADP behavior
     *
     * Positive averageAdpReach means the
     * manager tends to take players earlier
     * than market ADP.
     */
    averageAdpReach: number

    reachRate: number
    valueRate: number

    /*
     * Behavioral tendencies
     */
    earlyQbRate: number
    earlyTeRate: number

    rbHeavyRate: number
    wrHeavyRate: number

    /*
     * Keeper behavior
     */
    keeperRate: number

    /*
     * Honda intelligence
     */
    aggressionScore: number
    predictabilityScore: number
}