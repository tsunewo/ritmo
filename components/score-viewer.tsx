"use client";

import { useEffect, useId, useMemo, useRef } from "react";

export type ScoreViewerProps = {
  voiceNotation: string;
  timeSignature: string;
};

type VexFactory = import("vexflow").Factory;

type RenderSize = {
  width: number;
  height: number;
};

const DEFAULT_SIZE: RenderSize = { width: 420, height: 160 };

export function ScoreViewer({ voiceNotation, timeSignature }: ScoreViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const reactId = useId();
  const elementId = useMemo(() => `vf-${reactId.replace(/[:]/g, "")}`, [reactId]);

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
      const score = factory.EasyScore();
      const system = factory.System({
        width: DEFAULT_SIZE.width - 40,
      });

      system.addStave({
        voices: [score.voice(score.notes(voiceNotation, { time: timeSignature }))],
      });

      factory.draw();
    };

    render();

    return () => {
      isMounted = false;
      if (factory) {
        factory.getContext().svg?.remove?.();
        factory = null;
      }
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [elementId, timeSignature, voiceNotation]);

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
