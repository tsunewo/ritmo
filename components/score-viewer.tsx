"use client";

import { useEffect, useId, useMemo, useRef } from "react";

import type { RhythmScore } from "@/lib/score/types";

export type ScoreViewerProps = {
  score: RhythmScore;
  enableBeams?: boolean;
};

type VexFactory = import("vexflow").Factory;

type RenderSize = {
  width: number;
  height: number;
};

const DEFAULT_SIZE: RenderSize = { width: 520, height: 180 };

const BEAMABLE_DURATIONS = new Set(["8", "16", "32", "64"]);

export function ScoreViewer({ score, enableBeams = true }: ScoreViewerProps) {
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

      if (enableBeams) {
        const beamGroups: Array<typeof notes> = [];
        let currentGroup: typeof notes = [];
        let currentBeatIndex: number | null = null;

        const flushGroup = () => {
          if (currentGroup.length > 1) {
            beamGroups.push([...currentGroup]);
          }
          currentGroup = [];
        };

        notes.forEach((note, index) => {
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
            currentBeatIndex = beatIndex;
          } else {
            flushGroup();
            currentGroup.push(note);
            currentBeatIndex = beatIndex;
          }
        });

        flushGroup();

        beamGroups.forEach((group) => {
          vf.beam(group);
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
  }, [elementId, enableBeams, events, score.id, timeSignature, voiceNotation]);

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
