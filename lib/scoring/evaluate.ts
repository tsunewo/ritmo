import type { ExpectedOnset } from "@/lib/score/types";

export type NoteResultStatus = "ok" | "ng";

export type NoteResult = {
  index: number;
  beat: number;
  expectedMs: number;
  actualMs: number | null;
  status: NoteResultStatus;
};

export type ScoreSummary = {
  okCount: number;
  ngCount: number;
  extraHits: number;
  totalNotes: number;
  accuracy: number;
  toleranceMs: number;
  noteResults: NoteResult[];
  comment: string;
};

const DEFAULT_TOLERANCE_MS = 60; // コード内定数。将来は設定画面で調整予定。

export function evaluateAttempt(
  expected: ExpectedOnset[],
  tapsMs: number[],
  toleranceMs: number = DEFAULT_TOLERANCE_MS,
): ScoreSummary {
  const sortedExpected = [...expected].sort((a, b) => a.onsetMs - b.onsetMs);
  const remainingTaps = [...tapsMs].sort((a, b) => a - b);
  const noteResults: NoteResult[] = [];

  for (let index = 0; index < sortedExpected.length; index += 1) {
    const target = sortedExpected[index];
    let bestMatchIndex = -1;
    let bestDelta = Number.POSITIVE_INFINITY;

    for (let tapIndex = 0; tapIndex < remainingTaps.length; tapIndex += 1) {
      const tap = remainingTaps[tapIndex];
      const delta = Math.abs(tap - target.onsetMs);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestMatchIndex = tapIndex;
      }
    }

    if (bestMatchIndex !== -1 && bestDelta <= toleranceMs) {
      const actualMs = remainingTaps.splice(bestMatchIndex, 1)[0];
      noteResults.push({
        index,
        beat: target.beat,
        expectedMs: target.onsetMs,
        actualMs,
        status: "ok",
      });
    } else {
      noteResults.push({
        index,
        beat: target.beat,
        expectedMs: target.onsetMs,
        actualMs: null,
        status: "ng",
      });
    }
  }

  const okCount = noteResults.filter((result) => result.status === "ok").length;
  const ngCount = noteResults.length - okCount;
  const extraHits = remainingTaps.length;
  const totalNotes = noteResults.length;
  const accuracy = totalNotes === 0 ? 0 : Math.round((okCount / totalNotes) * 100);
  const comment = buildComment(accuracy, extraHits);

  return {
    okCount,
    ngCount,
    extraHits,
    totalNotes,
    accuracy,
    toleranceMs,
    noteResults,
    comment,
  };
}

function buildComment(accuracy: number, extraHits: number): string {
  if (accuracy === 100 && extraHits === 0) {
    return "完璧です！次はテンポアップに挑戦してみましょう。";
  }
  if (accuracy >= 80) {
    return "リズムの流れは安定しています。苦手な拍を重点的に練習しましょう。";
  }
  if (accuracy >= 60) {
    return "まずはメトロノームに合わせて手拍子し、OK回数を増やしていきましょう。";
  }
  return "リズムを声に出してカウントしながら叩くと、テンポを掴みやすくなります。";
}
