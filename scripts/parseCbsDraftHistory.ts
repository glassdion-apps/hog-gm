import fs from 'node:fs'

import type {
    ManagerPosition,
} from '../src/data/managerTypes.js'

export type ParsedCbsDraftPick = {
    season: number

    round: number
    pickInRound: number
    overallPick: number

    manager: string

    player: string
    position: ManagerPosition
    team?: string
}

export type ParsedCbsSeason = {
    season: number

    managerNames: string[]

    draftOrder: string[]

    picks: ParsedCbsDraftPick[]
}

/*
 * ---------------------------------------------------------
 * BASIC DECODING
 * ---------------------------------------------------------
 */

function decodeQuotedPrintable(
    input: string,
) {
    return input
        .replace(
            /=\r?\n/g,
            '',
        )
        .replace(
            /=([A-Fa-f0-9]{2})/g,
            (
                _match,
                hex: string,
            ) =>
                String.fromCharCode(
                    Number.parseInt(
                        hex,
                        16,
                    ),
                ),
        )
}

function decodeHtmlEntities(
    value: string,
) {
    return value
        .replace(
            /&nbsp;/gi,
            ' ',
        )
        .replace(
            /&#160;/gi,
            ' ',
        )
        .replace(
            /&amp;/gi,
            '&',
        )
        .replace(
            /&quot;/gi,
            '"',
        )
        .replace(
            /&#39;/gi,
            "'",
        )
        .replace(
            /&apos;/gi,
            "'",
        )
        .replace(
            /&#x27;/gi,
            "'",
        )
        .replace(
            /&lt;/gi,
            '<',
        )
        .replace(
            /&gt;/gi,
            '>',
        )
}

function stripTags(
    value: string,
) {
    return decodeHtmlEntities(
        value
            .replace(
                /<script\b[^>]*>[\s\S]*?<\/script>/gi,
                ' ',
            )
            .replace(
                /<style\b[^>]*>[\s\S]*?<\/style>/gi,
                ' ',
            )
            .replace(
                /<br\s*\/?>/gi,
                ' ',
            )
            .replace(
                /<[^>]+>/g,
                ' ',
            ),
    )
        .replace(
            /\u00a0/g,
            ' ',
        )
        .replace(
            /\s+/g,
            ' ',
        )
        .trim()
}

/*
 * ---------------------------------------------------------
 * MHTML EXTRACTION
 * ---------------------------------------------------------
 */

function extractHtmlFromMhtml(
    raw: string,
) {
    /*
     * The CBS snapshot contains a text/html
     * MIME section plus images/css/etc.
     *
     * Find all HTML sections and keep the
     * largest valid one.
     */
    const sections =
        raw.split(
            /\r?\n--[-_=A-Za-z0-9]+/g,
        )

    const htmlCandidates:
        string[] = []

    for (
        const section of
        sections
    ) {
        if (
            !/Content-Type:\s*text\/html/i.test(
                section,
            )
        ) {
            continue
        }

        const separator =
            section.search(
                /\r?\n\r?\n/,
            )

        if (
            separator === -1
        ) {
            continue
        }

        let body =
            section
                .slice(
                    separator,
                )
                .trim()

        if (
            /Content-Transfer-Encoding:\s*quoted-printable/i.test(
                section,
            )
        ) {
            body =
                decodeQuotedPrintable(
                    body,
                )
        }

        if (
            /Content-Transfer-Encoding:\s*base64/i.test(
                section,
            )
        ) {
            try {
                body =
                    Buffer
                        .from(
                            body.replace(
                                /\s+/g,
                                '',
                            ),
                            'base64',
                        )
                        .toString(
                            'utf8',
                        )
            } catch {
                // Ignore malformed MIME section.
            }
        }

        if (
            /<table\b/i.test(
                body,
            )
        ) {
            htmlCandidates.push(
                body,
            )
        }
    }

    if (
        htmlCandidates.length > 0
    ) {
        return htmlCandidates
            .sort(
                (a, b) =>
                    b.length -
                    a.length,
            )[0]
    }

    /*
     * Fallback for snapshots where the
     * HTML is effectively inline.
     */
    return decodeQuotedPrintable(
        raw,
    )
}

/*
 * ---------------------------------------------------------
 * POSITION / TEAM
 * ---------------------------------------------------------
 */

function normalizePosition(
    raw: string,
): ManagerPosition | null {
    const value =
        raw
            .trim()
            .toUpperCase()

    if (
        value === 'QB' ||
        value === 'RB' ||
        value === 'WR' ||
        value === 'TE' ||
        value === 'K'
    ) {
        return value
    }

    if (
        value === 'DST' ||
        value === 'D/ST' ||
        value === 'DEF'
    ) {
        return 'DST'
    }

    return null
}

const nflTeams =
    new Set([
        'ARI',
        'ATL',
        'BAL',
        'BUF',
        'CAR',
        'CHI',
        'CIN',
        'CLE',
        'DAL',
        'DEN',
        'DET',
        'GB',
        'HOU',
        'IND',
        'JAC',
        'JAX',
        'KC',
        'LV',
        'LAC',
        'LAR',
        'MIA',
        'MIN',
        'NE',
        'NO',
        'NYG',
        'NYJ',
        'PHI',
        'PIT',
        'SEA',
        'SF',
        'TB',
        'TEN',
        'WAS',
    ])

function normalizeNflTeam(
    raw: string | undefined,
) {
    if (!raw) {
        return undefined
    }

    const value =
        raw
            .trim()
            .toUpperCase()

    if (
        !nflTeams.has(
            value,
        )
    ) {
        return undefined
    }

    return (
        value === 'JAX'
            ? 'JAC'
            : value
    )
}

/*
 * ---------------------------------------------------------
 * ROUND EXTRACTION
 * ---------------------------------------------------------
 */

type RoundSection = {
    round: number
    html: string
}

function getRoundSections(
    html: string,
): RoundSection[] {
    const matches =
        Array.from(
            html.matchAll(
                /<tr[^>]*class=["'][^"']*subtitle[^"']*["'][^>]*>\s*<td[^>]*>\s*Round\s+(\d+)\s*<\/td>\s*<\/tr>/gi,
            ),
        )

    return matches.map(
        (
            match,
            index,
        ) => {
            const round =
                Number(
                    match[1],
                )

            const start =
                match.index ?? 0

            const end =
                matches[
                    index + 1
                ]?.index ??
                html.length

            return {
                round,

                html:
                    html.slice(
                        start,
                        end,
                    ),
            }
        },
    )
}

/*
 * ---------------------------------------------------------
 * TABLE ROW PARSING
 * ---------------------------------------------------------
 */

function extractCells(
    rowHtml: string,
) {
    return Array.from(
        rowHtml.matchAll(
            /<td\b[^>]*>([\s\S]*?)<\/td>/gi,
        ),
    ).map(
        (match) =>
            match[1] ?? '',
    )
}

function extractPlayerName(
    playerCellHtml: string,
) {
    const playerLinkMatch =
        playerCellHtml.match(
            /<a\b[^>]*class=["'][^"']*playerLink[^"']*["'][^>]*>([\s\S]*?)<\/a>/i,
        )

    if (
        !playerLinkMatch
    ) {
        return ''
    }

    return stripTags(
        playerLinkMatch[1] ?? '',
    )
}

function extractPositionAndTeam(
    playerCellHtml: string,
) {
    /*
     * CBS has changed this markup over the years.
     *
     * Position is usually inside the
     * playerPositionAndTeam span, while the NFL
     * team may be separated by punctuation,
     * nested markup, or CBS-specific text.
     *
     * Rather than assuming "RB LAR", inspect all
     * visible text in the player cell.
     */

    const positionTeamMatch =
        playerCellHtml.match(
            /class=["'][^"']*playerPositionAndTeam[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
        )

    const positionSource =
        positionTeamMatch
            ? stripTags(
                positionTeamMatch[1] ?? '',
            )
            : stripTags(
                playerCellHtml,
            )

    const positionMatch =
        positionSource.match(
            /\b(QB|RB|WR|TE|K|DST|D\/ST|DEF)\b/i,
        )

    const position =
        normalizePosition(
            positionMatch?.[1] ?? '',
        )

    /*
     * Search the complete player cell for an NFL
     * abbreviation instead of assuming it is the
     * second whitespace-delimited token.
     */
    const visiblePlayerText =
        stripTags(
            playerCellHtml,
        )
            .replace(
                /â€¢/g,
                ' ',
            )
            .replace(
                /â¢/g,
                ' ',
            )
            .replace(
                /•/g,
                ' ',
            )
            .replace(
                /·/g,
                ' ',
            )
            .replace(
                /\s+/g,
                ' ',
            )
            .trim()

    /*
     * Team aliases CBS has used historically.
     */
    const teamPattern =
        /\b(ARI|ATL|BAL|BUF|CAR|CHI|CIN|CLE|DAL|DEN|DET|GB|HOU|IND|JAC|JAX|KC|LV|LAC|LAR|MIA|MIN|NE|NO|NYG|NYJ|PHI|PIT|SEA|SF|TB|TEN|WAS|OAK|SD|STL)\b/i

    const teamMatch =
        visiblePlayerText.match(
            teamPattern,
        )

    let rawTeam =
        teamMatch?.[1]
            ?.toUpperCase()

    /*
     * Normalize historical franchise
     * abbreviations into the modern abbreviation
     * Honda uses everywhere else.
     */
    if (rawTeam === 'OAK') {
        rawTeam = 'LV'
    }

    if (rawTeam === 'SD') {
        rawTeam = 'LAC'
    }

    if (rawTeam === 'STL') {
        rawTeam = 'LAR'
    }

    const team =
        normalizeNflTeam(
            rawTeam,
        )

    return {
        position,
        team,
    }
}

function parseRound(
    season: number,
    round: number,
    roundHtml: string,
    leagueSize: number,
): ParsedCbsDraftPick[] {
    const picks:
        ParsedCbsDraftPick[] = []

    /*
     * CBS actual draft rows use:
     *
     * row1
     * row2
     * bgFan
     *
     * bgFan is the logged-in manager's row.
     */
    const rows =
        Array.from(
            roundHtml.matchAll(
                /<tr\b[^>]*class=["'][^"']*(?:row1|row2|bgFan)[^"']*["'][^>]*>([\s\S]*?)<\/tr>/gi,
            ),
        )

    for (
        const rowMatch of
        rows
    ) {
        const rowHtml =
            rowMatch[1] ??
            ''

        const cells =
            extractCells(
                rowHtml,
            )

        if (
            cells.length < 3
        ) {
            continue
        }

        const pickInRound =
            Number(
                stripTags(
                    cells[0] ??
                    '',
                ),
            )

        const manager =
            stripTags(
                cells[1] ??
                '',
            )

        const playerCell =
            cells[2] ??
            ''

        const player =
            extractPlayerName(
                playerCell,
            )

        const {
            position,
            team,
        } =
            extractPositionAndTeam(
                playerCell,
            )

        if (
            !Number.isFinite(
                pickInRound,
            ) ||
            pickInRound <= 0 ||
            !manager ||
            !player ||
            !position
        ) {
            continue
        }

        const overallPick =
            (
                round - 1
            ) *
            leagueSize +
            pickInRound

        picks.push({
            season,

            round,
            pickInRound,
            overallPick,

            manager,

            player,
            position,
            team,
        })
    }

    return picks
}

/*
 * ---------------------------------------------------------
 * DRAFT ORDER
 * ---------------------------------------------------------
 */

function getDraftOrder(
    picks: ParsedCbsDraftPick[],
) {
    return picks
        .filter(
            (pick) =>
                pick.round === 1,
        )
        .sort(
            (a, b) =>
                a.pickInRound -
                b.pickInRound,
        )
        .map(
            (pick) =>
                pick.manager,
        )
}

/*
 * ---------------------------------------------------------
 * VALIDATION
 * ---------------------------------------------------------
 */

function validateSeason(
    season: number,
    picks: ParsedCbsDraftPick[],
    leagueSize: number,
) {
    const duplicateOverall =
        picks.length -
        new Set(
            picks.map(
                (pick) =>
                    pick.overallPick,
            ),
        ).size

    if (
        duplicateOverall > 0
    ) {
        throw new Error(
            `${season}: duplicate overall picks detected.`,
        )
    }

    const roundOneCount =
        picks.filter(
            (pick) =>
                pick.round === 1,
        ).length

    if (
        roundOneCount !==
        leagueSize
    ) {
        throw new Error(
            `${season}: Round 1 parsed ${roundOneCount} picks, expected ${leagueSize}.`,
        )
    }
}

/*
 * ---------------------------------------------------------
 * MAIN
 * ---------------------------------------------------------
 */

export function parseCbsDraftFile(
    filePath: string,
    season: number,
): ParsedCbsSeason {
    if (
        !fs.existsSync(
            filePath,
        )
    ) {
        throw new Error(
            `CBS draft file not found: ${filePath}`,
        )
    }

    const raw =
        fs.readFileSync(
            filePath,
            'utf8',
        )

    if (
        !raw.trim()
    ) {
        throw new Error(
            `CBS draft file is empty: ${filePath}`,
        )
    }

    const html =
        extractHtmlFromMhtml(
            raw,
        )

    const roundSections =
        getRoundSections(
            html,
        )

    if (
        roundSections.length === 0
    ) {
        throw new Error(
            [
                '',
                `No CBS round sections found in ${filePath}`,
                `Season: ${season}`,
                `Decoded HTML length: ${html.length}`,
            ].join(
                '\n',
            ),
        )
    }

    const roundOne =
        roundSections.find(
            (section) =>
                section.round === 1,
        )

    if (!roundOne) {
        throw new Error(
            `${season}: Round 1 was not found.`,
        )
    }

    /*
     * Parse Round 1 with a temporary league
     * size. Overall pick equals pickInRound
     * in Round 1 anyway.
     */
    const temporaryRoundOnePicks =
        parseRound(
            season,
            1,
            roundOne.html,
            999,
        )

    const leagueSize =
        temporaryRoundOnePicks.length

    if (
        leagueSize < 2
    ) {
        throw new Error(
            [
                '',
                `${season}: could not determine league size.`,
                `Round 1 picks parsed: ${leagueSize}`,
            ].join(
                '\n',
            ),
        )
    }

    const picks =
        roundSections
            .flatMap(
                (section) =>
                    parseRound(
                        season,
                        section.round,
                        section.html,
                        leagueSize,
                    ),
            )
            .sort(
                (a, b) =>
                    a.overallPick -
                    b.overallPick,
            )

    validateSeason(
        season,
        picks,
        leagueSize,
    )

    const draftOrder =
        getDraftOrder(
            picks,
        )

    const managerNames =
        Array.from(
            new Set(
                picks.map(
                    (pick) =>
                        pick.manager,
                ),
            ),
        )

    console.log(
        `   ↳ Parsed ${picks.length} picks`,
    )

    console.log(
        `   ↳ League size: ${leagueSize}`,
    )

    console.log(
        `   ↳ Draft order: ${draftOrder.join(' | ')}`,
    )

    return {
        season,

        managerNames,

        draftOrder,

        picks,
    }
}