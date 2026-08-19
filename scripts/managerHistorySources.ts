import path from 'node:path'

export type HistoricalLeagueSeason = {
    season: number

    /*
     * Saved CBS completed draft-results page.
     */
    draftFile?: string

    /*
     * Optional preseason board/source.
     *
     * We are not using this yet for the
     * historical seasons because 2026 will
     * be the first keeper-affected draft.
     */
    boardFile?: string

    /*
     * True only when keepers actually
     * affected that season's draft.
     *
     * 2025 created the first keeper pool.
     * Therefore 2026 will be the first
     * keeper-affected draft.
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
         * It can be added later without
         * changing the importer.
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
            usesKeepers: false,
        },

        {
            /*
             * 2025 created the first keeper pool.
             *
             * The 2025 draft itself was still
             * a normal draft with no keeper
             * draft slots removed.
             *
             * The 2026 draft will be the first
             * draft affected by keepers.
             */
            season: 2025,
            draftFile:
                historyFile(
                    'Honda on Grand - CBSSports.com.mhtml',
                ),
            usesKeepers: false,
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