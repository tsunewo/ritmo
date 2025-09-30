# リズム練習アプリ 要件定義（改訂版）

> プロジェクト名：**Ritmo（リトモ）**
> ディレクトリ名：`ritmo`

> 目的：ブラウザだけで使える“譜面に合わせたリズム練習”をタップ/手拍子で行い、採点・フィードバックまで提供する。まずは**クライアントサイドのみ**で完結するMVPを構築し、将来必要に応じて講師共有・認証などを追加する。

---

## 1. 対象ユーザー / ペルソナ

* **生徒**：幼児〜大人の初中級者。自宅で短時間にリズム練習したい。
* **保護者**：子どもの練習状況を把握したい。
* **講師**：宿題の出題と進捗を可視化し、弱点を特定したい（将来機能）。

## 2. 利用シナリオ（主要ユースケース）

1. 生徒が課題を開く → **表示された楽譜のリズム**を（メトロノームが示すテンポで）**タップ**入力 → 各音符ごとのOK/NGを即時表示 → リトライ。
2. 将来：講師が課題セット（譜例・テンポ・回数・合格基準）を出題 → 生徒の履歴/スコアを確認。
3. 自習：ユーザーが難易度を選び、短いドリルを反復（オフライン可）。

## 3. スコープ / 非スコープ

* **含む（MVP）**：**楽譜の表示**、タップ入力、メトロノーム、採点（各音符のOK/NG判定）、レイテンシ較正。
* **含まない（MVP）**：**PWA（オフライン対応）**、履歴クラウド保存・認証・講師共有機能、複数声部/ポリリズム、高度な揺らぎ追従、MIDI機器連携、SNS共有、自動伴奏。

## 4. 画面要件（MVP）

* **ホーム**：デモ課題スタートボタン。
* **課題プレイ画面**：

  * 上部：譜面表示（1〜2小節単位の短いドリル）
  * 中央：メトロノーム表示、テンポ、小節カウント、開始/停止
  * 入力：大ボタン（タップ）、マイクON/OFFトグル（将来）
  * 下部：採点結果（**各音符のOK/NG**オーバーレイ、**OK/NG合計**）
* **結果画面**：スコア（OK/NG集計）、**各音符のOK/NG**表示、小節ごとの正答率、再挑戦/次の課題。
* **設定**：**レイテンシ較正**（端末ごとの入力遅延補正）、サウンド、振動フィードバック、テーマ。

## 5. 機能要件

* **譜面表示**：VexFlow で記譜（4/4中心、8分/16分、休符、タイ）。
* **メトロノーム**：正確なクリック生成とトランスポート（テンポ固定）。
* **入力（MVP）**：

  * タップ（PointerEvent、`performance.now()`）
  * 手拍子は将来追加（Web Audio API + AudioWorkletでオンセット抽出）
* **採点**：

  * 期待オンセット列 vs 実測オンセット列の整列（貪欲 or DTW）
  * **各音符をOK/NGの二値で判定**（詳細なms誤差はMVPでは扱わない）
  * 許容誤差 **±ε** は**コード内定数**として保持（将来は設定UIで調整可能）
* **レイテンシ較正**：クリックに合わせて数回タップ→平均遅延を端末プロファイルとして保存（LocalStorage）：クリックに合わせて数回タップ→平均遅延を端末プロファイルとして保存（LocalStorage）
* **データ保存（MVP）**：**ローカルのみ（LocalStorage/IndexedDB）**。クラウド同期・認証は将来フェーズ
* **PWA**：**将来フェーズで対応**（ホーム追加、オフライン練習、更新制御など）
* **アクセシビリティ**：色覚配慮、音＋振動の多重フィードバック、フォントサイズ調整

## 6. 非機能要件

* **対応ブラウザ**：最新 iOS Safari / Chrome / Edge / Firefox（iOS14+目安）。
* **パフォーマンス**：入力→記録まで <10ms（メインスレッドはブロックしない）。
* **可用性**：オンライン前提（MVP）。オフライン対応は将来のPWA導入時に検討。
* **セキュリティ/プライバシー**：マイクは明示的許可、録音は端末内処理（サーバ送信なし）。

## 7. 技術選定（推奨）

### 7.1 フロントエンド・フレームワーク

* **Next.js（App Router）+ React + TypeScript**（推奨）

  * インタラクティブ中心の設計と相性が良い
  * CSR/ISRを用途別に選べる
  * 既存の React/Tailwind 資産や shadcn/ui を活かしやすい
* **代替**：Astro（Islands）、SvelteKit、Vite+React（SPA）。ただしMVPではNext.jsが最適。

### 7.2 バージョン指定（2025-09時点）

* **Next.js v15**（最新安定版）
* **React v18**（最新安定版）
* **TypeScript v5系**（最新安定版）
* **Tailwind CSS v4**（最新安定版）

### 7.3 主要ライブラリ

* 記譜：**VexFlow**
* サウンド/テンポ：**Tone.js**（Transport/スケジューラ）
* オンセット/特徴量：**AudioWorklet** 自前実装 + **Meyda**（任意、将来）
* 状態管理：Zustand（永続はlocalStorage）
* UI：Tailwind CSS（必要に応じて shadcn/ui）
* PWA：`next-pwa` など

## 8. データモデル（概要）

````json
{
  "user": {"settings":{"latencyMs":12,"theme":"auto","epsilonMs":60}},
  "score": {"id":"rh_001","title":"8分音符ドリル","timeSig":"4/4","tempo":100,
    "notes":[{"bar":1,"beat":1.0,"dur":0.5},{"bar":1,"beat":1.5,"dur":0.5}]},
  "attempt": {"scoreId":"rh_001","ts":"2025-09-30T…",
    "perNote":[{"index":0,"ok":true},{"index":1,"ok":false}],
    "summary":{"ok":14,"ng":3,"barAccuracy":[{"bar":1,"acc":0.75}]}
  }
}
```json
{
  "user": {"settings":{"latencyMs":12,"theme":"auto"}},
  "score": {"id":"rh_001","title":"8分音符ドリル","timeSig":"4/4","tempo":100,
    "notes":[{"bar":1,"beat":1.0,"dur":0.5},{"bar":1,"beat":1.5,"dur":0.5}]},
  "attempt": {"scoreId":"rh_001","ts":"2025-09-30T…",
    "result":{"total":92,"perBar":[{"bar":1,"ok":6,"miss":1}],
      "errorsMs":[-22,14,9],"extraHits":1}}
}
````

## 9. 採点仕様（詳細）

* 期待オンセット列 `E = {e1, e2, …}`、実測 `M = {m1, m2, …}`。
* **整列**：貪欲マッチ（|m−e| 最小で紐付け、閾値 ε 以内のみ）。
* **判定**：各 `e` に対して、対応する `m` が `|m-e| ≤ ε` なら **OK**、なければ **NG**。
* **εの扱い**：MVPでは `const EPSILON_MS = 60` のように**コード内に定義**。将来は設定画面から調整可能。
* **レポート**：OK/NG合計、小節ごとの正答率（%）。

## 10. 実装雛形案（ディレクトリ構成例） 実装雛形案（ディレクトリ構成例）

```
app/
  (pages)/play/page.tsx       # プレイ画面（CSR）
  (pages)/calibrate/page.tsx  # レイテンシ較正UI
lib/
  score/parser.ts             # 譜面JSON→オンセット生成
  audio/engine.ts             # Tone.js制御
  input/tap.ts                # タップ入力
  input/clap.worklet.ts       # 手拍子検出（将来）
  scoring/align.ts            # 整列・採点
  store/useAppStore.ts        # Zustand状態管理（localStorage永続）
  pwa/register-sw.ts          # Service Worker登録
```

## 11. リリース計画

* **MVP（クライアント完結）**（2–3 週間目安）

  * 1譜例固定、タップ入力のみ、採点と結果表示、レイテンシ較正
  * **サーバ・DB・認証なし**。全データは一時メモリ/ローカル保存
* **v0.2**

  * マイク入力（手拍子）追加、課題5–10に拡充、ローカル履歴UI
* **v0.3（将来）**

  * PWA（オフライン対応・SW更新制御）導入
  * 任意クラウド同期、講師用の簡易共有リンク

## 12. リスク / 対策

* **iOS Safari の制約**：AudioWorklet/Autoplay → ユーザー操作後に初期化、Fallback 実装
* **環境ノイズ**：ハイパス、移動平均、ピーク間隔リミット
* **端末差による遅延**：較正必須、端末プロファイル永続化

## 13. 受け入れ基準（MVP）

* 主要ブラウザでタップ入力→採点→結果表示が一貫して動作（オンライン前提）
* サーバ不在でも設定（レイテンシ補正値）が端末内に保持される
* レイテンシ較正後、タップ命中判定の体感ズレが許容範囲（ユーザー評価）

---

## 14. 譜面JSONスキーマ（最小）

**目的**：4分・8分・16分・シンコペに対応し、**単声リズム**の「打点（オンセット）」のみを判定対象にする最小構成。

### 設計方針

* **単声のみ**（複数声部なし）。
* **小節内相対位置**：`beat` を 1.0 起点で表現（4/4 の 8分裏は 1.5、16分は 1.25 等）。
* **長さ**：`dur` は **拍（Quarter=1.0）単位**。4分=1.0、8分=0.5、16分=0.25。
* **シンコペ**：タイで持続を表現。**打点は開始のみ**、タイ継続は `onset:false`。
* **誤差許容**：MVPは**コード内定数** `EPSILON_MS` を使用（例：60ms）。

### TypeScript 型（最小）

```ts
export type TimeSig = { beats: number; beatValue: number }; // 4/4 → {beats:4, beatValue:4}

export type NoteEvent = {
  /** 小節番号（1始まり） */
  bar: number;
  /** 小節内の開始拍。拍頭=1.0, 8分裏=1.5, 16分=1.25 等 */
  beat: number;
  /** 長さ（拍単位）。4分=1, 8分=0.5, 16分=0.25 */
  dur: number;
  /** その位置で叩くかどうか（タイ継続など開始打点が無い場合は false） */
  onset: boolean; // true=叩く, false=叩かない（継続）
  /** アクセント等（MVPでは未使用） */
  accent?: boolean;
};

export type Score = {
  id: string;
  title: string;
  timeSig: TimeSig; // 例: {beats:4, beatValue:4}
  tempo: number;    // BPM
  bars: number;     // 小節数
  notes: NoteEvent[]; // 単声リズム。
};
```

> **判定**：各 `NoteEvent` の `onset:true` のみをOK/NG対象とし、`|measured - expected| ≤ EPSILON_MS` なら **OK**。

---

## 15. ドリル例（最小JSON）

> いずれも 4/4。`dur` は拍単位。`onset:false` は**タイ継続**等で“叩かない”位置。

### A) 4分音符（Quarter）

```json
{
  "id": "drill_quarter_4_4_1",
  "title": "4分音符 基本",
  "timeSig": { "beats": 4, "beatValue": 4 },
  "tempo": 100,
  "bars": 1,
  "notes": [
    { "bar": 1, "beat": 1.0, "dur": 1.0, "onset": true },
    { "bar": 1, "beat": 2.0, "dur": 1.0, "onset": true },
    { "bar": 1, "beat": 3.0, "dur": 1.0, "onset": true },
    { "bar": 1, "beat": 4.0, "dur": 1.0, "onset": true }
  ]
}
```

### B) 8分音符（Eighth）

```json
{
  "id": "drill_eighth_4_4_1",
  "title": "8分音符 まっすぐ",
  "timeSig": { "beats": 4, "beatValue": 4 },
  "tempo": 100,
  "bars": 1,
  "notes": [
    { "bar": 1, "beat": 1.0,  "dur": 0.5, "onset": true },
    { "bar": 1, "beat": 1.5,  "dur": 0.5, "onset": true },
    { "bar": 1, "beat": 2.0,  "dur": 0.5, "onset": true },
    { "bar": 1, "beat": 2.5,  "dur": 0.5, "onset": true },
    { "bar": 1, "beat": 3.0,  "dur": 0.5, "onset": true },
    { "bar": 1, "beat": 3.5,  "dur": 0.5, "onset": true },
    { "bar": 1, "beat": 4.0,  "dur": 0.5, "onset": true },
    { "bar": 1, "beat": 4.5,  "dur": 0.5, "onset": true }
  ]
}
```

### C) 16分音符（Sixteenth）

```json
{
  "id": "drill_sixteenth_4_4_1",
  "title": "16分音符 基本",
  "timeSig": { "beats": 4, "beatValue": 4 },
  "tempo": 80,
  "bars": 1,
  "notes": [
    { "bar": 1, "beat": 1.00, "dur": 0.25, "onset": true },
    { "bar": 1, "beat": 1.25, "dur": 0.25, "onset": true },
    { "bar": 1, "beat": 1.50, "dur": 0.25, "onset": true },
    { "bar": 1, "beat": 1.75, "dur": 0.25, "onset": true },
    { "bar": 1, "beat": 2.00, "dur": 0.25, "onset": true },
    { "bar": 1, "beat": 2.25, "dur": 0.25, "onset": true },
    { "bar": 1, "beat": 2.50, "dur": 0.25, "onset": true },
    { "bar": 1, "beat": 2.75, "dur": 0.25, "onset": true },
    { "bar": 1, "beat": 3.00, "dur": 0.25, "onset": true },
    { "bar": 1, "beat": 3.25, "dur": 0.25, "onset": true },
    { "bar": 1, "beat": 3.50, "dur": 0.25, "onset": true },
    { "bar": 1, "beat": 3.75, "dur": 0.25, "onset": true },
    { "bar": 1, "beat": 4.00, "dur": 0.25, "onset": true },
    { "bar": 1, "beat": 4.25, "dur": 0.25, "onset": true },
    { "bar": 1, "beat": 4.50, "dur": 0.25, "onset": true },
    { "bar": 1, "beat": 4.75, "dur": 0.25, "onset": true }
  ]
}
```

### D) シンコペーション（Syncopation：タイで拍を跨ぐ）

> 例：2拍目裏で開始し、3拍目頭へ**タイ継続**（3拍目頭は**叩かない**）。

```json
{
  "id": "drill_sync_4_4_1",
  "title": "シンコペーション 基本",
  "timeSig": { "beats": 4, "beatValue": 4 },
  "tempo": 90,
  "bars": 1,
  "notes": [
    { "bar": 1, "beat": 1.0, "dur": 0.5,  "onset": true },   
    { "bar": 1, "beat": 1.5, "dur": 1.0,  "onset": true },   
    { "bar": 1, "beat": 2.0, "dur": 1.0,  "onset": false },  
    { "bar": 1, "beat": 3.5, "dur": 0.5,  "onset": true },   
    { "bar": 1, "beat": 4.0, "dur": 0.5,  "onset": true }
  ]
}
```

> 上記では `beat:1.5` のノートが **2拍目を跨いで3拍目頭まで**伸び、`beat:2.0` は**叩かない（onset:false）**で継続を表しています。

---

### 実装メモ

* 期待オンセット列は `notes.filter(n => n.onset)` の開始時刻（Tempoと拍→ms換算）で生成。
* VexFlow描画では `tie` を使うか、開始音符＋タイ記号を明示（UI用のメタ情報は将来拡張）。
* 浮動小数の丸め誤差対策で `beat` を `Number((value).toFixed(2))` 程度に丸めるか、必要なら将来**PPQ**（例：960ticks/四分）へ移行可能。

---

### ToDo（初期）

* [ ] 上記スキーマに沿った**型定義とバリデータ**（zod など）
* [ ] ドリル4種（4分/8分/16分/シンコペ）を `data/scores/*.json` に配置
* [ ] `scoreParser`：`onset:true` のみから期待オンセット列を生成
* [ ] VexFlow描画：`onset:false` は**タイ継続**として描画
* [ ] 採点UI：各音符ヘッドに OK/NG オーバーレイ
