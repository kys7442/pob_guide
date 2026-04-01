import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import SeasonSelector from "@/components/SeasonSelector";
import SpeculationRules from "@/components/SpeculationRules";
import BfcacheOptimizer from "@/components/BfcacheOptimizer";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://poe-build.guide";

export const metadata: Metadata = {
  title: {
    default: "PoE 빌드 가이드 - Path of Exile 한국어 빌드 분석",
    template: "%s | PoE 빌드 가이드",
  },
  description:
    "Path of Building 코드 또는 poe.ninja URL을 입력하면 AI가 빌드를 한국어로 분석해드립니다. 초보자부터 고수까지 맞춤형 빌드 해설, 실시간 시세 정보, 패시브 트리 시각화를 제공합니다.",
  keywords: [
    "Path of Exile",
    "PoE",
    "빌드 가이드",
    "빌드 분석",
    "Path of Building",
    "PoB",
    "poe.ninja",
    "시세",
    "디바인 오브",
    "카오스 오브",
    "패시브 트리",
    "한국어",
  ],
  authors: [{ name: "PoE 빌드 가이드", url: baseUrl }],
  creator: "kys7442@naver.com",
  metadataBase: new URL(baseUrl),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: baseUrl,
    siteName: "PoE 빌드 가이드",
    title: "PoE 빌드 가이드 - Path of Exile 한국어 빌드 분석",
    description:
      "AI 기반 빌드 분석, 실시간 시세 정보, 초보자~고수 맞춤 해설을 제공하는 한국어 PoE 팬 사이트",
  },
  twitter: {
    card: "summary",
    title: "PoE 빌드 가이드 - Path of Exile 한국어 빌드 분석",
    description:
      "AI 기반 빌드 분석, 실시간 시세 정보, 초보자~고수 맞춤 해설을 제공하는 한국어 PoE 팬 사이트",
  },
  alternates: {
    canonical: baseUrl,
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3568835154047233"
          crossOrigin="anonymous"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "PoE 빌드 가이드",
              alternateName: "Path of Exile 한국어 빌드 분석",
              url: baseUrl,
              description:
                "AI 기반 Path of Exile 빌드 분석, 실시간 시세 정보, 초보자~고수 맞춤 한국어 해설을 제공하는 팬 사이트",
              inLanguage: "ko",
              publisher: {
                "@type": "Organization",
                name: "PoE 빌드 가이드",
                email: "kys7442@naver.com",
              },
            }),
          }}
        />
        <SpeculationRules />
      </head>
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        <BfcacheOptimizer />
        <Providers>
          <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
              <a href="/" className="flex items-center gap-2 group flex-shrink-0">
                <div className="w-8 h-8 rounded bg-amber-600 flex items-center justify-center text-black font-black text-sm group-hover:bg-amber-500 transition-colors">
                  PoE
                </div>
                <span className="font-bold text-amber-400 group-hover:text-amber-300 transition-colors hidden sm:inline">
                  빌드 가이드
                </span>
              </a>
              <nav className="flex items-center gap-0.5 ml-3">
                <a href="/" className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-amber-400 hover:bg-gray-800 transition-colors whitespace-nowrap">
                  시세
                </a>
                <a href="/pob" className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-amber-400 hover:bg-gray-800 transition-colors whitespace-nowrap">
                  빌드 분석
                </a>
                <a href="/ninja" className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-amber-400 hover:bg-gray-800 transition-colors whitespace-nowrap">
                  빌드 순위
                </a>
                <a href="/guides" className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-amber-400 hover:bg-gray-800 transition-colors whitespace-nowrap hidden sm:inline-block">
                  가이드
                </a>
                <a href="/about" className="px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-amber-400 hover:bg-gray-800 transition-colors whitespace-nowrap hidden sm:inline-block">
                  소개
                </a>
              </nav>
              <div className="ml-auto">
                <SeasonSelector />
              </div>
            </div>
          </header>
          <main className="w-full max-w-6xl mx-auto px-4 py-8">{children}</main>
          <footer className="border-t border-gray-800 mt-16 py-8 text-center text-xs text-gray-600 space-y-3">
            {/* 푸터 내비게이션 */}
            <nav className="flex justify-center gap-4 text-gray-500">
              <a href="/about" className="hover:text-amber-400 transition-colors">소개</a>
              <a href="/guides" className="hover:text-amber-400 transition-colors">가이드</a>
              <a href="/privacy" className="hover:text-amber-400 transition-colors">개인정보처리방침</a>
              <a href="/terms" className="hover:text-amber-400 transition-colors">이용약관</a>
              <a href="mailto:kys7442@naver.com" className="hover:text-amber-400 transition-colors">문의</a>
            </nav>
            <p className="text-gray-400 font-medium">
              © 2026 <a href="mailto:kys7442@naver.com" className="text-amber-500 hover:text-amber-400 transition-colors">kys7442@naver.com</a>. All rights reserved.
            </p>
            <p>
              본 사이트 및 동일한 기능·구성에 대한 저작권은 <strong className="text-gray-300">kys7442@naver.com</strong>에게 있습니다.
              무단 복제, 배포, 상업적 이용을 금합니다.
            </p>
            <p className="pt-2 border-t border-gray-800">
              PoE 빌드 가이드 — 비공식 팬 프로젝트. Path of Exile은 Grinding Gear Games의 등록상표입니다.
              <br />
              시세 데이터 출처: <a href="https://poe.ninja" target="_blank" rel="noopener noreferrer" className="text-amber-500/70 hover:text-amber-400 transition-colors">poe.ninja</a>
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
