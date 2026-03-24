import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침 - PoE 빌드 가이드",
  description: "PoE 빌드 가이드의 개인정보처리방침입니다. 수집하는 정보, 이용 목적, 보관 기간 등을 안내합니다.",
};

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto prose prose-invert prose-sm">
      <h1 className="text-2xl font-black text-white mb-6">개인정보처리방침</h1>
      <p className="text-xs text-gray-500 mb-8">최종 수정일: 2026년 3월 24일</p>

      <section className="space-y-6 text-gray-300 text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-bold text-white mb-2">1. 개요</h2>
          <p>
            PoE 빌드 가이드(이하 &quot;본 사이트&quot;)는 이용자의 개인정보를 중요시하며,
            「개인정보 보호법」을 준수합니다. 본 개인정보처리방침은 이용자가 제공한 개인정보가
            어떤 용도와 방식으로 이용되고 있으며, 개인정보 보호를 위해 어떤 조치가 취해지고 있는지
            알려드립니다.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-2">2. 수집하는 개인정보</h2>
          <p>본 사이트는 별도의 회원가입 절차 없이 대부분의 콘텐츠를 이용할 수 있습니다.</p>
          <h3 className="text-base font-semibold text-gray-200 mt-3 mb-1">자동으로 수집되는 정보</h3>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>IP 주소, 브라우저 종류, 운영체제</li>
            <li>방문 일시, 페이지 조회 기록</li>
            <li>쿠키(Cookie) 정보</li>
          </ul>
          <h3 className="text-base font-semibold text-gray-200 mt-3 mb-1">이용자가 직접 제공하는 정보</h3>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>Path of Building(PoB) 빌드 코드 (분석 목적으로만 사용, 서버에 저장하지 않음)</li>
            <li>poe.ninja 캐릭터 URL (분석 목적으로만 사용, 서버에 저장하지 않음)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-2">3. 개인정보의 이용 목적</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>서비스 제공 및 콘텐츠 표시</li>
            <li>사이트 이용 통계 분석 및 서비스 개선</li>
            <li>광고 게재 (Google AdSense)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-2">4. 쿠키(Cookie) 사용</h2>
          <p>
            본 사이트는 이용자의 편의를 위해 쿠키를 사용합니다. 쿠키는 웹사이트가 이용자의
            브라우저에 전송하는 소량의 텍스트 파일입니다.
          </p>
          <h3 className="text-base font-semibold text-gray-200 mt-3 mb-1">쿠키 사용 목적</h3>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>이용자의 사이트 이용 패턴 분석</li>
            <li>맞춤형 광고 제공 (Google AdSense)</li>
            <li>사이트 기능 개선</li>
          </ul>
          <p className="mt-2">
            이용자는 브라우저 설정에서 쿠키를 허용하거나 거부할 수 있습니다.
            다만, 쿠키 저장을 거부할 경우 일부 서비스 이용에 제한이 있을 수 있습니다.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-2">5. Google AdSense 및 제3자 광고</h2>
          <p>
            본 사이트는 Google AdSense를 통해 광고를 게재합니다.
            Google은 이용자의 관심사에 맞는 광고를 표시하기 위해 쿠키를 사용할 수 있습니다.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>
              Google의 광고 쿠키 사용에 대한 자세한 내용은{" "}
              <a
                href="https://policies.google.com/technologies/ads"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 underline"
              >
                Google 광고 정책
              </a>
              을 참고하세요.
            </li>
            <li>
              이용자는{" "}
              <a
                href="https://adssettings.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:text-amber-300 underline"
              >
                Google 광고 설정
              </a>
              에서 맞춤 광고를 비활성화할 수 있습니다.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-2">6. 개인정보의 보관 및 파기</h2>
          <p>
            본 사이트는 이용자가 입력한 빌드 코드나 URL을 서버에 영구 저장하지 않습니다.
            분석 요청 시 일시적으로 처리되며, 처리 완료 후 서버 메모리에서 즉시 삭제됩니다.
          </p>
          <p className="mt-2">
            서버 로그(접속 기록)는 보안 및 서비스 개선 목적으로 최대 90일간 보관 후 파기합니다.
          </p>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-2">7. 이용자의 권리</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-400">
            <li>쿠키 수집 거부: 브라우저 설정에서 쿠키를 차단할 수 있습니다.</li>
            <li>맞춤 광고 비활성화: Google 광고 설정에서 변경할 수 있습니다.</li>
            <li>개인정보 관련 문의: 아래 연락처로 문의해 주세요.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-2">8. 개인정보 보호책임자</h2>
          <ul className="list-none space-y-1 text-gray-400">
            <li>이메일: <a href="mailto:kys7442@naver.com" className="text-amber-400 hover:text-amber-300">kys7442@naver.com</a></li>
          </ul>
        </div>

        <div>
          <h2 className="text-lg font-bold text-white mb-2">9. 개인정보처리방침 변경</h2>
          <p>
            본 개인정보처리방침은 법령 및 서비스 변경사항에 따라 수정될 수 있으며,
            변경 시 사이트 공지를 통해 안내드립니다.
          </p>
        </div>
      </section>
    </article>
  );
}
