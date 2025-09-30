"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ScoreViewer } from "@/components/score-viewer";
import { buildExpectedOnsets, sampleScore, totalDurationMs } from "@/lib/score/sampleScores";
import { evaluateAttempt, type ScoreSummary } from "@/lib/scoring/evaluate";

const COUNT_IN_BEATS = sampleScore.timeSignature.numerator;
const TOLERANCE_MS = 80;

export function TapTrainer() {
  const beatDurationMs = useMemo(
    () => (60_000 / sampleScore.tempoBpm) * (4 / sampleScore.timeSignature.denominator),
    [],
  );
  const expectedOnsets = useMemo(() => buildExpectedOnsets(sampleScore), []);
  const sessionLengthMs = useMemo(() => totalDurationMs(sampleScore), []);

  const [phase, setPhase] = useState<"idle" | "count-in" | "playing" | "finished">("idle");
  const [tapCount, setTapCount] = useState(0);
  const [summary, setSummary] = useState<ScoreSummary | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const countInIntervalRef = useRef<number | null>(null);
  const metronomeIntervalRef = useRef<number | null>(null);
  const stopTimeoutRef = useRef<number | null>(null);
  const sessionStartRef = useRef<number | null>(null);
  const tapsRef = useRef<number[]>([]);
  const hasFinalisedRef = useRef(false);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const triggerClick = useCallback((accent: boolean) => {
    const context = getAudioContext();
    const time = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = accent ? 1320 : 880;
    gain.gain.setValueAtTime(accent ? 0.25 : 0.18, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(time);
    oscillator.stop(time + 0.1);
  }, [getAudioContext]);

  const clearLoopingTimers = useCallback(() => {
    if (countInIntervalRef.current !== null) {
      window.clearInterval(countInIntervalRef.current);
      countInIntervalRef.current = null;
    }
    if (metronomeIntervalRef.current !== null) {
      window.clearInterval(metronomeIntervalRef.current);
      metronomeIntervalRef.current = null;
    }
    if (stopTimeoutRef.current !== null) {
      window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
  }, []);

  const finaliseSession = useCallback(() => {
    if (hasFinalisedRef.current) {
      return;
    }
    hasFinalisedRef.current = true;
    clearLoopingTimers();

    setPhase("finished");
    const taps = [...tapsRef.current];
    const report = evaluateAttempt(expectedOnsets, taps, TOLERANCE_MS);
    setSummary(report);
  }, [clearLoopingTimers, expectedOnsets]);

  const startPlaying = useCallback(() => {
    setPhase("playing");
    tapsRef.current = [];
    sessionStartRef.current = performance.now();
    hasFinalisedRef.current = false;
    triggerClick(true);

    metronomeIntervalRef.current = window.setInterval(() => {
      triggerClick(false);
    }, beatDurationMs);

    stopTimeoutRef.current = window.setTimeout(() => {
      finaliseSession();
    }, sessionLengthMs + beatDurationMs);
  }, [beatDurationMs, finaliseSession, sessionLengthMs, triggerClick]);

  const handleStart = useCallback(async () => {
    if (phase === "count-in" || phase === "playing") {
      return;
    }

    clearLoopingTimers();
    setSummary(null);
    setTapCount(0);
    hasFinalisedRef.current = false;
    tapsRef.current = [];
    sessionStartRef.current = null;

    const context = getAudioContext();
    if (context.state === "suspended") {
      await context.resume();
    }

    setPhase("count-in");
    triggerClick(true);
    let beatsPassed = 1;

    countInIntervalRef.current = window.setInterval(() => {
      if (beatsPassed >= COUNT_IN_BEATS) {
        clearLoopingTimers();
        startPlaying();
        return;
      }

      triggerClick(true);
      beatsPassed += 1;
    }, beatDurationMs);
  }, [beatDurationMs, clearLoopingTimers, getAudioContext, phase, startPlaying, triggerClick]);

  const handleTap = useCallback(() => {
    if (phase !== "playing" || sessionStartRef.current === null) {
      return;
    }
    const offset = performance.now() - sessionStartRef.current;
    tapsRef.current = [...tapsRef.current, offset];
    setTapCount((prev) => prev + 1);
  }, [phase]);

  const handleStop = useCallback(() => {
    if (phase === "idle") {
      return;
    }
    finaliseSession();
  }, [finaliseSession, phase]);

  const handleReset = useCallback(() => {
    clearLoopingTimers();
    hasFinalisedRef.current = false;
    tapsRef.current = [];
    sessionStartRef.current = null;
    setPhase("idle");
    setSummary(null);
    setTapCount(0);
  }, [clearLoopingTimers]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Space") {
        event.preventDefault();
        handleTap();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [handleTap]);

  useEffect(() => {
    return () => {
      clearLoopingTimers();
      audioContextRef.current?.close().catch(() => undefined);
    };
  }, [clearLoopingTimers]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-neutral-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-neutral-700/60 dark:bg-neutral-900/70">
        <header className="mb-4 space-y-1">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">課題</p>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {sampleScore.title}
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{sampleScore.description}</p>
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-neutral-600 dark:text-neutral-300">
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                テンポ
              </dt>
              <dd>{sampleScore.tempoBpm} BPM</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                拍子
              </dt>
              <dd>
                {sampleScore.timeSignature.numerator}/{sampleScore.timeSignature.denominator}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                状態
              </dt>
              <dd>
                {phase === "idle" && "待機中"}
                {phase === "count-in" && "カウントイン"}
                {phase === "playing" && "演奏中"}
                {phase === "finished" && "結果"}
              </dd>
            </div>
          </dl>
        </header>
        <ScoreViewer
          voiceNotation={sampleScore.vexflow.voice}
          timeSignature={sampleScore.vexflow.timeSignature}
        />
      </section>

      <section className="rounded-2xl border border-neutral-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-neutral-700/60 dark:bg-neutral-900/70">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleStart}
            className="rounded-full bg-neutral-900 px-6 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-400 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            disabled={phase === "count-in" || phase === "playing"}
          >
            スタート
          </button>
          <button
            type="button"
            onClick={handleTap}
            className="grow rounded-full bg-emerald-500 px-6 py-3 text-lg font-semibold text-white transition hover:bg-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:bg-emerald-300 sm:grow-0"
            disabled={phase !== "playing"}
          >
            タップ（Space）
          </button>
          <button
            type="button"
            onClick={handleStop}
            className="rounded-full border border-neutral-300 px-6 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
            disabled={phase === "idle"}
          >
            停止＆採点
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-transparent px-6 py-2 text-sm text-neutral-500 transition hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            リセット
          </button>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 text-sm text-neutral-700 dark:text-neutral-200 sm:grid-cols-3">
          <div className="rounded-xl bg-neutral-100/80 p-4 dark:bg-neutral-800/80">
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">タップ数</p>
            <p className="mt-1 text-2xl font-semibold">{tapCount}</p>
          </div>
          <div className="rounded-xl bg-neutral-100/80 p-4 dark:bg-neutral-800/80">
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">許容誤差</p>
            <p className="mt-1 text-2xl font-semibold">±{TOLERANCE_MS}ms</p>
          </div>
          <div className="rounded-xl bg-neutral-100/80 p-4 dark:bg-neutral-800/80">
            <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">合計時間</p>
            <p className="mt-1 text-2xl font-semibold">約 {(sessionLengthMs / 1000).toFixed(1)}秒</p>
          </div>
        </div>
      </section>

      {summary && (
        <section className="rounded-2xl border border-neutral-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-neutral-700/60 dark:bg-neutral-900/70">
          <header className="mb-4">
            <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">結果</h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">{summary.comment}</p>
          </header>
          <div className="grid grid-cols-1 gap-4 text-sm text-neutral-700 dark:text-neutral-100 sm:grid-cols-4">
            <div className="rounded-xl bg-emerald-100/80 p-4 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100">
              <p className="text-xs uppercase tracking-wide opacity-70">OK</p>
              <p className="mt-1 text-3xl font-bold">{summary.okCount}</p>
            </div>
            <div className="rounded-xl bg-rose-100/80 p-4 text-rose-900 dark:bg-rose-900/40 dark:text-rose-100">
              <p className="text-xs uppercase tracking-wide opacity-70">NG</p>
              <p className="mt-1 text-3xl font-bold">{summary.ngCount}</p>
            </div>
            <div className="rounded-xl bg-neutral-100/80 p-4 dark:bg-neutral-800/80">
              <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">命中率</p>
              <p className="mt-1 text-2xl font-semibold">{summary.accuracy}%</p>
            </div>
            <div className="rounded-xl bg-amber-100/80 p-4 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100">
              <p className="text-xs uppercase tracking-wide opacity-70">余計な入力</p>
              <p className="mt-1 text-3xl font-bold">{summary.extraHits}回</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-neutral-500 dark:text-neutral-400">
            許容誤差：±{summary.toleranceMs}ms（コード内定数）
          </p>
          <div className="mt-6">
            <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">各音符の判定</h3>
            <ul className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {summary.noteResults.map((note) => {
                const position = note.beat + 1;
                const positionLabel = Number.isInteger(position)
                  ? `${position}拍目`
                  : `${position.toFixed(1)}拍目`;
                const isOk = note.status === "ok";
                return (
                  <li
                    key={note.index}
                    className={`rounded-2xl border p-4 text-center shadow-sm backdrop-blur-sm transition ${
                      isOk
                        ? "border-emerald-200/80 bg-emerald-50/80 text-emerald-800 dark:border-emerald-700/60 dark:bg-emerald-900/30 dark:text-emerald-100"
                        : "border-rose-200/80 bg-rose-50/80 text-rose-800 dark:border-rose-700/60 dark:bg-rose-900/30 dark:text-rose-100"
                    }`}
                  >
                    <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-300">
                      {positionLabel}
                    </p>
                    <p className="mt-2 text-xl font-semibold">{isOk ? "OK" : "NG"}</p>
                    <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-300">
                      #{note.index + 1}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
