import type { Metadata } from "next";
import NinjaBuilds from "./NinjaBuilds";
import AdSense from "@/components/AdSense";

export const metadata: Metadata = {
  title: "PoE 빌드 순위 - 메타 빌드 통계 및 트렌드",
  description:
    "Path of Exile 현재 리그의 상위 래더 빌드 순위를 확인하세요. 어센던시별, 클래스별 점유율과 트렌드 분석으로 메타 빌드를 파악할 수 있습니다.",
};

export default function NinjaPage() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* 소개 콘텐츠 */}
      <section className="mb-8">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h1 className="text-xl font-black text-white mb-3">
            <span className="text-amber-400">PoE</span> 빌드 메타 순위
          </h1>
          <div className="text-sm text-gray-300 leading-relaxed space-y-3">
            <p>
              아래 순위는 poe.ninja에서 수집한 <strong className="text-white">상위 래더 캐릭터</strong>의
              빌드 통계입니다. 각 빌드의 점유율은 해당 어센던시와 메인 스킬 조합을 사용하는 캐릭터가
              전체 상위 래더에서 차지하는 비율을 나타냅니다.
            </p>
            <p>
              점유율이 높은 빌드는 현재 리그에서 검증된 효율적인 선택이지만,
              반드시 본인의 플레이 스타일과 예산에 맞는지 확인하세요.
              <strong className="text-white"> 트렌드 지표(▲▼)</strong>를 통해 최근 인기가
              오르거나 내리는 빌드를 파악할 수 있으며, 리그별(일반/하드코어/SSF) 비교를 통해
              각 환경에서의 메타 차이도 확인할 수 있습니다.
            </p>
          </div>
        </div>
      </section>

      {/* AdSense */}
      <div className="mb-6">
        <AdSense adSlot="1234567895" />
      </div>

      {/* 클라이언트 빌드 순위 */}
      <NinjaBuilds />
    </div>
  );
}
