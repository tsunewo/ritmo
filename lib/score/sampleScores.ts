import { ExpectedOnset, RhythmScore } from "./types";

export const sampleScore: RhythmScore = {
  id: "rh_001",
  title: "8分音符ドリル（1小節）",
  description: "4/4で8分音符を均等に刻むシンプルなウォームアップ課題です。",
  tempoBpm: 60,
  timeSignature: { numerator: 4, denominator: 4 },
  events: Array.from({ length: 8 }, (_, index) => ({
    beat: index * 0.5,
    durationBeats: 0.5,
  })),
  vexflow: {
    timeSignature: "4/4",
    voice: "c4/8, c4/8, c4/8, c4/8, c4/8, c4/8, c4/8, c4/8",
  },
};

export function buildExpectedOnsets(score: RhythmScore): ExpectedOnset[] {
  const beatDurationMs = (60_000 / score.tempoBpm) * (4 / score.timeSignature.denominator);
  return score.events
    .filter((event) => !event.isRest)
    .map((event) => ({
      beat: event.beat,
      onsetMs: event.beat * beatDurationMs,
    }));
}

export function totalDurationMs(score: RhythmScore): number {
  const beatDurationMs = (60_000 / score.tempoBpm) * (4 / score.timeSignature.denominator);
  const lastEvent = score.events[score.events.length - 1];
  const totalBeats = lastEvent.beat + lastEvent.durationBeats;
  return totalBeats * beatDurationMs;
}
