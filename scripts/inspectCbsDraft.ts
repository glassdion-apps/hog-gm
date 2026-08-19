import fs from 'node:fs'
import path from 'node:path'

const filePath =
    path.resolve(
        'data/cbs-history/Honda on Grand 2018 - CBSSports.com.mhtml',
    )

if (!fs.existsSync(filePath)) {
    throw new Error(
        `File not found: ${filePath}`,
    )
}

const raw =
    fs.readFileSync(
        filePath,
        'utf8',
    )

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

function decodeEntities(
    input: string,
) {
    return input
        .replace(/&nbsp;/gi, ' ')
        .replace(/&#160;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&apos;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
}

const decoded =
    decodeQuotedPrintable(
        raw,
    )

const visibleText =
    decodeEntities(
        decoded
            .replace(
                /<script\b[^>]*>[\s\S]*?<\/script>/gi,
                '\n',
            )
            .replace(
                /<style\b[^>]*>[\s\S]*?<\/style>/gi,
                '\n',
            )
            .replace(
                /<br\s*\/?>/gi,
                '\n',
            )
            .replace(
                /<\/(?:div|p|li|td|th|tr|span|a|h1|h2|h3|h4)>/gi,
                '\n',
            )
            .replace(
                /<[^>]+>/g,
                ' ',
            ),
    )

const lines =
    visibleText
        .replace(/\r/g, '')
        .split('\n')
        .map(
            (line) =>
                line
                    .replace(
                        /\u00a0/g,
                        ' ',
                    )
                    .replace(
                        /\s+/g,
                        ' ',
                    )
                    .trim(),
        )
        .filter(Boolean)

console.log('')
console.log(
    '🏎️ CBS 2018 Round 1 Inspector',
)
console.log('')

console.log(
    `Total visible lines: ${lines.length}`,
)
console.log('')

const roundOneIndex =
    lines.findIndex(
        (line) =>
            line === 'Round 1',
    )

if (roundOneIndex === -1) {
    throw new Error(
        'Round 1 was not found.',
    )
}

const roundTwoIndex =
    lines.findIndex(
        (
            line,
            index,
        ) =>
            index > roundOneIndex &&
            line === 'Round 2',
    )

console.log(
    `Round 1 starts at line: ${
        roundOneIndex + 1
    }`,
)

console.log(
    `Round 2 starts at line: ${
        roundTwoIndex + 1
    }`,
)

console.log('')
console.log(
    '========== COMPLETE ROUND 1 BLOCK ==========',
)
console.log('')

const endIndex =
    roundTwoIndex !== -1
        ? roundTwoIndex
        : roundOneIndex + 150

for (
    let index = roundOneIndex;
    index < endIndex;
    index++
) {
    console.log(
        `${String(
            index + 1,
        ).padStart(
            4,
            '0',
        )}: ${lines[index]}`,
    )
}

console.log('')
console.log(
    '========== RAW HTML ROUND 1 CLUES ==========',
)
console.log('')

/*
 * Also locate the HTML surrounding
 * "Round 1". This lets us see the actual
 * TD/TR structure if visible-text ordering
 * alone is ambiguous.
 */
const roundOneHtmlIndex =
    decoded.search(
        /Round\s*1/i,
    )

if (
    roundOneHtmlIndex !== -1
) {
    const htmlWindow =
        decoded.slice(
            Math.max(
                0,
                roundOneHtmlIndex -
                2000,
            ),
            roundOneHtmlIndex +
                12000,
        )

    const simplified =
        htmlWindow
            .replace(
                /\r/g,
                '',
            )
            .replace(
                />\s+</g,
                '>\n<',
            )

    const htmlLines =
        simplified
            .split('\n')
            .map(
                (line) =>
                    line.trim(),
            )
            .filter(Boolean)

    for (
        const [
            index,
            line,
        ] of
        htmlLines
            .slice(
                0,
                300,
            )
            .entries()
    ) {
        console.log(
            `${String(
                index + 1,
            ).padStart(
                4,
                '0',
            )}: ${line}`,
        )
    }
}

console.log('')
console.log(
    '========== END ==========',
)
console.log('')