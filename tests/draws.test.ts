import { describe, expect, it } from "vitest";

import { getMatchTier, keepLatestScores } from "@/lib/draws";
import type { ScoreEntry } from "@/lib/types";

function makeScore(id: string, value: number, playedAt: string): ScoreEntry {
  return {
    id,
    userId: "user-1",
    value,
    playedAt,
    createdAt: `${playedAt}T10:00:00.000Z`,
    updatedAt: `${playedAt}T10:00:00.000Z`,
  };
}

describe("draw helpers", () => {
  it("keeps only the latest five scores ordered newest first", () => {
    const scores = [
      makeScore("1", 20, "2026-03-01"),
      makeScore("2", 21, "2026-03-02"),
      makeScore("3", 22, "2026-03-03"),
      makeScore("4", 23, "2026-03-04"),
      makeScore("5", 24, "2026-03-05"),
      makeScore("6", 25, "2026-03-06"),
    ];

    expect(keepLatestScores(scores).map((score) => score.value)).toEqual([
      25, 24, 23, 22, 21,
    ]);
  });

  it("returns the correct match tier from winning numbers", () => {
    expect(getMatchTier([1, 2, 3, 4, 5], [1, 2, 3, 4, 5])).toBe(5);
    expect(getMatchTier([1, 2, 3, 4, 5], [1, 2, 3, 4, 9])).toBe(4);
    expect(getMatchTier([1, 2, 3, 4, 5], [1, 2, 3, 9, 10])).toBe(3);
    expect(getMatchTier([1, 2, 3, 4, 5], [6, 7, 8, 9, 10])).toBeNull();
  });
});
