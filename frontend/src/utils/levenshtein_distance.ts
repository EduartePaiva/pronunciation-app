/**
 * This function will try levenshtein dist and return a "better" current score
 * @param phones is the phones that the python backend returned
 * @param expected_phones is a array os phones "words"
 * @param current_score is a array of bool for each phone of each word, at the start everything is default false, this will be mutated
 */
export function scorePhoneme(
    phones: string,
    expected_phones: string[],
    current_score: boolean[][],
) {
    const word1_units = phones.split(" ");
    const word2_units = expected_phones.join(" ").split(" ");
    console.log(word1_units);
    console.log(word2_units);

    // build the cache matrix
    const cache: number[][] = [];
    for (let i = 0; i <= word1_units.length; i++) {
        cache.push(new Array(word2_units.length + 1).fill(0));
    }

    for (let j = 0; j <= word2_units.length; j++) {
        cache[word1_units.length][j] = word2_units.length - j;
    }
    for (let i = 0; i <= word1_units.length; i++) {
        cache[i][word2_units.length] = word1_units.length - i;
    }

    for (let i = word1_units.length - 1; i >= 0; i--) {
        for (let j = word2_units.length - 1; j >= 0; j--) {
            if (word1_units[i] == word2_units[j]) {
                cache[i][j] = cache[i + 1][j + 1];
            } else {
                cache[i][j] =
                    1 +
                    Math.min(
                        cache[i + 1][j],
                        cache[i][j + 1],
                        cache[i + 1][j + 1],
                    );
            }
        }
    }

    console.log(cache.length);
    console.log(cache[0].length);
    // console.log(cache);

    for (const r of cache) {
        for (const n of r) {
            if (n < 10) {
                process.stdout.write(`0${n} `);
            } else {
                process.stdout.write(`${n} `);
            }
        }
        process.stdout.write("\n");
    }
}
