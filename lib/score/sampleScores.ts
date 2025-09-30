import { ExpectedOnset, RhythmScore } from "./types";

export const eighthNoteDrill: RhythmScore = {
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
    voice: "a4/8, a4/8, a4/8, a4/8, a4/8, a4/8, a4/8, a4/8",
  },
};

export const quarterAccentDrill: RhythmScore = {
  id: "rh_002",
  title: "4分音符アクセント",
  description: "各拍をしっかり感じながら1拍ずつ叩く基礎練習です。",
  tempoBpm: 72,
  timeSignature: { numerator: 4, denominator: 4 },
  events: Array.from({ length: 4 }, (_, index) => ({
    beat: index,
    durationBeats: 1,
  })),
  vexflow: {
    timeSignature: "4/4",
    voice: "a4/4, a4/4, a4/4, a4/4",
  },
};

export const sixteenthDriveDrill: RhythmScore = {
  id: "rh_003",
  title: "16分音符ドライブ",
  description: "低めのテンポで16分音符を均等に刻む集中トレーニングです。",
  tempoBpm: 50,
  timeSignature: { numerator: 4, denominator: 4 },
  events: Array.from({ length: 16 }, (_, index) => ({
    beat: index * 0.25,
    durationBeats: 0.25,
  })),
  vexflow: {
    timeSignature: "4/4",
    voice:
      "a4/16, a4/16, a4/16, a4/16, a4/16, a4/16, a4/16, a4/16, a4/16, a4/16, a4/16, a4/16, a4/16, a4/16, a4/16, a4/16",
  },
};

export const quarterEighthMixDrill: RhythmScore = {
  id: "rh_004",
  title: "4分+8分ミックス",
  description: "4分と8分を交互に切り替えながら拍の切り替え感を掴む練習です。",
  tempoBpm: 70,
  timeSignature: { numerator: 4, denominator: 4 },
  events: [
    { beat: 0, durationBeats: 1 },
    { beat: 1, durationBeats: 0.5 },
    { beat: 1.5, durationBeats: 0.5 },
    { beat: 2, durationBeats: 1 },
    { beat: 3, durationBeats: 0.5 },
    { beat: 3.5, durationBeats: 0.5 },
  ],
  vexflow: {
    timeSignature: "4/4",
    voice: "a4/4, a4/8, a4/8, a4/4, a4/8, a4/8",
  },
};

export const backbeatGrooveDrill: RhythmScore = {
  id: "rh_005",
  title: "バックステップ・グルーヴ",
  description: "2拍目と4拍目に8分裏を絡めたシンプルなグルーヴ練習です。",
  tempoBpm: 80,
  timeSignature: { numerator: 4, denominator: 4 },
  events: [
    { beat: 0, durationBeats: 0.5 },
    { beat: 0.5, durationBeats: 0.5 },
    { beat: 1, durationBeats: 1 },
    { beat: 2, durationBeats: 0.5 },
    { beat: 2.5, durationBeats: 0.5 },
    { beat: 3, durationBeats: 1 },
  ],
  vexflow: {
    timeSignature: "4/4",
    voice: "a4/8, a4/8, a4/4, a4/8, a4/8, a4/4",
  },
};

export const scoreCatalog: RhythmScore[] = [
  eighthNoteDrill,
  quarterAccentDrill,
  sixteenthDriveDrill,
  quarterEighthMixDrill,
  backbeatGrooveDrill,
];

export const defaultScoreId = scoreCatalog[0].id;

export function findScoreById(id: string): RhythmScore | undefined {
  return scoreCatalog.find((score) => score.id === id);
}

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
