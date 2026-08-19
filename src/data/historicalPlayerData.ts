import historicalPlayerDataJson from './historical-player-data.json'

export type HistoricalPlayerRecord = {
    season: number
    player: string
    position: string
    team?: string
    publicAdp?: number
    isRookie: boolean
}

export type HistoricalPlayerDataFile = {
    generatedAt: string
    seasons: number[]
    records: HistoricalPlayerRecord[]
}

const historicalPlayerData =
    historicalPlayerDataJson as HistoricalPlayerDataFile

export const historicalPlayerRecords =
    historicalPlayerData.records

export const historicalPlayerSeasons =
    historicalPlayerData.seasons

export const historicalPlayerDataGeneratedAt =
    historicalPlayerData.generatedAt

export function makeHistoricalPlayerKey(
    season: number,
    player: string,
) {
    return (
        `${season}:` +
        player
            .toLowerCase()
            .trim()
            .replace(
                /[’']/g,
                '',
            )
            .replace(
                /\./g,
                '',
            )
            .replace(
                /-/g,
                ' ',
            )
            .replace(
                /\b(jr|sr|ii|iii|iv|v)\b/g,
                '',
            )
            .replace(
                /\s+/g,
                ' ',
            )
            .trim()
    )
}

export function createHistoricalPlayerIndex(
    records:
        HistoricalPlayerRecord[],
) {
    const index =
        new Map<
            string,
            HistoricalPlayerRecord
        >()

    for (
        const record of
        records
    ) {
        index.set(
            makeHistoricalPlayerKey(
                record.season,
                record.player,
            ),
            record,
        )
    }

    return index
}

export const historicalPlayerIndex =
    createHistoricalPlayerIndex(
        historicalPlayerRecords,
    )

export function getHistoricalPlayersForSeason(
    season: number,
) {
    return historicalPlayerRecords.filter(
        (record) =>
            record.season ===
            season,
    )
}

export function getHistoricalPlayer(
    season: number,
    player: string,
) {
    return historicalPlayerIndex.get(
        makeHistoricalPlayerKey(
            season,
            player,
        ),
    )
}