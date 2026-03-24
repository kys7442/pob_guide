"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Upload, Link } from "lucide-react";

export default function PobPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"pob" | "ninja">("pob");
  const [pobCode, setPobCode] = useState("");
  const [ninjaUrl, setNinjaUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [guideOpen, setGuideOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (activeTab === "pob") {
        if (!pobCode.trim()) { setError("PoB 코드를 입력해주세요."); return; }
        // URL에 직접 넣으면 nginx 버퍼(8k) 초과로 ERR_CONNECTION_CLOSED 발생
        // sessionStorage에 저장 후 이동
        sessionStorage.setItem("pobCode", pobCode.trim());
        router.push("/build?source=pob");
      } else {
        if (!ninjaUrl.trim()) { setError("poe.ninja URL을 입력해주세요."); return; }
        router.push(`/build?url=${encodeURIComponent(ninjaUrl.trim())}&source=ninja`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* 히어로 섹션 */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black text-white mb-2">
          <span className="text-amber-400">PoE</span> 빌드 분석
        </h1>
        <p className="text-gray-400">
          Path of Building 코드 또는 poe.ninja URL을 붙여넣으면
          <br />
          빌드를 <strong className="text-white">한국어</strong>로 분석해드립니다
        </p>
        <div className="flex justify-center gap-3 mt-3">
          <span className="px-2 py-1 rounded text-xs bg-amber-900/40 border border-amber-700 text-amber-300">PoE 1 지원</span>
          <span className="px-2 py-1 rounded text-xs bg-purple-900/40 border border-purple-700 text-purple-300">PoE 2 지원</span>
        </div>
      </div>

      {/* 입력 폼 */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-700">
          <TabButton active={activeTab === "pob"} onClick={() => setActiveTab("pob")} icon={<Upload className="w-4 h-4" />} label="PoB 코드 붙여넣기" />
          <TabButton active={activeTab === "ninja"} onClick={() => setActiveTab("ninja")} icon={<Link className="w-4 h-4" />} label="poe.ninja URL" />
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {activeTab === "pob" ? (
            <div>
              <label className="block text-sm text-gray-400 mb-2">Path of Building 내보내기 코드</label>
              <textarea
                value={pobCode}
                onChange={(e) => setPobCode(e.target.value)}
                placeholder="eNrtWmtz2jgU/Ss7+7Ud2xhj6H...  또는  https://pobb.in/uFe_URAUgtgI"
                className="w-full h-36 bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-600 font-mono resize-none focus:outline-none focus:border-amber-500 transition-colors"
                spellCheck={false}
              />
              <p className="text-xs text-gray-600 mt-1">
                PoB 코드 붙여넣기 또는{" "}
                <span className="text-amber-600/80">pobb.in URL</span> 입력 가능
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm text-gray-400 mb-2">poe.ninja 캐릭터 URL</label>
              <input
                type="url"
                value={ninjaUrl}
                onChange={(e) => setNinjaUrl(e.target.value)}
                placeholder="https://poe.ninja/poe1/builds/Settlers/character/계정명/캐릭터명"
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-500 transition-colors"
              />
              <p className="text-xs text-gray-600 mt-1">poe.ninja에서 캐릭터 페이지 URL을 복사해 붙여넣으세요</p>
              <p className="text-xs text-yellow-600/80 mt-1">⚠️ 캐릭터가 공개 설정되어 있어야 합니다</p>
            </div>
          )}

          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-950/50 border border-red-800 text-red-300 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-black font-bold text-sm transition-colors"
          >
            {loading ? "분석 중..." : "빌드 분석하기"}
          </button>
        </form>
      </div>

      {/* 사용 방법 안내 */}
      <div className="mt-4 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
        <button
          onClick={() => setGuideOpen(!guideOpen)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm text-gray-300 hover:text-white transition-colors"
        >
          <span className="font-medium">사용 방법 안내</span>
          {guideOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
        {guideOpen && (
          <div className="px-5 pb-5 space-y-4 border-t border-gray-800 pt-4">
            <GuideSection title="PoB 코드 가져오기" steps={[
              "Path of Building Community(PoBC)에서 빌드를 불러옵니다",
              '상단 메뉴 "공유" → "빌드 코드 복사"를 클릭합니다',
              "복사한 코드를 위 텍스트 상자에 붙여넣고 분석합니다",
            ]} />
            <GuideSection title="pobb.in URL로 불러오기" steps={[
              "pobb.in에 공유된 빌드 링크를 복사합니다",
              "예: https://pobb.in/uFe_URAUgtgI",
              "PoB 코드 입력란에 URL을 붙여넣고 분석합니다",
            ]} />
            <GuideSection title="poe.ninja URL 가져오기" steps={[
              "poe.ninja 사이트에서 원하는 캐릭터 페이지를 엽니다",
              "주소창의 URL을 복사합니다",
              "URL 탭에 붙여넣고 분석합니다 (캐릭터 공개 필요)",
            ]} />
            <div className="bg-gray-800/50 rounded-lg p-3">
              <p className="text-xs text-amber-400 font-medium mb-1">분석 결과에서 볼 수 있는 것</p>
              <ul className="text-xs text-gray-400 space-y-0.5">
                <li>• 클래스, 레벨, 어센던시 정보</li>
                <li>• 생명력/DPS/저항 등 핵심 스탯</li>
                <li>• 스킬 젬 구성 (한국어 번역)</li>
                <li>• 장비 세팅 및 아이템 스탯</li>
                <li>• 패시브 트리 키스톤 요약</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${active ? "text-amber-400 border-b-2 border-amber-400 bg-amber-900/10" : "text-gray-500 hover:text-gray-300"}`}
    >
      {icon}
      {label}
    </button>
  );
}

function GuideSection({ title, steps }: { title: string; steps: string[] }) {
  return (
    <div>
      <p className="text-sm font-medium text-gray-300 mb-1">{title}</p>
      <ol className="text-xs text-gray-500 space-y-0.5">
        {steps.map((step, i) => <li key={i}>{i + 1}. {step}</li>)}
      </ol>
    </div>
  );
}
