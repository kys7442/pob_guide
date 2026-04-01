import type { Metadata } from "next";
import HomeCurrencyTicker from "@/components/HomeCurrencyTicker";
import AdSense from "@/components/AdSense";
import { guides } from "@/content/guides";

export const metadata: Metadata = {
  title: "PoE 빌드 가이드 - Path of Exile 한국어 빌드 분석 · 실시간 시세",
  description:
    "Path of Exile 한국어 빌드 분석, 실시간 시세 정보, 빌드 순위를 제공합니다. PoB 코드를 입력하면 AI가 빌드를 분석해드립니다.",
};

export default function HomePage() {
  const latestGuides = guides.slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto">
      {/* 히어로 섹션 */}
      <section className="text-center mb-12">
        <h1 className="text-3xl font-black text-white mb-4">
          <span className="text-amber-400">PoE</span> 빌드 가이드
        </h1>
        <p className="text-sm text-gray-300 leading-relaxed max-w-2xl mx-auto">
          <strong className="text-white">PoE 빌드 가이드</strong>는 Path of Exile을 즐기는
          한국어 사용자를 위한 종합 빌드 분석 및 시세 정보 사이트입니다.
          Path of Building(PoB) 코드나 poe.ninja URL을 입력하면 AI가 빌드를 분석하여
          한국어로 상세한 해설을 제공합니다. 초보자부터 숙련된 유저까지,
          빌드 선택과 육성에 필요한 모든 정보를 한곳에서 확인하세요.
        </p>
        <p className="text-xs text-gray-500 mt-3">
          실시간 시세 확인 · AI 빌드 분석 · 메타 빌드 순위 · 패시브 트리 시각화
        </p>
      </section>

      {/* 사이트 활용 가이드 - 3 카드 */}
      <section className="mb-12">
        <h2 className="text-lg font-bold text-white mb-4">사이트 주요 기능</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a href="#currency-ticker" className="bg-gray-900 border border-gray-700 rounded-xl p-5 hover:border-amber-600 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center mb-3">
              <span className="text-amber-400 text-lg font-black">₡</span>
            </div>
            <h3 className="text-sm font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">실시간 시세 정보</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              poe.ninja 데이터 기반으로 커런시, 고유 아이템, 갑충석, 스킬 젬 등의 시세를
              카오스와 디바인 환산으로 실시간 제공합니다. 10분마다 자동 갱신되어 항상 최신 가격을 확인할 수 있습니다.
            </p>
          </a>
          <a href="/pob" className="bg-gray-900 border border-gray-700 rounded-xl p-5 hover:border-amber-600 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-sky-600/20 flex items-center justify-center mb-3">
              <span className="text-sky-400 text-lg font-black">AI</span>
            </div>
            <h3 className="text-sm font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">AI 빌드 분석</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              PoB 코드 또는 poe.ninja URL을 입력하면 빌드의 스킬 구성, 장비 세팅, 패시브 트리를
              한국어로 분석합니다. Google Gemini AI가 빌드의 강점, 약점, 개선점까지 평가해드립니다.
            </p>
          </a>
          <a href="/ninja" className="bg-gray-900 border border-gray-700 rounded-xl p-5 hover:border-amber-600 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center mb-3">
              <span className="text-emerald-400 text-lg font-black">#</span>
            </div>
            <h3 className="text-sm font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">빌드 순위</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              현재 리그의 상위 래더 빌드 통계를 확인할 수 있습니다. 어센던시별, 클래스별 점유율과
              트렌드를 분석하여 메타 빌드를 파악하고 리그 스타터를 선택하는 데 활용하세요.
            </p>
          </a>
        </div>
      </section>

      {/* 현재 리그 소개 */}
      <section className="mb-12">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-3">Path of Exile 시세와 빌드 트렌드</h2>
          <div className="text-sm text-gray-300 leading-relaxed space-y-3">
            <p>
              Path of Exile은 약 3개월마다 새로운 리그(시즌)가 시작되며, 매 리그마다 새로운 메커니즘과
              밸런스 변경이 적용됩니다. 리그가 시작되면 모든 플레이어가 새 캐릭터로 시작하기 때문에,
              게임 내 경제도 처음부터 형성됩니다.
            </p>
            <p>
              리그 초반에는 화폐 공급이 적어 디바인 오브와 카오스 오브의 환율이 불안정하며,
              핵심 고유 아이템의 가격이 매우 높습니다. 리그가 진행될수록 경제가 안정되고,
              메타 빌드도 점차 확립됩니다. 아래 시세 현황에서 현재 아이템 가격을 확인해보세요.
            </p>
          </div>
        </div>
      </section>

      {/* AdSense 광고 */}
      <div className="mb-8">
        <AdSense adSlot="1234567890" />
      </div>

      {/* 시세 티커 */}
      <section id="currency-ticker" className="mb-12">
        <div className="max-w-2xl mx-auto">
          <HomeCurrencyTicker />
        </div>
      </section>

      {/* 최신 가이드 미리보기 */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">초보자 가이드</h2>
          <a href="/guides" className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
            모든 가이드 보기 →
          </a>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {latestGuides.map((guide) => (
            <a
              key={guide.slug}
              href={`/guides/${guide.slug}`}
              className="bg-gray-900 border border-gray-700 rounded-xl p-5 hover:border-amber-600 transition-colors group"
            >
              <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400 mb-3">
                {guide.categoryLabel}
              </span>
              <h3 className="text-sm font-bold text-white mb-2 group-hover:text-amber-400 transition-colors leading-snug">
                {guide.title}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-2">{guide.description}</p>
            </a>
          ))}
        </div>
      </section>

      {/* 하단 AdSense */}
      <div className="mb-4">
        <AdSense adSlot="1234567891" />
      </div>
    </div>
  );
}
