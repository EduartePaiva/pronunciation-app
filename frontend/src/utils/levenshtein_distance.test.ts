import { expect, test } from "vitest";
import { scorePhoneme } from "./levenshtein_distance";

test("first test", () => {
    const phones = "ð ɪ z ɪ z ɐ t ɛ s t ɔː d oʊ";
    const expected_phones = "ð ɪ s|ɪ z|ɐ|t ɛ s t|ɔː d ɪ oʊ".split("|");

    const current_score: boolean[][] = [];
    for (const phn_wrd of expected_phones) {
        current_score.push(new Array(phn_wrd.split(" ").length).fill(false));
    }
    expect(scorePhoneme(phones, expected_phones, current_score));
});
