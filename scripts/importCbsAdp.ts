import fs from 'node:fs'
import path from 'node:path'

type CbsAdpPlayer = {
    rank: number
    positionRank: number

    player: string
    position: string
    team?: string

    adp: number

    highPick?: number
    lowPick?: number

    draftedPercent?: number
}

type CbsAdpFile = {
    season: number
    generatedAt: string
    source: string

    players: CbsAdpPlayer[]
}

const SEASON = 2026

const projectRoot =
    process.cwd()

const inputPath =
    path.join(
        projectRoot,
        'data',
        'cbs-history',
        '2026 cbs adp - Sheet1.csv',
    )

const outputDirectory =
    path.join(
        projectRoot,
        'data',
        'adp',
    )

const outputPath =
    path.join(
        outputDirectory,
        'cbs-2026.json',
    )

function parseCsvLine(
    line: string,
) {
    const values: string[] = []

    let current = ''
    let insideQuotes = false

    for (
        let index = 0;
        index < line.length;
        index += 1
    ) {
        const character =
            line[index]

        if (
            character === '"'
        ) {
            const nextCharacter =
                line[index + 1]

            if (
                insideQuotes &&
                nextCharacter === '"'
            ) {
                current += '"'
                index += 1
                continue
            }

            insideQuotes =
                !insideQuotes

            continue
        }

        if (
            character === ',' &&
            !insideQuotes
        ) {
            values.push(
                current.trim(),
            )

            current = ''

            continue
        }

        current += character
    }

    values.push(
        current.trim(),
    )

    return values
}

function parseNumber(
    value:
        string | undefined,
) {
    if (
        !value
    ) {
        return undefined
    }

    const parsed =
        Number(
            value.trim(),
        )

    return Number.isFinite(
        parsed,
    )
        ? parsed
        : undefined
}

function parsePlayerField(
    value: string,
) {
    /*
     * Examples:
     *
     * Jahmyr Gibbs RB | DET *
     * Ja'Marr Chase WR | CIN *
     * Jaxon Smith-Njigba WR | SEA
     */

    const cleaned =
        value
            .replace(
                /\s+\*+\s*$/,
                '',
            )
            .trim()

    const match =
        cleaned.match(
            /^(.*?)\s+(QB|RB|WR|TE|K|DST|D\/ST)\s*(?:\|\s*([A-Z]{2,3}))?$/i,
        )

    if (
        !match
    ) {
        return null
    }

    const player =
        (
            match[1] ??
            ''
        ).trim()

    let position =
        (
            match[2] ??
            ''
        )
            .trim()
            .toUpperCase()

    if (
        position === 'D/ST'
    ) {
        position = 'DST'
    }

    const rawTeam =
        match[3]
            ?.trim()
            .toUpperCase()

    const team =
        rawTeam === 'JAX'
            ? 'JAC'
            : rawTeam

    if (
        !player ||
        !position
    ) {
        return null
    }

    return {
        player,
        position,
        team,
    }
}

function parseHighLow(
    value:
        string | undefined,
) {
    if (
        !value
    ) {
        return {
            highPick:
                undefined,
            lowPick:
                undefined,
        }
    }

    const match =
        value
            .trim()
            .match(
                /^([\d.]+)\s*\/\s*([\d.]+)$/,
            )

    if (
        !match
    ) {
        return {
            highPick:
                undefined,
            lowPick:
                undefined,
        }
    }

    return {
        highPick:
            parseNumber(
                match[1],
            ),

        lowPick:
            parseNumber(
                match[2],
            ),
    }
}

function main() {
    console.log('')
    console.log(
        'Importing CBS 2026 ADP...',
    )
    console.log('')

    if (
        !fs.existsSync(
            inputPath,
        )
    ) {
        throw new Error(
            [
                '',
                'CBS ADP CSV was not found.',
                '',
                `Expected: ${inputPath}`,
                '',
            ].join(
                '\n',
            ),
        )
    }

    const raw =
        fs.readFileSync(
            inputPath,
            'utf8',
        )

    const lines =
        raw
            .replace(
                /^\uFEFF/,
                '',
            )
            .split(
                /\r?\n/,
            )
            .map(
                (line) =>
                    line.trim(),
            )
            .filter(
                Boolean,
            )

    if (
        lines.length < 2
    ) {
        throw new Error(
            'CBS ADP CSV contains no player rows.',
        )
    }

    const headers =
        parseCsvLine(
            lines[0],
        )

    console.log(
        `Headers: ${headers.join(' | ')}`,
    )

    const players:
        CbsAdpPlayer[] = []

    let skipped = 0

    for (
        const line of
        lines.slice(1)
    ) {
        const columns =
            parseCsvLine(
                line,
            )

        const rank =
            parseNumber(
                columns[0],
            )

        const positionRank =
            parseNumber(
                columns[1],
            )

        const playerField =
            columns[2] ?? ''

        const adp =
            parseNumber(
                columns[4],
            )

        const {
            highPick,
            lowPick,
        } =
            parseHighLow(
                columns[5],
            )

        const draftedPercent =
            parseNumber(
                columns[6],
            )

        const parsedPlayer =
            parsePlayerField(
                playerField,
            )

        if (
            rank === undefined ||
            positionRank === undefined ||
            adp === undefined ||
            !parsedPlayer
        ) {
            skipped += 1

            console.warn(
                `⚠️ Skipped row: ${line}`,
            )

            continue
        }

        players.push({
            rank,
            positionRank,

            player:
                parsedPlayer.player,

            position:
                parsedPlayer.position,

            team:
                parsedPlayer.team,

            adp,

            highPick,
            lowPick,

            draftedPercent,
        })
    }

    players.sort(
        (a, b) =>
            a.rank -
            b.rank,
    )

    fs.mkdirSync(
        outputDirectory,
        {
            recursive: true,
        },
    )

    const output:
        CbsAdpFile = {
        season:
            SEASON,

        generatedAt:
            new Date().toISOString(),

        source:
            path.basename(
                inputPath,
            ),

        players,
    }

    fs.writeFileSync(
        outputPath,
        JSON.stringify(
            output,
            null,
            2,
        ),
    )

    const withTeam =
        players.filter(
            (player) =>
                Boolean(
                    player.team,
                ),
        ).length

    const positions =
        new Map<
            string,
            number
        >()

    for (
        const player of
        players
    ) {
        positions.set(
            player.position,
            (
                positions.get(
                    player.position,
                ) ?? 0
            ) + 1,
        )
    }

    console.log('')
    console.log(
        '--------------------------------',
    )

    console.log(
        `CBS players imported: ${players.length}`,
    )

    console.log(
        `Rows skipped: ${skipped}`,
    )

    console.log(
        `Players with NFL team: ${withTeam}`,
    )

    console.log(
        `Positions: ${
            Array.from(
                positions.entries(),
            )
                .map(
                    ([position, count]) =>
                        `${position}=${count}`,
                )
                .join(', ')
        }`,
    )

    console.log('')

    if (
        players.length > 0
    ) {
        console.log(
            `ADP range: ${players[0].adp} → ${players[players.length - 1].adp}`,
        )
    }

    console.log('')
    console.log(
        `✅ CBS 2026 ADP written to: ${outputPath}`,
    )
}

main()