import type { ProjectedStats } from '../../utils/fantasyPoints'

export type PlayerPosition =
    | 'QB'
    | 'RB'
    | 'WR'
    | 'TE'
    | 'K'
    | 'DST'

export type Player = {
    /*
     * Existing frontend fields
     */
    rank: number
    name: string
    position: PlayerPosition
    team: string

    tier: string
    score: number
    action: string

    projectedStats?: ProjectedStats

    hondaAdp: string
    publicAdp: string

    hondaAdpOverall: number
    publicAdpOverall: number

    floor: number
    ceiling: number

    risk: 'Low' | 'Medium' | 'High'

    xFactor: string

    greenFlags: string[]
    redFlags: string[]

    /*
     * Projection data
     */
    projectedPoints?: number
    hondaProjectedPoints?: number
    fantasyProsPoints?: number

    /*
     * Imported FantasyPros data
     */
    fantasyProsRank?: number | null
    fantasyProsTier?: number | null
    positionRank?: string | null

    upside?: string | null
    bust?: string | null

    strengthOfSchedule?: string | null
    ecrVsAdp?: number | null

    /*
     * Honda value model
     */
    replacementPoints?: number
    valueOverReplacement?: number

    hondaPositionRank?: number
    vorRank?: number
    hondaOverallRank?: number
    hondaDraftRank?: number

    estimatedMarketAdp?: number | null
    draftValueGap?: number | null
    marketLabel?: string

    /*
     * Draft projection
     */
    projectedRound?: number
    projectedPickInRound?: number
    projectedDraftSlot?: string

    /*
     * Misc
     */
    byeWeek?: number | null
    age?: number
}