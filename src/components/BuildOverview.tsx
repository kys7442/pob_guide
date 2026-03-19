import { Shield, Swords, Star } from "lucide-react";
import type { ParsedBuild } from "@/lib/types";
import { translateClass, translateSkillGem } from "@/lib/translations";
import SectionCard from "./ui/SectionCard";

interface BuildOverviewProps {
  build: ParsedBuild;
}

export default function BuildOverview({ build }: BuildOverviewProps) {
  const { character, meta } = build;
  const classKr = translateClass(character.className);
  const ascendKr = translateClass(character.ascendClassName);
  const mainSkillKr = character.mainSkill
    ? translateSkillGem(character.mainSkill, meta.gameVersion)
    : null;

  return (
    <SectionCard title="빌드 요약">
      <div className="flex flex-wrap gap-6 items-start">
        {/* 클래스 정보 */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-amber-900/30 border border-amber-700 flex items-center justify-center">
            <Shield className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">클래스</div>
            {/* 어센던시가 있으면 어센던시를 주 표시 (빌드의 실제 클래스) */}
            {character.ascendClassName && character.ascendClassName !== "None" && character.ascendClassName !== "" ? (
              <>
                <div className="text-white font-semibold">
                  {ascendKr || character.ascendClassName}
                  {ascendKr && ascendKr !== character.ascendClassName && (
                    <span className="text-gray-500 font-normal text-sm ml-1">({character.ascendClassName})</span>
                  )}
                </div>
                <div className="text-gray-500 text-xs">
                  {classKr || character.className}
                  {classKr && classKr !== character.className && (
                    <span className="ml-1">({character.className})</span>
                  )}
                </div>
              </>
            ) : (
              <div className="text-white font-semibold">
                {classKr || character.className || "알 수 없음"}
                {classKr && classKr !== character.className && character.className && (
                  <span className="text-gray-500 font-normal text-sm ml-1">({character.className})</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 레벨 */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-blue-900/30 border border-blue-700 flex items-center justify-center">
            <Star className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">레벨</div>
            <div className="text-white font-semibold text-xl">{character.level}</div>
          </div>
        </div>

        {/* 메인 스킬 */}
        {character.mainSkill && (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-900/30 border border-red-700 flex items-center justify-center">
              <Swords className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">메인 스킬</div>
              <div className="text-white font-semibold">{mainSkillKr || character.mainSkill}</div>
              {mainSkillKr && mainSkillKr !== character.mainSkill && (
                <div className="text-gray-500 text-xs">{character.mainSkill}</div>
              )}
            </div>
          </div>
        )}

        {/* 게임 버전 배지 */}
        <div className="ml-auto self-start">
          <span
            className={`px-2 py-1 rounded text-xs font-bold ${
              meta.gameVersion === "poe2"
                ? "bg-purple-900/50 border border-purple-700 text-purple-300"
                : "bg-amber-900/50 border border-amber-700 text-amber-300"
            }`}
          >
            {meta.gameVersion === "poe2" ? "PoE 2" : "PoE 1"}
          </span>
          <span className="ml-2 px-2 py-1 rounded text-xs bg-gray-800 border border-gray-600 text-gray-400">
            {meta.source === "pob" ? "PoB" : "poe.ninja"}
          </span>
        </div>
      </div>
    </SectionCard>
  );
}
