import type { Metadata } from "next";
import PobForm from "./PobForm";
import AdSense from "@/components/AdSense";

export const metadata: Metadata = {
  title: "PoE 빌드 분석 - PoB 코드로 빌드 한국어 분석",
  description:
    "Path of Building 코드 또는 poe.ninja URL을 입력하면 AI가 빌드를 한국어로 분석해드립니다. 스킬 구성, 장비, 패시브 트리, DPS 등 빌드의 모든 정보를 확인하세요.",
};

export default function PobPage() {
  return (
    <div className="max-w-2xl mx-auto">
      {/* 소개 콘텐츠 */}
      <section className="mb-8">
        <h1 className="text-3xl font-black text-white mb-4 text-center">
          <span className="text-amber-400">PoE</span> 빌드 분석
        </h1>
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 mb-6">
          <h2 className="text-base font-bold text-white mb-3">빌드 분석이란?</h2>
          <p className="text-sm text-gray-300 leading-relaxed mb-3">
            Path of Exile의 빌드는 패시브 스킬 트리, 장비, 스킬 젬의 조합으로 구성됩니다.
            <strong className="text-white"> 빌드 분석 도구</strong>를 사용하면 복잡한 빌드 데이터를
            한국어로 정리된 형태로 한눈에 파악할 수 있습니다.
          </p>
          <p className="text-sm text-gray-300 leading-relaxed mb-3">
            Path of Building(PoB)에서 내보낸 코드 또는 poe.ninja 캐릭터 URL을 아래에 입력하세요.
            빌드의 클래스, DPS, 생명력, 저항 등 핵심 스탯부터 스킬 젬 구성, 장비 세팅,
            패시브 트리 키스톤까지 상세하게 분석합니다.
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">
            분석 후 <strong className="text-white">AI 빌드 분석 보고서</strong> 기능을 사용하면
            Google Gemini AI가 빌드의 강점, 약점, 난이도, 예산, 개선 방향까지
            종합적으로 평가해드립니다.
          </p>
        </div>
      </section>

      {/* 클라이언트 폼 */}
      <PobForm />

      {/* AdSense */}
      <div className="mt-6 mb-6">
        <AdSense adSlot="1234567894" />
      </div>

      {/* FAQ 섹션 */}
      <section className="mt-8">
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h2 className="text-base font-bold text-white mb-4">자주 묻는 질문</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-amber-400 mb-1">PoB 코드는 어디서 얻나요?</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Path of Building Community 프로그램에서 빌드를 불러온 후 &quot;Import/Export&quot; →
                &quot;Generate&quot; → &quot;Copy&quot;로 코드를 복사할 수 있습니다. 또는 빌드 가이드 게시물에서
                제공하는 PoB 코드를 사용하세요.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-400 mb-1">pobb.in URL도 사용할 수 있나요?</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                네, pobb.in 공유 링크(예: https://pobb.in/xxxxx)를 PoB 코드 입력란에 그대로 붙여넣으면
                자동으로 빌드 데이터를 가져와 분석합니다.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-400 mb-1">PoE 2 빌드도 분석되나요?</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                네, Path of Exile 1과 Path of Exile 2 모두 지원합니다. PoE 2 빌드의 경우
                일부 스킬 젬 번역이 제한될 수 있으나 기본적인 분석 기능은 동일하게 제공됩니다.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-amber-400 mb-1">분석 결과가 PoB과 다르면?</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                PoB에서 활성화한 설정(적 조건, 버프 등)에 따라 DPS 수치가 다를 수 있습니다.
                본 사이트는 PoB 코드에 저장된 설정을 기준으로 파싱하므로,
                기본 설정과의 차이가 발생할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
