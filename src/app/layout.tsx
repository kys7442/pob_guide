import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import SeasonSelector from "@/components/SeasonSelector";
import AdSense from "@/components/AdSense";

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
      </head>
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        <Providers>
          <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-40">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
              <a href="/" className="flex items-center gap-2 group">
                <div className="w-8 h-8 rounded bg-amber-600 flex items-center justify-center text-black font-black text-sm group-hover:bg-amber-500 transition-colors">
                  PoE
                </div>
                <span className="font-bold text-amber-400 group-hover:text-amber-300 transition-colors">
                  빌드 가이드
                </span>
              </a>
              <span className="text-gray-600 text-sm hidden sm:inline">
                — Path of Exile 한국어 빌드 분석기
              </span>
              <div className="ml-auto">
                <SeasonSelector />
              </div>
            </div>
          </header>
          {/* 공지 배너 */}
          <div className="bg-amber-950/60 border-b border-amber-800/40 text-center py-1.5 px-4">
            <p className="text-xs text-amber-300/80">
              ⚠️ 이 사이트는 계속 보완 중이며, 특히 한글화가 안 된 경우 <strong className="text-amber-200">영문명으로 검색</strong>하셔야 합니다.
            </p>
          </div>
          {/* 3-column: 좌측광고 | 콘텐츠 | 우측광고 */}
          <div className="flex justify-center items-start gap-0">
            {/* 좌측 광고 — 1440px 이상에서만 표시 */}
            <aside className="hidden 2xl:flex flex-col items-center pt-8 w-[160px] shrink-0 sticky top-[57px] self-start">
              <AdSense
                adSlot="YOUR_LEFT_AD_SLOT_ID"
                adFormat="vertical"
                style={{ width: 160, height: 600 }}
              />
            </aside>

            <main className="w-full max-w-6xl px-4 py-8 min-w-0">{children}</main>

            {/* 우측 광고 — 1440px 이상에서만 표시 */}
            <aside className="hidden 2xl:flex flex-col items-center pt-8 w-[160px] shrink-0 sticky top-[57px] self-start">
              <AdSense
                adSlot="YOUR_RIGHT_AD_SLOT_ID"
                adFormat="vertical"
                style={{ width: 160, height: 600 }}
              />
            </aside>
          </div>
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
