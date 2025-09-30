"use client";

import { useEffect, useId, useMemo, useRef } from "react";

import type { RhythmScore } from "@/lib/score/types";
import type { NoteResultStatus } from "@/lib/scoring/evaluate";

export type ScoreViewerProps = {
  score: RhythmScore;
  enableBeams?: boolean;
  noteStatuses?: Record<number, NoteResultStatus>;
};

type VexFactory = import("vexflow").Factory;

type RenderSize = {
  width: number;
  height: number;
};

const DEFAULT_SIZE: RenderSize = { width: 520, height: 180 };

const BEAMABLE_DURATIONS = new Set(["8", "16", "32", "64"]);
const NOTE_STYLE_DEFAULT = { fillStyle: "#111827", strokeStyle: "#111827" } as const;
const NOTE_STYLE_OK = { fillStyle: "#10b981", strokeStyle: "#047857" } as const;
const NOTE_STYLE_NG = { fillStyle: "#ef4444", strokeStyle: "#b91c1c" } as const;
const BEAM_COLOR_DEFAULT = { fillStyle: "#1f2937", strokeStyle: "#1f2937" } as const;
const BEAM_COLOR_OK = { fillStyle: NOTE_STYLE_OK.fillStyle, strokeStyle: NOTE_STYLE_OK.strokeStyle } as const;
const BEAM_COLOR_NG = { fillStyle: NOTE_STYLE_NG.fillStyle, strokeStyle: NOTE_STYLE_NG.strokeStyle } as const;

export function ScoreViewer({ score, enableBeams = true, noteStatuses }: ScoreViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const reactId = useId();
  const elementId = useMemo(() => `vf-${reactId.replace(/[:]/g, "")}`, [reactId]);
  const { vexflow, events } = score;

  const voiceNotation = vexflow.voice;
  const timeSignature = vexflow.timeSignature;

  useEffect(() => {
    let isMounted = true;
    let factory: VexFactory | null = null;
    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.innerHTML = "";

    const render = async () => {
      const { Factory } = await import("vexflow/bravura");
      if (typeof document !== "undefined" && "fonts" in document) {
        await document.fonts.ready;
      }
      if (!isMounted || !containerRef.current) {
        return;
      }

      factory = new Factory({
        renderer: {
          elementId,
          width: DEFAULT_SIZE.width,
          height: DEFAULT_SIZE.height,
        },
      });
      const vf = factory.EasyScore();
      vf.set({ time: timeSignature, stem: "auto" });
      const system = factory.System({
        width: DEFAULT_SIZE.width - 40,
      });

      const notes = vf.notes(voiceNotation, { time: timeSignature });
      const voice = vf.voice(notes, { time: timeSignature });

      const beamGroups: Array<{ notes: typeof notes; indices: number[] }> = [];
      let currentGroup: typeof notes = [];
      let currentIndices: number[] = [];
      let currentBeatIndex: number | null = null;

      const flushGroup = () => {
        if (currentGroup.length > 1) {
          beamGroups.push({ notes: [...currentGroup], indices: [...currentIndices] });
        }
        currentGroup = [];
        currentIndices = [];
      };

      notes.forEach((note, index) => {
        const status = noteStatuses?.[index];
        const style =
          status === "ok"
            ? NOTE_STYLE_OK
            : status === "ng"
            ? NOTE_STYLE_NG
            : NOTE_STYLE_DEFAULT;
        note.setStyle(style);
        note.setStemStyle(style);

        if (!enableBeams) {
          return;
        }

        const duration = note.getDuration();
        const isBeamable = BEAMABLE_DURATIONS.has(duration);
        const event = events?.[index];
        const beatIndex = event ? Math.floor(event.beat) : null;

        if (!isBeamable || beatIndex === null) {
          flushGroup();
          currentBeatIndex = beatIndex;
          return;
        }

        if (currentBeatIndex === null || beatIndex === currentBeatIndex) {
          currentGroup.push(note);
          currentIndices.push(index);
          currentBeatIndex = beatIndex;
        } else {
          flushGroup();
          currentGroup.push(note);
          currentIndices.push(index);
          currentBeatIndex = beatIndex;
        }
      });

      if (enableBeams) {
        flushGroup();

        beamGroups.forEach((group) => {
          const beam = factory.Beam({ notes: group.notes });
          const statuses = group.indices
            .map((idx) => noteStatuses?.[idx])
            .filter((value): value is NoteResultStatus => Boolean(value));
          const beamStyle = statuses.includes("ng")
            ? BEAM_COLOR_NG
            : statuses.length > 0
            ? BEAM_COLOR_OK
            : BEAM_COLOR_DEFAULT;
          beam.setStyle(beamStyle);
        });
      }

      system
        .addStave({
          voices: [voice],
        })
        .addClef("treble")
        .addTimeSignature(timeSignature);

      factory.draw();
    };

    render();

    return () => {
      isMounted = false;
      if (factory) {
        const context = factory.getContext();
        const svgElement = (context as unknown as { svg?: SVGElement }).svg;
        svgElement?.remove?.();
        factory = null;
      }
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [elementId, enableBeams, events, noteStatuses, score.id, timeSignature, voiceNotation]);

  return (
    <div
      id={elementId}
      ref={containerRef}
      className="mx-auto"
      role="figure"
      aria-label="譜面表示"
    />
  );
}
