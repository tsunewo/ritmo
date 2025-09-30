import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-12 px-4 pb-16 pt-16 sm:px-6 lg:px-8">
      <section className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-neutral-500">
          ブラウザで完結するリズム練習ツール
        </p>
        <h1 className="text-4xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-5xl">
          Ritmo MVP デモ
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-neutral-600 dark:text-neutral-300">
          表示された楽譜のリズムをメトロノームのテンポで叩き、各音符がOKかNGかをその場で確認できるサンプル実装です。
          カウントインの後に1小節分の課題が流れ、スペースキーでもタップできます。
        </p>
        <div className="flex flex-wrap gap-3 pt-4">
          <Link
            href="/play"
            className="rounded-full bg-neutral-900 px-8 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
          >
            デモを始める
          </Link>
          <a
            href="https://tonejs.github.io/"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-neutral-300 px-5 py-3 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
          >
            仕組みの詳細を見る
          </a>
        </div>
      </section>
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-neutral-700/60 dark:bg-neutral-900/70">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">MVPに含む要素</h2>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
            <li>・譜面のSVG表示（VexFlow）</li>
            <li>・メトロノーム＆カウントイン（Web Audio）</li>
            <li>・タップ入力（クリック/スペース）</li>
            <li>・各音符のOK/NG判定</li>
            <li>・OK/NG集計と許容誤差の確認</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-neutral-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm dark:border-neutral-700/60 dark:bg-neutral-900/70">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">次フェーズのアイデア</h2>
          <ul className="mt-3 space-y-2 text-sm text-neutral-600 dark:text-neutral-300">
            <li>・レイテンシ較正と端末プロファイル保存</li>
            <li>・課題の複数バリエーションと難易度設定</li>
            <li>・手拍子検出用AudioWorkletの導入</li>
            <li>・オフライン対応PWA化</li>
            <li>・学習履歴の可視化</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
