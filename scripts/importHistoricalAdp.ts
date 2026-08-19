import fs from 'node:fs'
import path from 'node:path'

/*
 * ---------------------------------------------------------
 * CONFIG
 * ---------------------------------------------------------
 */

const HISTORICAL_SEASONS = [
    2018,
    2019,
    2021,
    2022,
    2023,
    2024,
    2025,
] as const

const projectRoot =
    process.cwd()

const sourceDirectory =
    path.join(
        projectRoot,
        'data',
        'historical-adp',
    )

const outputDirectory =
    path.join(
        projectRoot,
        'data',
        'historical-player-data',
        'enrichment',
    )

/*
 * ---------------------------------------------------------
 * TYPES
 * ---------------------------------------------------------
 */

type HistoricalAdpRecord = {
    season: number
    player: string
    position?: string
    team?: string
    publicAdp: number
    adpSource: 'FantasyPros PPR Consensus'
}

type HistoricalAdpFile = {
    generatedAt: string
    season: number
    source: string
    scoring: 'PPR'
    records: HistoricalAdpRecord[]
}

type FantasyProsJsonRow = {
    id?: number
    rank?: number

    player?: {
        id?: number
        name?: string
        team?: string
        url?: string
    }

    pos?: string
    avg?: number | string | null
}

type FantasyProsJsonFile = {
    season?: number
    source?: string
    scoring?: string
    exportedAt?: string
    rows?: FantasyProsJsonRow[]
}

/*
 * ---------------------------------------------------------
 * NORMALIZATION
 * ---------------------------------------------------------
 */

function normalizePosition(
    value:
        string | undefined,
) {
    if (
        !value
    ) {
        return undefined
    }

    const match =
        value
            .trim()
            .toUpperCase()
            .match(
                /^(QB|RB|WR|TE|K|DST)/,
            )

    return (
        match?.[1] ??
        undefined
    )
}

function normalizeTeam(
    value:
        string | undefined,
) {
    if (
        !value
    ) {
        return undefined
    }

    /*
     * FantasyPros may include bye-week data:
     *
     *   NO (6)
     *   KC (10)
     */
    const cleaned =
        value
            .trim()
            .replace(
                /\s*\([^)]*\)\s*$/,
                '',
            )
            .trim()
            .toUpperCase()

    if (
        !cleaned
    ) {
        return undefined
    }

    if (
        cleaned ===
        'JAX'
    ) {
        return 'JAC'
    }

    return cleaned
}

/*
 * ---------------------------------------------------------
 * LOAD RAW FANTASYPROS EXPORT
 * ---------------------------------------------------------
 */

function loadFantasyProsSeason(
    season: number,
) {
    const inputPath =
        path.join(
            sourceDirectory,
            `fantasypros-adp-${season}.json`,
        )

    if (
        !fs.existsSync(
            inputPath,
        )
    ) {
        throw new Error(
            [
                '',
                `${season}: FantasyPros export was not found.`,
                '',
                `Expected: ${inputPath}`,
                '',
            ].join(
                '\n',
            ),
        )
    }

    console.log(
        `Loading ${season} FantasyPros PPR ADP...`,
    )

    console.log(
        `   Source: ${inputPath}`,
    )

    const raw =
        fs.readFileSync(
            inputPath,
            'utf8',
        )

    const input =
        JSON.parse(
            raw,
        ) as FantasyProsJsonFile

    if (
        typeof input.season ===
        'number' &&
        input.season !==
        season
    ) {
        throw new Error(
            `${season}: export says season ${input.season}.`,
        )
    }

    if (
        !Array.isArray(
            input.rows,
        )
    ) {
        throw new Error(
            `${season}: export does not contain a rows array.`,
        )
    }

    if (
        input.rows.length <=
        5
    ) {
        throw new Error(
            [
                `${season}: only ${input.rows.length} FantasyPros rows found.`,
                '',
                'This looks like the anonymous preview',
                'instead of the authenticated export.',
            ].join(
                '\n',
            ),
        )
    }

    return {
        inputPath,
        input,
    }
}

/*
 * ---------------------------------------------------------
 * PARSE RAW JSON
 * ---------------------------------------------------------
 */

function parseFantasyProsJson(
    season: number,
    input: FantasyProsJsonFile,
) {
    const rows =
        input.rows ??
        []

    const records:
        HistoricalAdpRecord[] = []

    let skipped =
        0

    for (
        const row of
        rows
    ) {
        const player =
            row.player?.name
                ?.trim() ??
            ''

        const publicAdp =
            typeof row.avg ===
                'number'
                ? row.avg
                : Number.parseFloat(
                    String(
                        row.avg ??
                        '',
                    ),
                )

        if (
            !player ||
            !Number.isFinite(
                publicAdp,
            ) ||
            publicAdp <=
            0
        ) {
            skipped +=
                1

            continue
        }

        const position =
            normalizePosition(
                row.pos,
            )

        const team =
            normalizeTeam(
                row.player?.team,
            )

        records.push({
            season,

            player,

            position,

            team,

            publicAdp,

            adpSource:
                'FantasyPros PPR Consensus',
        })
    }

    const deduplicated =
        Array.from(
            new Map(
                records.map(
                    (record) => [
                        record.player
                            .toLowerCase()
                            .trim(),

                        record,
                    ],
                ),
            ).values(),
        )

    return {
        records:
            deduplicated,

        skipped,

        duplicatesRemoved:
            records.length -
            deduplicated.length,
    }
}

/*
 * ---------------------------------------------------------
 * VALIDATE
 * ---------------------------------------------------------
 */

function validateSeason(
    season: number,
    records:
        HistoricalAdpRecord[],
) {
    if (
        records.length ===
        0
    ) {
        throw new Error(
            `${season}: zero ADP records parsed.`,
        )
    }

    if (
        records.length <=
        5
    ) {
        throw new Error(
            `${season}: parsed only ${records.length} records.`,
        )
    }

    const invalid =
        records.filter(
            (record) =>
                !record.player ||
                !Number.isFinite(
                    record.publicAdp,
                ) ||
                record.publicAdp <=
                0,
        )

    if (
        invalid.length >
        0
    ) {
        throw new Error(
            `${season}: ${invalid.length} invalid ADP records found.`,
        )
    }
}

/*
 * ---------------------------------------------------------
 * WRITE NORMALIZED ENRICHMENT
 * ---------------------------------------------------------
 */

function writeSeason(
    season: number,
    sourcePath: string,
    records:
        HistoricalAdpRecord[],
) {
    fs.mkdirSync(
        outputDirectory,
        {
            recursive: true,
        },
    )

    const output:
        HistoricalAdpFile = {
        generatedAt:
            new Date()
                .toISOString(),

        season,

        source:
            sourcePath,

        scoring:
            'PPR',

        records,
    }

    const outputPath =
        path.join(
            outputDirectory,
            `${season}.json`,
        )

    fs.writeFileSync(
        outputPath,
        JSON.stringify(
            output,
            null,
            2,
        ),
    )

    return outputPath
}

/*
 * ---------------------------------------------------------
 * PREVIEW
 * ---------------------------------------------------------
 */

function printSeasonPreview(
    records:
        HistoricalAdpRecord[],
) {
    const first =
        records[0]

    const sixth =
        records[5]

    if (
        first
    ) {
        console.log(
            `   First: ${first.player} | ${first.position ?? '?'} | ADP ${first.publicAdp}`,
        )
    }

    if (
        sixth
    ) {
        console.log(
            `   Sixth: ${sixth.player} | ${sixth.position ?? '?'} | ADP ${sixth.publicAdp}`,
        )
    }
}

/*
 * ---------------------------------------------------------
 * MAIN
 * ---------------------------------------------------------
 */

function main() {
    console.log('')
    console.log(
        'Importing historical FantasyPros ADP...',
    )
    console.log('')

    let totalRecords =
        0

    const seasonCounts:
        {
            season: number
            sourceRows: number
            records: number
            skipped: number
            duplicatesRemoved: number
        }[] = []

    for (
        const season of
        HISTORICAL_SEASONS
    ) {
        try {
            const {
                inputPath,
                input,
            } =
                loadFantasyProsSeason(
                    season,
                )

            console.log(
                `   Source rows: ${input.rows?.length ?? 0}`,
            )

            const {
                records,
                skipped,
                duplicatesRemoved,
            } =
                parseFantasyProsJson(
                    season,
                    input,
                )

            validateSeason(
                season,
                records,
            )

            const outputPath =
                writeSeason(
                    season,
                    inputPath,
                    records,
                )

            totalRecords +=
                records.length

            seasonCounts.push({
                season,

                sourceRows:
                    input.rows?.length ??
                    0,

                records:
                    records.length,

                skipped,

                duplicatesRemoved,
            })

            console.log(
                `   Players imported: ${records.length}`,
            )

            console.log(
                `   Rows skipped: ${skipped}`,
            )

            console.log(
                `   Duplicates removed: ${duplicatesRemoved}`,
            )

            printSeasonPreview(
                records,
            )

            console.log(
                `   Written: ${outputPath}`,
            )

            console.log('')
        } catch (
        error
        ) {
            console.error(
                `❌ ${season} failed`,
            )

            console.error(
                error,
            )

            process.exitCode =
                1

            return
        }
    }

    console.log(
        '--------------------------------',
    )

    for (
        const season of
        seasonCounts
    ) {
        console.log(
            `${season.season}: ` +
            `${season.records} players ` +
            `from ${season.sourceRows} source rows`,
        )
    }

    console.log('')

    console.log(
        `Historical ADP records imported: ${totalRecords}`,
    )

    console.log(
        `Seasons imported: ${seasonCounts.length}`,
    )

    console.log('')

    console.log(
        `✅ Historical ADP written under: ${outputDirectory}`,
    )

    /*
     * 2026 intentionally remains raw.
     *
     * data/historical-adp/fantasypros-adp-2026.json
     *
     * It belongs to the current-market layer,
     * not completed historical Honda seasons.
     */
}

main()