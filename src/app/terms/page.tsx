import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 - PoE 빌드 가이드",
  description: "PoE 빌드 가이드의 이용약관입니다. 서비스 이용 조건과 면책 사항을 안내합니다.",
};

export default function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto prose prose-invert prose-sm">
      <h1 className="text-2xl font-black text-white mb-6">이용약관</h1>
      <p className="text-xs text-gray-500 mb-8">최종 수정일: 2026년 3월 24일</p>

      <section className="space-y-6 text-gray-300 text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-bold text-white mb-2">제1조 (목적)</h2>
          <p>
            본 약관은 PoE 빌드 가이드(이하 &quot;본 사이트&quot;)가 제공하는 서비스의 이용 조건 및
            절차, 이용자와 사이트 간의 권리·의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-2">제2조 (정의)</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>&quot;서비스&quot;란 본 사이트가 제공하는 Path of Exile 빌드 분석, 시세 조회, 빌드 순위 등 모든 기능을 말합니다.</li>
            <li>&quot;이용자&quot;란 본 사이트에 접속하여 서비스를 이용하는 모든 사람을 말합니다.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-2">제3조 (서비스의 내용)</h2>
          <p>본 사이트는 다음과 같은 서비스를 제공합니다:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>Path of Building(PoB) 코드 분석 및 한국어 빌드 해설</li>
            <li>AI 기반 빌드 평가 및 추천 (초보자/중급자/고급자별 분석)</li>
            <li>Path of Exile 아이템 시세 정보 (카오스/디바인 환산)</li>
            <li>poe.ninja 빌드 순위 조회</li>
            <li>패시브 트리 시각화 및 장비 정보 제공</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-2">제4조 (서비스 이용)</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>본 사이트는 별도의 회원가입 없이 누구나 무료로 이용할 수 있습니다.</li>
            <li>서비스는 24시간 운영을 원칙으로 하나, 시스템 점검 등의 사유로 일시 중단될 수 있습니다.</li>
            <li>외부 API(poe.ninja, poe.trade 등)의 장애로 인해 일부 기능이 제한될 수 있습니다.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-2">제5조 (지적재산권)</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>본 사이트의 디자인, 소스 코드, UI 구성에 대한 저작권은 운영자(kys7442@naver.com)에게 있습니다.</li>
            <li>Path of Exile은 Grinding Gear Games Pty Ltd의 등록상표입니다.</li>
            <li>본 사이트는 비공식 팬 프로젝트이며, Grinding Gear Games와 제휴 관계가 아닙니다.</li>
            <li>시세 데이터 출처: <a href="https://poe.ninja" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300">poe.ninja</a></li>
            <li>빌드 순위 데이터 출처: <a href="https://poe.ninja" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300">poe.ninja</a></li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-2">제6조 (면책 조항)</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>본 사이트에서 제공하는 빌드 분석 및 AI 평가는 참고 목적이며, 게임 내 실제 성능과 차이가 있을 수 있습니다.</li>
            <li>시세 정보는 실시간 데이터를 기반으로 하나, 실제 거래 가격과 차이가 있을 수 있습니다.</li>
            <li>외부 서비스(poe.ninja, Google Gemini 등)의 장애나 데이터 오류에 대해 본 사이트는 책임을 지지 않습니다.</li>
            <li>이용자가 본 사이트의 정보를 기반으로 내린 결정에 대해 본 사이트는 책임을 지지 않습니다.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-2">제7조 (광고)</h2>
          <p>
            본 사이트는 서비스 운영을 위해 Google AdSense를 통한 광고를 게재합니다.
            광고 내용은 Google의 정책에 따라 표시되며, 본 사이트는 개별 광고 내용에 대해
            책임을 지지 않습니다.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-2">제8조 (금지 행위)</h2>
          <p>이용자는 다음 행위를 해서는 안 됩니다:</p>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>본 사이트의 콘텐츠를 무단으로 복제, 배포, 상업적으로 이용하는 행위</li>
            <li>서비스의 안정적 운영을 방해하는 행위 (과도한 API 호출 등)</li>
            <li>자동화 도구를 이용한 대량 데이터 수집(스크래핑) 행위</li>
            <li>기타 관련 법령에 위반되는 행위</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-2">제9조 (약관의 변경)</h2>
          <p>
            본 약관은 서비스 변경 사항 또는 법령 개정에 따라 수정될 수 있으며,
            변경 시 사이트 내 공지를 통해 안내드립니다.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-2">제10조 (문의)</h2>
          <p>
            서비스 이용 관련 문의사항은 아래 연락처로 보내주세요.
          </p>
          <ul className="list-none space-y-1 text-gray-400 mt-2">
            <li>이메일: <a href="mailto:kys7442@naver.com" className="text-amber-400 hover:text-amber-300">kys7442@naver.com</a></li>
          </ul>
        </div>
      </section>
    </article>
  );
}
