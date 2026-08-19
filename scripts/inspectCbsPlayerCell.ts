import fs from 'node:fs'

const filePath =
    './data/cbs-history/Honda on Grand 2018 - CBSSports.com.mhtml'

const raw =
    fs.readFileSync(
        filePath,
        'utf8',
    )

const player =
    'Todd Gurley'

const playerIndex =
    raw.indexOf(
        player,
    )

if (playerIndex === -1) {
    throw new Error(
        `${player} not found`,
    )
}

const start =
    Math.max(
        0,
        playerIndex - 1500,
    )

const end =
    Math.min(
        raw.length,
        playerIndex + 2500,
    )

console.log('')
console.log(
    '========== RAW TODD GURLEY CBS HTML ==========',
)
console.log('')

console.log(
    raw.slice(
        start,
        end,
    ),
)

console.log('')
console.log(
    '===============================================',
)