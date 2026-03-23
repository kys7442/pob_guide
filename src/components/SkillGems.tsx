"use client";

import type { ParsedBuild, SkillSlot } from "@/lib/types";
import { translateSkillGem, translateSlot } from "@/lib/translations";
import { useKoreanNames } from "@/lib/use-korean-names";
import { clsx } from "clsx";

interface SkillGemsProps {
  build: ParsedBuild;
}

export default function SkillGems({ build }: SkillGemsProps) {
  const { skills, meta } = build;
  const lookupKr = useKoreanNames(meta.gameVersion);

  if (skills.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">스킬 젬 데이터가 없습니다.</p>
        <p className="text-gray-600 text-xs mt-1">PoB에서 스킬 슬롯에 젬이 있는지 확인해주세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {skills.map((slot, idx) => (
        <SkillSlotCard key={idx} slot={slot} gameVersion={meta.gameVersion} lookupKr={lookupKr} />
      ))}
    </div>
  );
}

function SkillSlotCard({
  slot,
  gameVersion,
  lookupKr,
}: {
  slot: SkillSlot;
  gameVersion: "poe1" | "poe2";
  lookupKr: (name: string) => string | null;
}) {
  const slotLabel = translateSlot(slot.slotId || slot.label || "");
  const label = slotLabel !== (slot.slotId || slot.label || "")
    ? slotLabel
    : (slot.label || slot.slotId || "스킬 슬롯");

  return (
    <div
      className={clsx(
        "rounded-lg border p-3",
        slot.isMainSkill
          ? "border-amber-600 bg-amber-900/10"
          : "border-gray-700 bg-gray-800/50"
      )}
    >
      <div className="flex items-center gap-2 mb-2.5">
        {slot.isMainSkill && (
          <span className="px-2 py-0.5 rounded text-xs bg-amber-700 text-amber-100 font-bold">
            메인
          </span>
        )}
        <span className="text-sm text-gray-400">{label}</span>
        <span className="text-xs text-gray-600 ml-auto">
          {slot.gems.length}개 젬
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {slot.gems.map((gem, gIdx) => (
          <GemBadge
            key={gIdx}
            name={gem.name}
            level={gem.level}
            quality={gem.quality}
            isSupport={gem.isSupport}
            enabled={gem.enabled !== false}
            gameVersion={gameVersion}
            color={gem.color as GemColorKey | undefined}
            lookupKr={lookupKr}
          />
        ))}
      </div>
    </div>
  );
}

type GemColorKey = "red" | "green" | "blue" | "white" | "support";

const GEM_STYLES: Record<GemColorKey, { bg: string; border: string; text: string; subText: string }> = {
  red:     { bg: "bg-rose-500/10",    border: "border-rose-400/60",    text: "text-rose-200",    subText: "#fca5a5" },
  green:   { bg: "bg-emerald-500/10", border: "border-emerald-400/60", text: "text-emerald-200", subText: "#6ee7b7" },
  blue:    { bg: "bg-sky-500/10",     border: "border-sky-400/60",     text: "text-sky-200",     subText: "#93c5fd" },
  white:   { bg: "bg-violet-500/10",  border: "border-violet-400/60",  text: "text-violet-200",  subText: "#c4b5fd" },
  support: { bg: "bg-slate-500/10",   border: "border-slate-400/50",   text: "text-slate-300",   subText: "#94a3b8" },
};

function GemBadge({
  name,
  level,
  quality,
  isSupport,
  enabled,
  gameVersion,
  color,
  lookupKr,
}: {
  name: string;
  level?: number;
  quality?: number;
  isSupport?: boolean;
  enabled: boolean;
  gameVersion: "poe1" | "poe2";
  color?: GemColorKey;
  lookupKr: (name: string) => string | null;
}) {
  // 동적 API 우선 → 정적 사전 폴백
  const krName = lookupKr(name) ?? translateSkillGem(name, gameVersion);
  const hasTranslation = krName !== name;
  const colorKey: GemColorKey = color || (isSupport ? "support" : "red");
  const style = GEM_STYLES[colorKey];

  return (
    <div
      className={clsx(
        "flex flex-col rounded-md px-3 py-2 border text-xs min-w-[80px]",
        !enabled && "opacity-40",
        style.bg, style.border, style.text
      )}
    >
      <span className="font-semibold leading-tight">{krName}</span>
      {hasTranslation && (
        <span className="text-[10px] mt-0.5" style={{ color: style.subText }}>
          {name}
        </span>
      )}
      <div className="flex gap-1.5 mt-1">
        {level !== undefined && level > 0 && (
          <span className="text-gray-400 text-[10px] bg-gray-800 px-1 rounded">
            Lv.{level}
          </span>
        )}
        {quality !== undefined && quality > 0 && (
          <span className="text-green-400 text-[10px] bg-gray-800 px-1 rounded">
            Q{quality}%
          </span>
        )}
      </div>
    </div>
  );
}
