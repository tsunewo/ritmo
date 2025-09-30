import { Metadata } from "next";

import { TapTrainer } from "@/components/tap-trainer";

export const metadata: Metadata = {
  title: "プレイ | Ritmo",
  description: "テンポに合わせてタップし、リズム精度を採点する練習モードです。",
};

export default function PlayPage() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-16 pt-12 sm:px-6 lg:px-8">
      <TapTrainer />
    </main>
  );
}
