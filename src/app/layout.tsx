import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TOEIC Study Planner",
  description: "TOEICの目標スコアから毎日の学習タスクを作成するプランナー",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
