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
 * CBS MHTML files use quoted-printable
 * encoding for the HTML portion.
 */
function decodeQuotedPrintable(
    value: string,
) {
    const withoutSoftBreaks =
        value.replace(
            /=\r?\n/g,
            '',
        )

    const bytes: number[] = []

    for (
        let index = 0;
        index < withoutSoftBreaks.length;
        index++
    ) {
        const character =
            withoutSoftBreaks[index]

        if (
            character === '=' &&
            index + 2 <
            withoutSoftBreaks.length
        ) {
            const hex =
                withoutSoftBreaks.slice(
                    index + 1,
                    index + 3,
                )

            if (
                /^[0-9A-Fa-f]{2}$/.test(
                    hex,
                )
            ) {
                bytes.push(
                    Number.parseInt(
                        hex,
                        16,
                    ),
                )

                index += 2

                continue
            }
        }

        const encoded =
            Buffer.from(
                character,
                'utf8',
            )

        for (const byte of encoded) {
            bytes.push(byte)
        }
    }

    return Buffer
        .from(bytes)
        .toString('utf8')
}

/*
 * Remove CBS/HTML formatting but preserve
 * player/team punctuation.
 */
function cleanHtmlText(
    value: string,
) {
    return value
        .replace(
            /<[^>]*>/g,
            ' ',
        )
        .replace(
            /&nbsp;/gi,
            ' ',
        )
        .replace(
            /&amp;/gi,
            '&',
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
            /&quot;/gi,
            '"',
        )
        .replace(
            /&lt;/gi,
            '<',
        )
        .replace(
            /&gt;/gi,
            '>',
        )
        .replace(
            /\s+/g,
            ' ',
        )
        .trim()
}

function normalizePosition(
    value: string,
): ManagerPosition | null {
    const position =
        value
            .trim()
            .toUpperCase()

    if (
        position === 'QB' ||
        position === 'RB' ||
        position === 'WR' ||
        position === 'TE' ||
        position === 'K'
    ) {
        return position
    }

    if (
        position === 'DST' ||
        position === 'DEF' ||
        position === 'D/ST'
    ) {
        return 'DST'
    }

    return null
}

/*
 * The HTML content in these saved CBS
 * pages is the quoted-printable part
 * containing the actual draft table.
 *
 * We don't need to fully implement the
 * MHTML MIME specification. We only need
 * the HTML payload.
 */
function getDecodedHtml(
    fileContents: string,
) {
    const htmlPartMatch =
        fileContents.match(
            /Content-Type:\s*text\/html[\s\S]*?\r?\n\r?\n([\s\S]*?)(?=\r?\n--[-_A-Za-z0-9=]+)/i,
        )

    const encodedHtml =
        htmlPartMatch?.[1] ??
        fileContents

    return decodeQuotedPrintable(
        encodedHtml,
    )
}

function getRoundSections(
    html: string,
) {
    const matches =
        Array.from(
            html.matchAll(
                /<td[^>]*colspan=["']?5["']?[^>]*>\s*Round\s+(\d+)\s*<\/td>/gi,
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
                match.index ??
                0

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

function parseRoundRows(
    season: number,
    round: number,
    roundHtml: string,
    leagueSize: number,
): ParsedCbsDraftPick[] {
    const picks:
        ParsedCbsDraftPick[] = []

    /*
     * Each actual draft row starts with a
     * <tr class="row1">, <tr class="row2">
     * or CBS's highlighted "bgFan" class.
     *
     * The row contains:
     *
     * td 1 = pick within round
     * td 2 = fantasy team
     * td 3 = player + position/team
     */
    const rowMatches =
        Array.from(
            roundHtml.matchAll(
                /<tr[^>]*class=["'][^"']*(?:row1|row2|bgFan)[^"']*["'][^>]*>([\s\S]*?)<\/tr>/gi,
            ),
        )

    for (
        const rowMatch of
        rowMatches
    ) {
        const rowHtml =
            rowMatch[1] ??
            ''

        const cellMatches =
            Array.from(
                rowHtml.matchAll(
                    /<td[^>]*>([\s\S]*?)<\/td>/gi,
                ),
            )

        if (
            cellMatches.length < 3
        ) {
            continue
        }

        const pickInRound =
            Number(
                cleanHtmlText(
                    cellMatches[0]?.[1] ??
                    '',
                ),
            )

        const manager =
            cleanHtmlText(
                cellMatches[1]?.[1] ??
                '',
            )

        const playerCell =
            cellMatches[2]?.[1] ??
            ''

        if (
            !Number.isFinite(
                pickInRound,
            ) ||
            pickInRound <= 0 ||
            !manager
        ) {
            continue
        }

        /*
         * CBS gives us a stable playerLink
         * anchor, so use its visible text
         * instead of aria-label.
         *
         * That avoids issues with apostrophes
         * such as Ja'Marr Chase and De'Von
         * Achane.
         */
        const playerMatch =
            playerCell.match(
                /<a[^>]*class=["'][^"']*playerLink[^"']*["'][^>]*>([\s\S]*?)<\/a>/i,
            )

        const player =
            playerMatch
                ? cleanHtmlText(
                    playerMatch[1],
                )
                : ''

        /*
         * Example:
         *
         * <span class="playerPositionAndTeam">
         *   WR • CIN
         * </span>
         */
        const positionTeamMatch =
            playerCell.match(
                /class=["'][^"']*playerPositionAndTeam[^"']*["'][^>]*>([\s\S]*?)<\/span>/i,
            )

        if (
            !player ||
            !positionTeamMatch
        ) {
            continue
        }

        const positionTeamText =
            cleanHtmlText(
                positionTeamMatch[1],
            )
                .replace(
                    /•/g,
                    ' ',
                )
                .replace(
                    /\s+/g,
                    ' ',
                )
                .trim()

        const parts =
            positionTeamText.split(
                ' ',
            )

        const position =
            normalizePosition(
                parts[0] ??
                '',
            )

        if (!position) {
            continue
        }

        const nflTeam =
            parts[1]
                ? parts[1].toUpperCase()
                : undefined

        /*
         * CBS numbers picks from 1 again
         * inside every round, so calculate
         * the true overall selection here.
         */
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
            team:
                nflTeam,
        })
    }

    return picks
}

function getDraftOrder(
    firstRoundPicks:
        ParsedCbsDraftPick[],
) {
    return [...firstRoundPicks]
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

    const rawContents =
        fs.readFileSync(
            filePath,
            'utf8',
        )

    const html =
        getDecodedHtml(
            rawContents,
        )

    const roundSections =
        getRoundSections(
            html,
        )

    if (
        roundSections.length === 0
    ) {
        throw new Error(
            `No CBS draft rounds found in ${filePath}`,
        )
    }

    /*
     * Determine league size from Round 1.
     * This prevents us from hardcoding 12
     * if an older CBS season differs.
     */
    const firstRoundSection =
        roundSections.find(
            (section) =>
                section.round === 1,
        )

    if (!firstRoundSection) {
        throw new Error(
            `Round 1 not found in ${filePath}`,
        )
    }

    /*
     * Initially parse Round 1 using a
     * placeholder league size because its
     * overall picks equal its round picks.
     */
    const firstRoundPicks =
        parseRoundRows(
            season,
            1,
            firstRoundSection.html,
            1000,
        )

    const leagueSize =
        firstRoundPicks.length

    if (leagueSize === 0) {
        throw new Error(
            `No Round 1 picks found in ${filePath}`,
        )
    }

    const allPicks =
        roundSections.flatMap(
            (section) =>
                parseRoundRows(
                    season,
                    section.round,
                    section.html,
                    leagueSize,
                ),
        )

    const draftOrder =
        getDraftOrder(
            allPicks.filter(
                (pick) =>
                    pick.round === 1,
            ),
        )

    const managerNames =
        Array.from(
            new Set(
                allPicks.map(
                    (pick) =>
                        pick.manager,
                ),
            ),
        )

    return {
        season,
        managerNames,
        draftOrder,
        picks:
            allPicks.sort(
                (a, b) =>
                    a.overallPick -
                    b.overallPick,
            ),
    }
}