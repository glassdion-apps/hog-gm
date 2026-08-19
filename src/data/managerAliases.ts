export type ManagerIdentity = {
    id: string

    /*
     * Name Honda should use for the
     * current version of this manager.
     */
    canonicalName: string

    /*
     * Every historical team name known
     * to belong to this same person.
     *
     * Keep canonicalName in this list too.
     */
    aliases: string[]

    /*
     * Former managers remain separate
     * identities so their historical picks
     * do not get assigned to replacement
     * managers.
     */
    isFormerManager?: boolean
}

/*
 * Confirmed manager identity history.
 *
 * Important:
 * - Trabiski #1 and CarnalitoZ were former
 *   managers and were replaced in 2020.
 * - Their histories must remain separate.
 * - Yeah Daaavvveee!!! and Kentucky Dave
 *   are not aliases for those former teams.
 */
export const managerIdentities: ManagerIdentity[] = [
    {
        id: 'schmontz-nation',
        canonicalName: 'Schmontz Nation',
        aliases: [
            'Schmontz Nation',
        ],
    },

    {
        id: 'constipated-commandos',
        canonicalName: 'Constipated Commandos',
        aliases: [
            'Constipated Commandos',
            'Constipated commandos',
            'Italian Stallions',
            'Myrmidons',
        ],
    },

    {
        id: 'balls-deep',
        canonicalName: 'Balls Deep',
        aliases: [
            'Balls Deep',
        ],
    },

    {
        id: 'jimmys-johnson',
        canonicalName: "Jimmy's Johnson",
        aliases: [
            "Jimmy's Johnson",
        ],
    },

    {
        id: 'yeah-daaavvveee',
        canonicalName: 'Yeah Daaavvveee!!!',
        aliases: [
            'Yeah Daaavvveee!!!',
        ],
    },

    {
        id: 'kentucky-dave',
        canonicalName: 'Kentucky Dave',
        aliases: [
            'Kentucky Dave',
        ],
    },

    {
        id: 'rice-a-ronnie72',
        canonicalName: 'Rice-A-Ronnie72',
        aliases: [
            'Rice-A-Ronnie72',

            'MidnightHammer72',
            'C U in 2025',
            'CU In August',
            'NomoreFundays',
            'Going Comando',
            'Waller Baller',
            'diFantasiaCalcio',
        ],
    },

    {
        id: 'el-jefe',
        canonicalName: 'EL JEFE',
        aliases: [
            'EL JEFE',
        ],
    },

    {
        id: 'roty',
        canonicalName: 'ROTY',
        aliases: [
            'ROTY',
        ],
    },

    {
        id: 'papi',
        canonicalName: 'Papi',
        aliases: [
            'Papi',
            'Team Papi',
        ],
    },

    {
        id: 'siurek',
        canonicalName: 'Siurek',
        aliases: [
            'Siurek',
        ],
    },

    {
        id: 'potpaska187',
        canonicalName: 'Potpaska187',
        aliases: [
            'Potpaska187',
        ],
    },

    {
        id: 'give-me-your-money-now',
        canonicalName: 'GiveMeYourMoneyNow',
        aliases: [
            'GiveMeYourMoneyNow',
        ],
    },

    /*
     * Former managers.
     *
     * These remain independent identities.
     * Do not merge their draft histories into
     * the managers who replaced them.
     */
    {
        id: 'former-trabiski-1',
        canonicalName: 'Trabiski #1',
        aliases: [
            'Trabiski #1',
        ],
        isFormerManager: true,
    },

    {
        id: 'former-carnalitoz',
        canonicalName: 'CarnalitoZ',
        aliases: [
            'CarnalitoZ',
        ],
        isFormerManager: true,
    },
]

function normalizeText(
    value: string,
) {
    return value
        .trim()
        .toLowerCase()
        .replace(
            /['’]/g,
            "'",
        )
        .replace(
            /\s+/g,
            ' ',
        )
}

/*
 * Converts a historical CBS team name
 * into the correct permanent identity.
 *
 * Unknown names are preserved rather than
 * silently assigned to the wrong manager.
 */
export function getCanonicalManagerName(
    rawName: string,
) {
    const normalized =
        normalizeText(
            rawName,
        )

    const identity =
        managerIdentities.find(
            (manager) =>
                manager.aliases.some(
                    (alias) =>
                        normalizeText(
                            alias,
                        ) ===
                        normalized,
                ),
        )

    return (
        identity?.canonicalName ??
        rawName.trim()
    )
}

export function getManagerIdentity(
    rawName: string,
) {
    const normalized =
        normalizeText(
            rawName,
        )

    return (
        managerIdentities.find(
            (manager) =>
                manager.aliases.some(
                    (alias) =>
                        normalizeText(
                            alias,
                        ) ===
                        normalized,
                ),
        ) ??
        null
    )
}

export function getManagerAliases(
    rawName: string,
) {
    return (
        getManagerIdentity(
            rawName,
        )?.aliases ??
        [rawName]
    )
}

export function isKnownManagerAlias(
    rawName: string,
) {
    return (
        getManagerIdentity(
            rawName,
        ) !== null
    )
}

export function isFormerManager(
    rawName: string,
) {
    return (
        getManagerIdentity(
            rawName,
        )?.isFormerManager ??
        false
    )
}