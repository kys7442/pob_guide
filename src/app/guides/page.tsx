import type { Metadata } from "next";
import { guides } from "@/content/guides";

export const metadata: Metadata = {
  title: "PoE 가이드 - Path of Exile 한국어 공략 모음",
  description:
    "Path of Exile 초보자 가이드, 빌드 선택법, 시세 이해, PoB 코드 활용법 등 한국어로 작성된 PoE 공략을 제공합니다.",
};

const CATEGORIES = [
  { key: "all", label: "전체" },
  { key: "beginner", label: "초보자" },
  { key: "mechanics", label: "가이드" },
  { key: "league", label: "리그" },
  { key: "economy", label: "경제" },
] as const;

export default function GuidesPage() {
  return (
    <article className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white mb-2">
          <span className="text-amber-400">PoE</span> 가이드
        </h1>
        <p className="text-sm text-gray-400">
          Path of Exile을 더 잘 즐기기 위한 한국어 가이드 모음입니다.
          빌드 선택, 시세 이해, PoB 활용법 등 초보자부터 숙련자까지 도움이 되는 정보를 제공합니다.
        </p>
      </div>

      {/* 카테고리 태그 */}
      <div className="flex gap-2 mb-6">
        {CATEGORIES.map((cat) => (
          <span
            key={cat.key}
            className="px-3 py-1.5 rounded-lg text-xs bg-gray-900 border border-gray-700 text-gray-400"
          >
            {cat.label}
          </span>
        ))}
      </div>

      {/* 가이드 목록 */}
      <div className="space-y-4">
        {guides.map((guide) => (
          <a
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="block bg-gray-900 border border-gray-700 rounded-xl p-6 hover:border-amber-600 transition-colors group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400">
                    {guide.categoryLabel}
                  </span>
                  <span className="text-[10px] text-gray-600">
                    {guide.updatedAt} 업데이트
                  </span>
                </div>
                <h2 className="text-base font-bold text-white mb-2 group-hover:text-amber-400 transition-colors">
                  {guide.title}
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {guide.description}
                </p>
              </div>
              <span className="text-gray-600 group-hover:text-amber-400 transition-colors flex-shrink-0 mt-1">
                →
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* 사이트 안내 */}
      <div className="mt-12 bg-gray-900 border border-gray-700 rounded-xl p-6">
        <h2 className="text-base font-bold text-white mb-3">더 많은 정보가 필요하신가요?</h2>
        <p className="text-sm text-gray-400 leading-relaxed mb-4">
          본 사이트에서는 가이드 외에도 실시간 시세 확인, AI 빌드 분석, 메타 빌드 순위 등
          다양한 도구를 제공합니다. Path of Exile을 더 효율적으로 즐기는 데 활용해보세요.
        </p>
        <div className="flex gap-3">
          <a href="/" className="px-4 py-2 rounded-lg text-xs bg-amber-600 text-black font-bold hover:bg-amber-500 transition-colors">
            시세 확인하기
          </a>
          <a href="/pob" className="px-4 py-2 rounded-lg text-xs bg-gray-800 text-gray-300 font-bold hover:bg-gray-700 transition-colors">
            빌드 분석하기
          </a>
          <a href="/ninja" className="px-4 py-2 rounded-lg text-xs bg-gray-800 text-gray-300 font-bold hover:bg-gray-700 transition-colors">
            빌드 순위 보기
          </a>
        </div>
      </div>
    </article>
  );
}
