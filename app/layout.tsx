import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "행운 로또번호 생성기 - 오늘의 추천 로또 번호",
  description: "AI 운세 기반으로 추천된 행운의 로또 번호를 생성해보세요! 매주 당첨 번호 분석과 통계 포함!",
  keywords: ["로또번호", "로또 생성기", "운세 기반 로또", "행운 번호", "로또 분석", "AI 로또 추천"],
  authors: [{ name: "Lotto Wizard" }],
  generator: "Next.js",
  applicationName: "행운 로또 생성기",
  openGraph: {
    title: "행운 로또번호 생성기 - 오늘의 추천 로또 번호",
    description: "AI 운세 기반으로 추천된 행운의 로또 번호를 생성해보세요! 통계와 분석 포함!",
    url: "https://lotto.winmoa.net",
    siteName: "LuckyLotto",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "행운 로또번호 생성기",
    description: "AI 기반 로또 추천번호! 오늘의 행운은 당신의 것!",
    creator: "@your_twitter",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
