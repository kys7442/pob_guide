import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "사이트 소개 - PoE 빌드 가이드",
  description:
    "PoE 빌드 가이드는 Path of Exile 빌드를 AI로 분석하고, 초보자부터 고수까지 맞춤형 한국어 해설을 제공하는 무료 팬 사이트입니다.",
};

export default function AboutPage() {
  return (
    <article className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-black text-white mb-2">
        <span className="text-amber-400">PoE</span> 빌드 가이드 소개
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Path of Exile 한국어 빌드 분석 및 시세 정보 사이트
      </p>

      <div className="space-y-8">
        {/* 사이트 소개 */}
        <section className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-3">이 사이트는 무엇인가요?</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            PoE 빌드 가이드는 Path of Exile(PoE)을 즐기는 한국어 사용자를 위한
            <strong className="text-white"> 무료 빌드 분석 도구</strong>입니다.
            Path of Building(PoB) 코드나 poe.ninja URL만 입력하면,
            AI가 빌드를 분석하여 한국어로 상세한 해설을 제공합니다.
          </p>
        </section>

        {/* 주요 기능 */}
        <section className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-4">주요 기능</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <FeatureCard
              title="AI 빌드 분석"
              description="Google Gemini AI가 빌드를 분석하여 강점, 약점, 개선점을 한국어로 설명합니다. 초보자·중급자·고수에 맞춘 난이도별 평가를 제공합니다."
            />
            <FeatureCard
              title="실시간 시세 정보"
              description="poe.ninja 데이터를 기반으로 커런시, 고유 아이템, 스킬 젬 등의 시세를 카오스와 디바인 환산으로 동시 제공합니다."
            />
            <FeatureCard
              title="빌드 순위"
              description="poe.ninja의 상위 빌드 순위를 DPS, 생명력, EHP 등 다양한 기준으로 필터링하여 확인할 수 있습니다."
            />
            <FeatureCard
              title="완전한 한국어 지원"
              description="클래스, 어센던시, 스킬, 키스톤, 장비 슬롯 등 200개 이상의 게임 용어를 한국어로 번역하여 표시합니다."
            />
            <FeatureCard
              title="패시브 트리 시각화"
              description="선택한 패시브 노드와 키스톤을 시각적으로 보여주며, 각 키스톤의 효과를 한국어로 설명합니다."
            />
            <FeatureCard
              title="거래소 가격 연동"
              description="장비 분석 시 공식 거래소에서 유사 아이템의 예상 가격을 조회하여 예산 계획에 도움을 줍니다."
            />
          </div>
        </section>

        {/* 지원 게임 버전 */}
        <section className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-3">지원 게임 버전</h2>
          <div className="flex gap-3">
            <span className="px-3 py-1.5 rounded-lg text-sm bg-amber-900/40 border border-amber-700 text-amber-300 font-medium">
              Path of Exile 1
            </span>
            <span className="px-3 py-1.5 rounded-lg text-sm bg-purple-900/40 border border-purple-700 text-purple-300 font-medium">
              Path of Exile 2
            </span>
          </div>
        </section>

        {/* 데이터 출처 */}
        <section className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-3">데이터 출처</h2>
          <ul className="text-sm text-gray-400 space-y-2">
            <li>
              <strong className="text-gray-200">시세 및 빌드 순위:</strong>{" "}
              <a href="https://poe.ninja" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline">
                poe.ninja
              </a>
            </li>
            <li>
              <strong className="text-gray-200">아이템 가격 조회:</strong>{" "}
              Path of Exile 공식 거래소 API
            </li>
            <li>
              <strong className="text-gray-200">AI 분석:</strong>{" "}
              Google Gemini API
            </li>
            <li>
              <strong className="text-gray-200">패시브 트리:</strong>{" "}
              Grinding Gear Games 공식 데이터
            </li>
          </ul>
        </section>

        {/* 면책 */}
        <section className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-3">안내 사항</h2>
          <ul className="text-sm text-gray-400 space-y-1.5">
            <li>본 사이트는 <strong className="text-gray-200">비공식 팬 프로젝트</strong>입니다.</li>
            <li>Path of Exile은 Grinding Gear Games Pty Ltd의 등록상표입니다.</li>
            <li>Grinding Gear Games와 제휴·후원 관계가 아닙니다.</li>
            <li>AI 분석 결과는 참고용이며, 실제 게임 내 성능과 차이가 있을 수 있습니다.</li>
          </ul>
        </section>

        {/* 왜 만들었나 */}
        <section className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-3">왜 만들었나요?</h2>
          <p className="text-sm text-gray-300 leading-relaxed mb-3">
            Path of Exile은 빌드의 자유도가 높은 만큼, 정보의 양도 방대합니다.
            영어로 된 빌드 가이드와 분석 도구는 많지만, 한국어 사용자를 위한
            통합 도구는 부족했습니다.
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">
            이 사이트는 PoB 코드 분석, 실시간 시세, 빌드 순위, AI 해설까지
            한국어 PoE 유저가 필요로 하는 핵심 정보를 한곳에서 제공하기 위해
            만들어졌습니다. 초보자도 쉽게 빌드를 이해하고, 숙련자도 빠르게
            정보를 확인할 수 있는 것이 목표입니다.
          </p>
        </section>

        {/* 만든 사람 */}
        <section className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-3">만든 사람</h2>
          <p className="text-sm text-gray-300 leading-relaxed mb-3">
            PoE 빌드 가이드는 Path of Exile을 오랫동안 즐겨온 한국인 개발자가
            운영하는 개인 팬 프로젝트입니다. 매 리그마다 빌드를 분석하고 시세를
            확인하면서 쌓은 경험을 바탕으로, 한국어 사용자에게 실질적으로
            도움이 되는 도구를 만들고자 합니다.
          </p>
          <p className="text-sm text-gray-400">
            사이트 개선 아이디어나 오류 제보는 언제든 환영합니다.
          </p>
        </section>

        {/* 연락처 */}
        <section className="bg-gray-900 border border-gray-700 rounded-xl p-6">
          <h2 className="text-lg font-bold text-white mb-3">문의</h2>
          <p className="text-sm text-gray-400">
            사이트 관련 문의, 버그 제보, 기능 요청은 아래 이메일로 보내주세요.
          </p>
          <p className="mt-2">
            <a href="mailto:kys7442@naver.com" className="text-amber-400 hover:text-amber-300 font-medium">
              kys7442@naver.com
            </a>
          </p>
        </section>
      </div>
    </article>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-4">
      <h3 className="text-sm font-bold text-amber-400 mb-1.5">{title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
    </div>
  );
}
