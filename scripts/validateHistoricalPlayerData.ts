import fs from 'node:fs'
import path from 'node:path'

type HistoricalPlayerRecord = {
    season: number
    player: string
    position?: string
    team?: string
    publicAdp?: number
    isRookie?: boolean
}

type HistoricalPlayerDataFile = {
    generatedAt: string
    seasons: number[]
    records: HistoricalPlayerRecord[]
}

const projectRoot =
    process.cwd()

const inputPath =
    path.join(
        projectRoot,
        'data',
        'historical-player-data',
        'historical-player-data.json',
    )

function main() {
    if (
        !fs.existsSync(
            inputPath,
        )
    ) {
        throw new Error(
            `Historical player data not found: ${inputPath}`,
        )
    }

    const data =
        JSON.parse(
            fs.readFileSync(
                inputPath,
                'utf8',
            ),
        ) as HistoricalPlayerDataFile

    if (
        !Array.isArray(
            data.records,
        )
    ) {
        throw new Error(
            'historical-player-data.json does not contain a records array.',
        )
    }

    const duplicateKeys =
        new Map<string, number>()

    for (
        const record of
        data.records
    ) {
        const key =
            `${record.season}:${record.player
                .trim()
                .toLowerCase()}`

        duplicateKeys.set(
            key,
            (
                duplicateKeys.get(
                    key,
                ) ??
                0
            ) + 1,
        )
    }

    const duplicates =
        Array.from(
            duplicateKeys.entries(),
        ).filter(
            ([, count]) =>
                count > 1,
        )

    const invalidSeason =
        data.records.filter(
            (record) =>
                !Number.isInteger(
                    record.season,
                ),
        )

    const missingPlayer =
        data.records.filter(
            (record) =>
                !record.player?.trim(),
        )

    const missingPosition =
        data.records.filter(
            (record) =>
                !record.position?.trim(),
        )

    const invalidAdp =
        data.records.filter(
            (record) =>
                record.publicAdp !==
                    undefined &&
                (
                    !Number.isFinite(
                        record.publicAdp,
                    ) ||
                    record.publicAdp <=
                        0
                ),
        )

    const missingAdp =
        data.records.filter(
            (record) =>
                record.publicAdp ===
                undefined,
        )

    const missingRookieStatus =
        data.records.filter(
            (record) =>
                typeof record.isRookie !==
                'boolean',
        )

    const bySeason =
        new Map<
            number,
            {
                records: number
                withAdp: number
                withoutAdp: number
                rookies: number
                dst: number
            }
        >()

    for (
        const record of
        data.records
    ) {
        const current =
            bySeason.get(
                record.season,
            ) ?? {
                records: 0,
                withAdp: 0,
                withoutAdp: 0,
                rookies: 0,
                dst: 0,
            }

        current.records +=
            1

        if (
            typeof record.publicAdp ===
            'number'
        ) {
            current.withAdp +=
                1
        } else {
            current.withoutAdp +=
                1
        }

        if (
            record.isRookie ===
            true
        ) {
            current.rookies +=
                1
        }

        if (
            record.position ===
            'DST'
        ) {
            current.dst +=
                1
        }

        bySeason.set(
            record.season,
            current,
        )
    }

    console.log('')
    console.log(
        'Validating Honda historical player data...',
    )
    console.log('')

    for (
        const season of
        [...bySeason.keys()].sort(
            (a, b) =>
                a - b,
        )
    ) {
        const stats =
            bySeason.get(
                season,
            )

        if (
            !stats
        ) {
            continue
        }

        console.log(
            `${season}: ` +
            `${stats.records} records | ` +
            `${stats.withAdp} ADP | ` +
            `${stats.withoutAdp} missing ADP | ` +
            `${stats.rookies} rookies | ` +
            `${stats.dst} DST`,
        )
    }

    console.log('')
    console.log(
        '--------------------------------',
    )

    console.log(
        `Records: ${data.records.length}`,
    )

    console.log(
        `Seasons: ${data.seasons.join(', ')}`,
    )

    console.log(
        `With ADP: ${
            data.records.length -
            missingAdp.length
        }`,
    )

    console.log(
        `Without ADP: ${missingAdp.length}`,
    )

    console.log(
        `With rookie status: ${
            data.records.length -
            missingRookieStatus.length
        }`,
    )

    console.log(
        `Duplicate player-seasons: ${duplicates.length}`,
    )

    console.log(
        `Missing player names: ${missingPlayer.length}`,
    )

    console.log(
        `Missing positions: ${missingPosition.length}`,
    )

    console.log(
        `Invalid seasons: ${invalidSeason.length}`,
    )

    console.log(
        `Invalid ADP values: ${invalidAdp.length}`,
    )

    const fatalProblems =
        duplicates.length +
        missingPlayer.length +
        missingPosition.length +
        invalidSeason.length +
        invalidAdp.length +
        missingRookieStatus.length

    console.log('')

    if (
        fatalProblems >
        0
    ) {
        console.error(
            `❌ Historical player data has ${fatalProblems} validation problems.`,
        )

        process.exitCode =
            1

        return
    }

    if (
        data.records.length !==
        1260
    ) {
        console.error(
            `❌ Expected 1260 player-season records, found ${data.records.length}.`,
        )

        process.exitCode =
            1

        return
    }

    if (
        missingAdp.length !==
        11
    ) {
        console.error(
            `❌ Expected 11 intentional missing ADP records, found ${missingAdp.length}.`,
        )

        process.exitCode =
            1

        return
    }

    console.log(
        '✅ Historical player data passed validation.',
    )
}

main()
