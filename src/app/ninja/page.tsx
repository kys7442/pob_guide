"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { NinjaBuild } from "@/app/api/ninja-builds/route";

interface BuildsData {
  league: string;
  total: number;
  builds: NinjaBuild[];
}

function formatNum(n: number): string {
  if (!n) return "-";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toString();
}

const SORT_OPTIONS = [
  { value: "dps",           label: "DPS" },
  { value: "life",          label: "생명력" },
  { value: "energyshield",  label: "에너지 실드" },
  { value: "ehp",           label: "유효 생명력(EHP)" },
  { value: "level",         label: "레벨" },
  { value: "depth",         label: "심연 깊이" },
];

const CLASS_OPTIONS = [
  { value: "", label: "전체 클래스" },
  { value: "Marauder", label: "마라우더" },
  { value: "Ranger", label: "레인저" },
  { value: "Witch", label: "위치" },
  { value: "Duelist", label: "듀얼리스트" },
  { value: "Templar", label: "템플러" },
  { value: "Shadow", label: "섀도" },
  { value: "Scion", label: "사이온" },
];

export default function NinjaPage() {
  const router = useRouter();
  const [data, setData] = useState<BuildsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sort, setSort] = useState("dps");
  const [minLife, setMinLife] = useState("2000");
  const [minEhp, setMinEhp] = useState("20000");
  const [minEs, setMinEs] = useState("");
  const [classFilter, setClassFilter] = useState("");

  const fetchBuilds = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sort });
      if (minLife) params.set("min-life", minLife);
      if (minEhp) params.set("min-ehp", minEhp);
      if (minEs) params.set("min-energyshield", minEs);
      if (classFilter) params.set("class", classFilter);

      const res = await fetch(`/api/ninja-builds?${params.toString()}`);
      const d: BuildsData = await res.json();
      setData(d);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [sort, minLife, minEhp, minEs, classFilter]);

  useEffect(() => { fetchBuilds(); }, [fetchBuilds]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-black text-white">
            <span className="text-amber-400">ninja</span> 빌드 순위
          </h1>
          {data && (
            <p className="text-xs text-gray-500 mt-0.5">
              {data.league} 리그 · 총 {(data.total ?? 0).toLocaleString()}명
            </p>
          )}
        </div>
        <a
          href={`https://poe.ninja/poe1/builds/${data?.league?.toLowerCase() ?? ""}?min-ehp=${minEhp}&min-life=${minLife}&sort=${sort}`}
          target="_blank" rel="noopener noreferrer"
          className="text-xs text-gray-500 hover:text-amber-400 transition-colors"
        >
          poe.ninja에서 보기 ↗
        </a>
      </div>

      {/* 필터 패널 */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">정렬 기준</label>
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">최소 생명력</label>
          <input
            type="number"
            value={minLife}
            onChange={e => setMinLife(e.target.value)}
            placeholder="2000"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">최소 EHP</label>
          <input
            type="number"
            value={minEhp}
            onChange={e => setMinEhp(e.target.value)}
            placeholder="20000"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">최소 에너지 실드</label>
          <input
            type="number"
            value={minEs}
            onChange={e => setMinEs(e.target.value)}
            placeholder="1000"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="block text-[10px] text-gray-500 mb-1">클래스</label>
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500"
          >
            {CLASS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={fetchBuilds}
            disabled={loading}
            className="w-full py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-gray-700 disabled:text-gray-500 text-black text-xs font-bold transition-colors"
          >
            {loading ? "검색 중..." : "검색"}
          </button>
        </div>
      </div>

      {/* 순위 테이블 */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
        {/* 헤더 */}
        <div className="grid grid-cols-[40px_1fr_80px_80px_80px_80px_80px_90px] gap-2 px-4 py-2 border-b border-gray-800 text-[10px] text-gray-600 font-semibold">
          <span>#</span>
          <span>캐릭터</span>
          <span className="text-right">레벨</span>
          <span className="text-right">생명력</span>
          <span className="text-right">ES</span>
          <span className="text-right">EHP</span>
          <span className="text-right">DPS</span>
          <span className="text-right">메인 스킬</span>
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-500 text-sm">불러오는 중...</div>
        ) : !data || data.builds.length === 0 ? (
          <div className="py-20 text-center text-gray-500 text-sm">
            결과가 없습니다. 필터를 조정해 보세요.
          </div>
        ) : (
          <div>
            {data.builds.slice(0, 50).map((build, i) => (
              <div
                key={`${build.rank}-${build.name}`}
                className="grid grid-cols-[40px_1fr_80px_80px_80px_80px_80px_90px] gap-2 px-4 py-2.5 border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors cursor-pointer"
                onClick={() => {
                  if (build.accountName && build.characterName) {
                    router.push(`/build?url=https://poe.ninja/poe1/builds/${data.league.toLowerCase()}/character/${build.accountName}/${build.characterName}&source=ninja`);
                  }
                }}
              >
                <span className={`text-xs font-bold self-center ${i < 3 ? "text-amber-400" : "text-gray-600"}`}>
                  {build.rank}
                </span>
                <div className="min-w-0 self-center">
                  <p className="text-sm text-gray-200 truncate font-medium">{build.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">
                    {build.ascendancy || build.class}
                    {build.accountName && <span className="ml-1 text-gray-700">· {build.accountName}</span>}
                  </p>
                </div>
                <span className="text-xs text-gray-400 text-right self-center">{build.level}</span>
                <span className="text-xs text-rose-400 text-right self-center">{formatNum(build.life)}</span>
                <span className="text-xs text-sky-400 text-right self-center">{formatNum(build.energyShield)}</span>
                <span className="text-xs text-emerald-400 text-right self-center">{formatNum(build.ehp)}</span>
                <span className="text-xs text-amber-400 text-right self-center">{formatNum(build.dps)}</span>
                <span className="text-[10px] text-gray-400 text-right self-center truncate">{build.mainSkill || "-"}</span>
              </div>
            ))}
          </div>
        )}

        <div className="px-4 py-2 text-[10px] text-gray-700 text-right">
          출처: poe.ninja · 5분 캐시 · 클릭 시 빌드 분석
        </div>
      </div>
    </div>
  );
}
