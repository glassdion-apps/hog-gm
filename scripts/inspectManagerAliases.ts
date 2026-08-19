import fs from 'node:fs'
import path from 'node:path'

import {
    getCanonicalManagerName,
    isKnownManagerAlias,
} from '../src/data/managerAliases.js'

type HistoricalPick = {
    manager: string
    season: number
}

type ManagerHistory = {
    managerNames: string[]
    historicalPicks: HistoricalPick[]
}

const inputPath =
    path.join(
        process.cwd(),
        'data',
        'manager-history.json',
    )

const history =
    JSON.parse(
        fs.readFileSync(
            inputPath,
            'utf8',
        ),
    ) as ManagerHistory

const managerNames =
    Array.from(
        new Set(
            history.managerNames,
        ),
    ).sort()

console.log('')
console.log(
    '🏎️ Honda Manager Identity Inspector',
)
console.log('')

console.log(
    '========== KNOWN IDENTITIES ==========',
)
console.log('')

for (const name of managerNames) {
    if (!isKnownManagerAlias(name)) {
        continue
    }

    console.log(
        `${name} -> ${getCanonicalManagerName(name)}`,
    )
}

console.log('')
console.log(
    '========== UNRESOLVED HISTORICAL NAMES ==========',
)
console.log('')

const unresolved =
    managerNames.filter(
        (name) =>
            !isKnownManagerAlias(name),
    )

for (const name of unresolved) {
    const picks =
        history.historicalPicks.filter(
            (pick) =>
                pick.manager === name,
        )

    const seasons =
        Array.from(
            new Set(
                picks.map(
                    (pick) =>
                        pick.season,
                ),
            ),
        ).sort(
            (a, b) =>
                a - b,
        )

    console.log(
        `${name}`,
    )

    console.log(
        `   seasons: ${seasons.join(', ')}`,
    )

    console.log(
        `   picks: ${picks.length}`,
    )
}

console.log('')
console.log(
    '--------------------------------',
)

console.log(
    `Raw identities: ${managerNames.length}`,
)

console.log(
    `Known aliases: ${managerNames.length -
    unresolved.length
    }`,
)

console.log(
    `Unresolved: ${unresolved.length}`,
)

console.log('')