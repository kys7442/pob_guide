"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { ParsedBuild } from "@/lib/types";
import BuildOverview from "@/components/BuildOverview";
import StatPanel from "@/components/StatPanel";
import SkillGems from "@/components/SkillGems";
import ItemDisplay from "@/components/ItemDisplay";
import PassiveSummary from "@/components/PassiveSummary";
import BuildAnalysis from "@/components/BuildAnalysis";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import SectionCard from "@/components/ui/SectionCard";
import { ArrowLeft, AlertTriangle } from "lucide-react";

type TabId = "skills" | "items" | "passives";

function BuildPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [build, setBuild] = useState<ParsedBuild | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("skills");

  const source = searchParams.get("source");
  const urlCode = searchParams.get("code"); // 하위호환: 구버전 URL 직접 접근 지원
  const url = searchParams.get("url");

  useEffect(() => {
    if (!source) {
      router.replace("/");
      return;
    }

    async function fetchBuild() {
      setLoading(true);
      setError("");

      try {
        let res: Response;

        if (source === "pob") {
          // sessionStorage 우선, 없으면 URL 파라미터 fallback (하위호환)
          const code = sessionStorage.getItem("pobCode") || urlCode;
          sessionStorage.removeItem("pobCode"); // 사용 후 제거
          if (!code) { router.replace("/"); return; }
          res = await fetch("/api/parse-pob", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
          });
        } else if (source === "ninja" && url) {
          res = await fetch(`/api/fetch-ninja?url=${encodeURIComponent(url)}`);
        } else {
          router.replace("/");
          return;
        }

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "빌드 분석에 실패했습니다.");
          return;
        }

        setBuild(data.build);
      } catch {
        setError("서버 연결 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      } finally {
        setLoading(false);
      }
    }

    fetchBuild();
  }, [source, urlCode, url, router]);

  if (loading) {
    return <LoadingSpinner message="빌드를 분석하고 있습니다..." />;
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-full bg-red-900/30 border border-red-700 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">분석 실패</h2>
        <p className="text-gray-400 text-sm mb-6 whitespace-pre-line">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="px-6 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-black font-bold text-sm transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!build) return null;

  const tabs: Array<{ id: TabId; label: string }> = [
    { id: "skills", label: "스킬 구성" },
    { id: "items", label: "장비 세팅" },
    { id: "passives", label: "패시브 트리" },
  ];

  return (
    <div className="space-y-4">
      {/* 뒤로 가기 */}
      <button
        onClick={() => router.push("/pob")}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> 새 빌드 분석
      </button>

      {/* 요약 카드 */}
      <BuildOverview build={build} />

      {/* 핵심 스탯 */}
      <StatPanel build={build} />

      {/* 탭 구조 */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
        {/* 탭 헤더 */}
        <div className="flex border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "text-amber-400 border-b-2 border-amber-400 bg-amber-900/10"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 내용 — SectionCard 없이 직접 렌더 */}
        <div className="p-4">
          {activeTab === "skills" && <SkillGems build={build} />}
          {activeTab === "items" && <ItemDisplay build={build} />}
          {activeTab === "passives" && <PassiveSummary build={build} pobCode={urlCode || undefined} />}
        </div>
      </div>

      {/* AI 빌드 분석 */}
      <BuildAnalysis build={build} />
    </div>
  );
}

export default function BuildPage() {
  return (
    <Suspense fallback={<LoadingSpinner message="페이지 로딩 중..." />}>
      <BuildPageContent />
    </Suspense>
  );
}
