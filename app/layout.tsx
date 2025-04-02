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
  title: "AI 로또번호 추천기 - 오늘의 당첨 예상 번호 무료 생성",
  description: "로또6/45 공식 통계 기반, AI 운세 알고리즘으로 오늘의 당첨 예측 번호를 무료로 받아보세요. 회차별 당첨 결과와 당첨자 수, 번호 빈도까지 완벽 분석!",
  keywords: [
    "로또번호 생성기",
    "AI 로또 예측",
    "로또 추천 번호",
    "로또 통계 분석",
    "로또6/45",
    "오늘의 로또 번호",
    "행운 번호 추천",
    "당첨 번호 예측",
    "로또 당첨 통계",
    "로또 당첨자 수"
  ],
  authors: [{ name: "LuckyLotto AI" }],
  generator: "Next.js",
  applicationName: "AI 로또 추천기",
  openGraph: {
    title: "오늘의 AI 로또번호 추천기 - 무료 당첨 예측!",
    description: "매주 바뀌는 당첨 번호, AI 알고리즘으로 예측! 로또 통계와 번호 빈도 분석까지 무료 제공!",
    url: "https://dhlottery.winmoa.net/",
    siteName: "LuckyLotto",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "오늘의 로또 예측번호 - AI 기반 추천",
    description: "당첨 번호는 과학이다! 로또 번호 AI 예측 무료 체험",
    creator: "@luckylotto_ai",
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        {/* ✅ Google Search Console 메타태그 */}
        <meta
          name="google-site-verification"
          content="JC6KrKMi8q8b_GYOZJZJslR312WKJPKqumhfnS3saw8"
        />
        {/* ✅ Naver 소유권 인증 메타 태그 (예시) */}
        <meta
          name="naver-site-verification"
          content="66eec4859c8e90b9957df442274af1403c512649"
        />
        {/* ✅ 기타 SEO 기본 */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
      </head>
      <body>{children}</body>
    </html>
  );
}
