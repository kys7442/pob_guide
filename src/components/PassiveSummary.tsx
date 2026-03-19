"use client";

import { useState } from "react";
import type { ParsedBuild } from "@/lib/types";
import { translateKeystone } from "@/lib/translations";
import { KEYSTONE_KR } from "@/lib/translations";
import PassiveTreeCanvas from "./PassiveTreeCanvas";

interface PassiveSummaryProps {
  build: ParsedBuild;
  pobCode?: string;
}

export default function PassiveSummary({ build, pobCode }: PassiveSummaryProps) {
  const { passives, meta } = build;
  const [view, setView] = useState<"tree" | "summary">("tree");

  return (
    <div className="space-y-3">
      {/* 뷰 전환 */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setView("tree")}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            view === "tree"
              ? "bg-amber-700 text-amber-100"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          트리 시각화
        </button>
        <button
          onClick={() => setView("summary")}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            view === "summary"
              ? "bg-amber-700 text-amber-100"
              : "bg-gray-800 text-gray-400 hover:text-white"
          }`}
        >
          요약 정보
        </button>
      </div>

      {view === "tree" ? (
        <PassiveTreeCanvas
          nodeIds={passives.nodeIds}
          gameVersion={meta.gameVersion}
          totalNodes={passives.totalNodes}
          pobCode={pobCode}
        />
      ) : (
        <SummaryView passives={passives} />
      )}
    </div>
  );
}

function SummaryView({ passives }: { passives: ParsedBuild["passives"] }) {
  return (
    <div className="space-y-4">
      {/* 총 노드 수 */}
      <div className="flex items-center gap-4">
        <div>
          <div className="text-sm text-gray-400">총 패시브 노드</div>
          <div className="text-2xl font-bold text-white">{passives.totalNodes}</div>
        </div>
      </div>

      {/* 노드 분포 */}
      {passives.totalNodes > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500 uppercase tracking-wide">노드 분포 (추정)</div>
          <NodeBar label="공격" count={passives.nodeCounts.offence} total={passives.totalNodes} color="bg-red-500" />
          <NodeBar label="생명력" count={passives.nodeCounts.life} total={passives.totalNodes} color="bg-green-500" />
          <NodeBar label="방어" count={passives.nodeCounts.defence} total={passives.totalNodes} color="bg-blue-500" />
          <NodeBar label="속도" count={passives.nodeCounts.speed} total={passives.totalNodes} color="bg-yellow-500" />
          <NodeBar label="기타" count={passives.nodeCounts.other} total={passives.totalNodes} color="bg-gray-500" />
        </div>
      )}

      {/* 키스톤 */}
      {passives.keystones.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-gray-500 uppercase tracking-wide">
            키스톤 패시브 ({passives.keystones.length}개)
          </div>
          <div className="flex flex-wrap gap-2">
            {passives.keystones.map((ks) => (
              <KeystoneCard key={ks} name={ks} />
            ))}
          </div>
        </div>
      )}

      {passives.keystones.length === 0 && passives.totalNodes === 0 && (
        <p className="text-gray-600 text-sm text-center py-4">
          패시브 트리 데이터가 없습니다.
        </p>
      )}
    </div>
  );
}

function NodeBar({ label, count, total, color }: {
  label: string; count: number; total: number; color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-12 text-xs text-gray-400 text-right">{label}</div>
      <div className="flex-1 bg-gray-800 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <div className="w-8 text-xs text-gray-400 text-right">{count}</div>
    </div>
  );
}

function KeystoneCard({ name }: { name: string }) {
  const krName = translateKeystone(name);
  const hasTranslation = krName !== name && Object.prototype.hasOwnProperty.call(KEYSTONE_KR, name);
  return (
    <div className="px-3 py-2 rounded-md bg-gray-800 border border-gray-600 hover:border-amber-600 transition-colors">
      <div className="text-sm font-semibold text-amber-300">{krName}</div>
      {hasTranslation && <div className="text-xs text-gray-500">{name}</div>}
    </div>
  );
}
