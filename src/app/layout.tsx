import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import SeasonSelector from "@/components/SeasonSelector";
import SpeculationRules from "@/components/SpeculationRules";
import BfcacheOptimizer from "@/components/BfcacheOptimizer";

export const metadata: Metadata = {
  title: "PoE 빌드 가이드 - Path of Exile 한국어 빌드 분석",
  description:
    "Path of Building 코드 또는 poe.ninja URL을 입력하면 빌드를 한국어로 분석해드립니다. 패시브 트리, 스킬, 장비, 스탯을 한눈에 확인하세요.",
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
              </nav>
              <div className="ml-auto">
                <SeasonSelector />
              </div>
            </div>
          </header>
          {/* 공지 배너 */}
          <div className="bg-amber-950/60 border-b border-amber-800/40 text-center py-1.5 px-4">
            {/* <p className="text-xs text-amber-300/80">
              ⚠️ 이 사이트는 계속 보완 중이며, 특히 한글화가 안 된 경우 <strong className="text-amber-200">영문명으로 검색</strong>하셔야 합니다.
            </p> */}
          </div>
          <main className="w-full max-w-6xl mx-auto px-4 py-8">{children}</main>
          <footer className="border-t border-gray-800 mt-16 py-8 text-center text-xs text-gray-600 space-y-1.5">
            <p className="text-gray-400 font-medium">
              © 2026 <a href="mailto:kys7442@naver.com" className="text-amber-500 hover:text-amber-400 transition-colors">kys7442@naver.com</a>. All rights reserved.
            </p>
            <p>
              본 사이트 및 동일한 기능·구성에 대한 저작권은 <strong className="text-gray-300">kys7442@naver.com</strong>에게 있습니다.
            </p>
            <p>
              무단 복제, 배포, 상업적 이용을 금합니다.
            </p>
            <p className="pt-1 border-t border-gray-800 mt-3">
              PoE 빌드 가이드 — 비공식 팬 프로젝트. Path of Exile은 Grinding Gear Games의 등록상표입니다.
            </p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
