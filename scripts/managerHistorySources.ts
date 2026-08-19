import path from 'node:path'

export type HistoricalLeagueSeason = {
    season: number

    /*
     * Saved CBS draft-results page.
     */
    draftFile?: string

    /*
     * Optional board screenshot/export source.
     * We will use this primarily for keeper
     * identification when available.
     */
    boardFile?: string

    /*
     * Keeper league began in 2024.
     */
    usesKeepers: boolean
}

const historyDirectory =
    path.join(
        process.cwd(),
        'data',
        'cbs-history',
    )

function historyFile(
    filename: string,
) {
    return path.join(
        historyDirectory,
        filename,
    )
}

export const historicalLeagueSeasons:
    HistoricalLeagueSeason[] = [
        {
            season: 2018,
            draftFile:
                historyFile(
                    'Honda on Grand 2018 - CBSSports.com.mhtml',
                ),
            usesKeepers: false,
        },

        {
            season: 2019,
            draftFile:
                historyFile(
                    'Honda on Grand 2019 - CBSSports.com.mhtml',
                ),
            usesKeepers: false,
        },

        /*
         * No 2020 source currently loaded.
         * We can add it later without changing
         * the importer.
         */

        {
            season: 2021,
            draftFile:
                historyFile(
                    'Honda on Grand 2021.mhtml',
                ),
            usesKeepers: false,
        },

        {
            season: 2022,
            draftFile:
                historyFile(
                    'Honda on Grand 2022- CBSSports.com.mhtml',
                ),
            usesKeepers: false,
        },

        {
            season: 2023,
            draftFile:
                historyFile(
                    'Honda on Grand 2023- CBSSports.com.mhtml',
                ),
            usesKeepers: false,
        },

        {
            season: 2024,
            draftFile:
                historyFile(
                    'Honda on Grand 2024  - CBSSports.com.mhtml',
                ),
            usesKeepers: true,
        },

        {
            season: 2025,
            draftFile:
                historyFile(
                    'Honda on Grand - CBSSports.com.mhtml',
                ),
            usesKeepers: true,
        },
    ]

export function getHistoricalSeason(
    season: number,
) {
    return (
        historicalLeagueSeasons.find(
            (entry) =>
                entry.season === season,
        ) ??
        null
    )
}

export function getKeeperSeasons() {
    return historicalLeagueSeasons
        .filter(
            (entry) =>
                entry.usesKeepers,
        )
        .map(
            (entry) =>
                entry.season,
        )
}

export function isKeeperSeason(
    season: number,
) {
    return (
        getHistoricalSeason(
            season,
        )?.usesKeepers ??
        false
    )
}