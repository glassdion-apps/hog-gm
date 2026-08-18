import type { ProjectedStats } from '../../utils/fantasyPoints'

export type PlayerPosition =
    | 'QB'
    | 'RB'
    | 'WR'
    | 'TE'
    | 'K'
    | 'DST'

export type Player = {
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

    projectedPoints?: number
    byeWeek?: number
    age?: number
}