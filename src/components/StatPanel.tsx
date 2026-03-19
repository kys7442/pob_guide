import { Heart, Zap, Shield, Flame, Snowflake, Cloud, Skull } from "lucide-react";
import type { ParsedBuild } from "@/lib/types";
import { formatStats, getResistances, getResistanceColor } from "@/lib/stat-formatter";
import SectionCard from "./ui/SectionCard";
import Tooltip from "./ui/Tooltip";

interface StatPanelProps {
  build: ParsedBuild;
}

const STAT_TOOLTIPS: Record<string, string> = {
  "생명력": "캐릭터의 최대 생명력. 0이 되면 사망합니다.",
  "총 생명력": "캐릭터의 최대 생명력. 0이 되면 사망합니다.",
  "에너지 보호막": "생명력을 감싸는 보호막. 생명력보다 먼저 피해를 받습니다.",
  "총 에너지 보호막": "생명력을 감싸는 보호막. 생명력보다 먼저 피해를 받습니다.",
  "총 DPS": "초당 총 피해량. 빌드 강도의 핵심 지표입니다.",
  "방어도": "물리 피해를 줄여줍니다. 방어도가 높을수록 피해 감소율이 증가합니다.",
  "치명타 확률": "타격이 치명타가 될 확률입니다.",
  "치명타 배율": "치명타 시 피해 배율입니다.",
};

export default function StatPanel({ build }: StatPanelProps) {
  const formattedStats = formatStats(build.stats);
  const resistances = getResistances(build.stats);

  const survivalStats = formattedStats.filter((s) => s.category === "survival");
  const offenceStats = formattedStats.filter((s) => s.category === "offence");
  const defenceStats = formattedStats.filter((s) => s.category === "defence");

  if (build.stats.length === 0) {
    return (
      <SectionCard title="핵심 스탯">
        <p className="text-gray-500 text-sm text-center py-4">
          poe.ninja에서 가져온 캐릭터는 스탯 계산 정보가 제공되지 않습니다.<br />
          정확한 스탯 확인은 Path of Building을 이용해주세요.
        </p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="핵심 스탯">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 생존 스탯 */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
            <Heart className="w-3 h-3 text-red-400" /> 생존
          </div>
          {survivalStats.length > 0 ? (
            survivalStats.map((stat) => (
              <StatRow key={stat.key} label={stat.label} value={stat.value} highlight={stat.highlight} />
            ))
          ) : (
            <p className="text-gray-600 text-sm">데이터 없음</p>
          )}
        </div>

        {/* 공격 스탯 */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-400" /> 공격
          </div>
          {offenceStats.length > 0 ? (
            offenceStats.map((stat) => (
              <StatRow key={stat.key} label={stat.label} value={stat.value} highlight={stat.highlight} tooltip={STAT_TOOLTIPS[stat.label]} />
            ))
          ) : (
            <p className="text-gray-600 text-sm">데이터 없음</p>
          )}
        </div>

        {/* 방어 + 저항 */}
        <div className="space-y-2">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1">
            <Shield className="w-3 h-3 text-blue-400" /> 방어 / 저항
          </div>
          {defenceStats.map((stat) => (
            <StatRow key={stat.key} label={stat.label} value={stat.value} />
          ))}

          {/* 저항 4종 */}
          <div className="mt-3 pt-3 border-t border-gray-700">
            <ResistRow icon={<Flame className="w-3 h-3" />} label="화염" value={resistances.fire} colorClass="text-orange-400" />
            <ResistRow icon={<Snowflake className="w-3 h-3" />} label="냉기" value={resistances.cold} colorClass="text-cyan-400" />
            <ResistRow icon={<Cloud className="w-3 h-3" />} label="번개" value={resistances.lightning} colorClass="text-yellow-400" />
            <ResistRow icon={<Skull className="w-3 h-3" />} label="혼돈" value={resistances.chaos} colorClass="text-purple-400" />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function StatRow({
  label,
  value,
  highlight,
  tooltip,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  tooltip?: string;
}) {
  const content = (
    <div className="flex items-center justify-between py-1">
      <span className={`text-sm ${highlight ? "text-gray-300" : "text-gray-400"}`}>
        {label}
        {tooltip && <span className="ml-1 text-gray-600 text-xs">(?)</span>}
      </span>
      <span className={`font-mono font-semibold text-sm ${highlight ? "text-amber-400" : "text-white"}`}>
        {value}
      </span>
    </div>
  );

  if (tooltip) {
    return <Tooltip content={tooltip}>{content}</Tooltip>;
  }
  return content;
}

function ResistRow({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  colorClass: string;
}) {
  const displayValue = `${value.toFixed(0)}%`;
  const resistColor = getResistanceColor(value);

  return (
    <div className="flex items-center justify-between py-1">
      <span className={`flex items-center gap-1 text-sm ${colorClass}`}>
        {icon} {label}
      </span>
      <span className={`font-mono font-semibold text-sm ${resistColor}`}>{displayValue}</span>
    </div>
  );
}
