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
}

/*
 * IMPORTANT:
 *
 * We are deliberately NOT guessing historical
 * name changes here.
 *
 * The current names are established first.
 * As we confirm renamed teams from the CBS
 * history, we add the old names to the proper
 * aliases array.
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
        id: 'rice-a-ronnie72',
        canonicalName: 'Rice-A-Ronnie72',
        aliases: [
            'Rice-A-Ronnie72',
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
]

function normalizeText(
    value: string,
) {
    return value
        .trim()
        .toLowerCase()
        .replace(/['’]/g, "'")
        .replace(/\s+/g, ' ')
}

/*
 * Converts a historical CBS team name
 * into the current canonical manager name.
 *
 * Unknown names are preserved instead of
 * being silently assigned to the wrong person.
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
                        normalizeText(alias) ===
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
    const canonicalName =
        getCanonicalManagerName(
            rawName,
        )

    return (
        managerIdentities.find(
            (manager) =>
                manager.canonicalName ===
                canonicalName,
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