export type TimeSignature = {
  numerator: number;
  denominator: number;
};

export type RhythmEvent = {
  /** 0-based beat position from score start. */
  beat: number;
  /** Duration expressed in beats (e.g. 0.5 = eighth note in 4/4). */
  durationBeats: number;
  /** true when the beat is silent but still consumes time. */
  isRest?: boolean;
};

export type RhythmScore = {
  id: string;
  title: string;
  description?: string;
  tempoBpm: number;
  timeSignature: TimeSignature;
  events: RhythmEvent[];
  vexflow: {
    timeSignature: string;
    voice: string;
  };
};

export type ExpectedOnset = {
  beat: number;
  onsetMs: number;
};
