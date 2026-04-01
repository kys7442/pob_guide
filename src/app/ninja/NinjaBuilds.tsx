"use client";

import { useState, useEffect } from "react";
import type { BuildIndexResponse, BuildStat, LeagueBuild } from "@/app/api/ninja-builds/route";

// ── 모듈 레벨 캐시 (1시간) ──────────────────────────────────────────
const CLIENT_CACHE_TTL = 60 * 60 * 1000;
let _cached: { data: BuildIndexResponse; at: number } | null = null;

// ── 어센던시 → 클래스 매핑 ──────────────────────────────────────────
const ASCENDANCY_TO_CLASS: Record<string, string> = {
  Juggernaut: "Marauder", Berserker: "Marauder", Chieftain: "Marauder",
  Deadeye: "Ranger", Raider: "Ranger", Pathfinder: "Ranger",
  Necromancer: "Witch", Elementalist: "Witch", Occultist: "Witch",
  Slayer: "Duelist", Gladiator: "Duelist", Champion: "Duelist",
  Inquisitor: "Templar", Hierophant: "Templar", Guardian: "Templar",
  Assassin: "Shadow", Trickster: "Shadow", Saboteur: "Shadow",
  Ascendant: "Scion",
};

// ── 한글 이름 ──────────────────────────────────────────────────────
const CLASS_KR: Record<string, string> = {
  Marauder: "마라우더", Ranger: "레인저", Witch: "위치",
  Duelist: "듀얼리스트", Templar: "템플러", Shadow: "섀도", Scion: "사이온",
};

const ASC_KR: Record<string, string> = {
  Juggernaut: "저거너트", Berserker: "버서커", Chieftain: "치프틴",
  Deadeye: "데드아이", Raider: "레이더", Pathfinder: "패스파인더",
  Necromancer: "네크로맨서", Elementalist: "엘리멘탈리스트", Occultist: "오컬티스트",
  Slayer: "슬레이어", Gladiator: "글래디에이터", Champion: "챔피언",
  Inquisitor: "인퀴지터", Hierophant: "하이로펀트", Guardian: "가디언",
  Assassin: "어쌔신", Trickster: "트릭스터", Saboteur: "사보추어",
  Ascendant: "어센던트",
};

// ── 리그 카테고리 ──────────────────────────────────────────────────
const LEAGUE_CATEGORIES = [
  { label: "일반", filter: (lb: LeagueBuild) => lb.status === 0 && !lb.leagueUrl.includes("hc") && !lb.leagueUrl.includes("ssf") && !lb.leagueUrl.includes("r") && !lb.leagueUrl.startsWith("pl") },
  { label: "하드코어", filter: (lb: LeagueBuild) => lb.status === 0 && lb.leagueUrl.includes("hc") && !lb.leagueUrl.includes("ssf") && !lb.leagueUrl.includes("r") },
  { label: "SSF", filter: (lb: LeagueBuild) => lb.status === 0 && lb.leagueUrl.includes("ssf") && !lb.leagueUrl.includes("hc") && !lb.leagueUrl.includes("r") },
  { label: "HC SSF", filter: (lb: LeagueBuild) => lb.status === 0 && lb.leagueUrl.includes("hcssf") },
] as const;

// ── 정렬 옵션 ──────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: "percentage-desc", label: "점유율 높은순" },
  { value: "percentage-asc", label: "점유율 낮은순" },
  { value: "trend-up", label: "상승 트렌드" },
  { value: "trend-down", label: "하락 트렌드" },
] as const;

type SortKey = typeof SORT_OPTIONS[number]["value"];

function sortStats(stats: BuildStat[], sort: SortKey): BuildStat[] {
  const sorted = [...stats];
  switch (sort) {
    case "percentage-desc": return sorted.sort((a, b) => b.percentage - a.percentage);
    case "percentage-asc": return sorted.sort((a, b) => a.percentage - b.percentage);
    case "trend-up": return sorted.sort((a, b) => b.trend - a.trend || b.percentage - a.percentage);
    case "trend-down": return sorted.sort((a, b) => a.trend - b.trend || b.percentage - a.percentage);
    default: return sorted;
  }
}

function TrendIcon({ trend }: { trend: number }) {
  if (trend === 1) return <span className="text-emerald-400 text-xs">▲</span>;
  if (trend === -1) return <span className="text-red-400 text-xs">▼</span>;
  return <span className="text-gray-600 text-xs">—</span>;
}

// ── 클래스별 통계 집계 ──────────────────────────────────────────────
function aggregateByClass(stats: BuildStat[]): { class: string; percentage: number; topSkill: string }[] {
  const map = new Map<string, { total: number; topSkill: string; topPct: number }>();
  for (const s of stats) {
    const cls = ASCENDANCY_TO_CLASS[s.class] || s.class;
    const prev = map.get(cls) || { total: 0, topSkill: "", topPct: 0 };
    prev.total += s.percentage;
    if (s.percentage > prev.topPct) { prev.topSkill = s.skill; prev.topPct = s.percentage; }
    map.set(cls, prev);
  }
  return [...map.entries()]
    .map(([cls, v]) => ({ class: cls, percentage: v.total, topSkill: v.topSkill }))
    .sort((a, b) => b.percentage - a.percentage);
}

// ── 어센던시별 집계 ─────────────────────────────────────────────────
function aggregateByAscendancy(stats: BuildStat[]): { ascendancy: string; skills: BuildStat[] }[] {
  const map = new Map<string, BuildStat[]>();
  for (const s of stats) {
    const list = map.get(s.class) || [];
    list.push(s);
    map.set(s.class, list);
  }
  return [...map.entries()]
    .map(([asc, skills]) => ({
      ascendancy: asc,
      skills: skills.sort((a, b) => b.percentage - a.percentage),
    }))
    .sort((a, b) => {
      const aSum = a.skills.reduce((s, x) => s + x.percentage, 0);
      const bSum = b.skills.reduce((s, x) => s + x.percentage, 0);
      return bSum - aSum;
    });
}

export default function NinjaBuilds() {
  const [data, setData] = useState<BuildIndexResponse | null>(_cached?.data ?? null);
  const [loading, setLoading] = useState(_cached === null);
  const [sort, setSort] = useState<SortKey>("percentage-desc");
  const [classFilter, setClassFilter] = useState("");
  const [leagueFilter, setLeagueFilter] = useState("");
  const [view, setView] = useState<"ranking" | "class" | "ascendancy">("ranking");

  useEffect(() => {
    if (_cached && Date.now() - _cached.at < CLIENT_CACHE_TTL) return;
    fetch("/api/ninja-builds")
      .then(r => r.json())
      .then((d: BuildIndexResponse) => {
        _cached = { data: d, at: Date.now() };
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const activeLeagues = data?.leagueBuilds.filter(lb => lb.status === 0 && lb.statistics.length > 0) ?? [];
  const mainLeague = leagueFilter
    ? activeLeagues.find(lb => lb.leagueUrl === leagueFilter) ?? activeLeagues[0]
    : activeLeagues[0];

  const stats = mainLeague?.statistics ?? [];
  const sortedStats = sortStats(
    classFilter
      ? stats.filter(s => s.class === classFilter || ASCENDANCY_TO_CLASS[s.class] === classFilter)
      : stats,
    sort
  );

  const availableAscendancies = [...new Set(stats.map(s => s.class))].sort();

  return (
    <>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-white">
            <span className="text-amber-400">ninja</span> 빌드 메타
          </h2>
          {mainLeague && (
            <p className="text-xs text-gray-500 mt-0.5">
              {mainLeague.leagueName} 리그 · 총 {mainLeague.total.toLocaleString()}명
            </p>
          )}
        </div>
        {mainLeague && (
          <a
            href={`https://poe.ninja/poe1/builds/${mainLeague.leagueUrl}`}
            target="_blank" rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-amber-400 transition-colors"
          >
            poe.ninja에서 보기 ↗
          </a>
        )}
      </div>

      {/* ── 필터 패널 ──────────────────────────────────────────── */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 mb-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-[10px] text-gray-500 mb-1">리그</label>
            <select
              value={leagueFilter}
              onChange={e => setLeagueFilter(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">현재 리그</option>
              {LEAGUE_CATEGORIES.map(cat => {
                const leagues = activeLeagues.filter(cat.filter);
                if (leagues.length === 0) return null;
                return (
                  <optgroup key={cat.label} label={cat.label}>
                    {leagues.map(lb => (
                      <option key={lb.leagueUrl} value={lb.leagueUrl}>
                        {lb.leagueName} ({lb.total.toLocaleString()})
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 mb-1">정렬</label>
            <select
              value={sort}
              onChange={e => setSort(e.target.value as SortKey)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500"
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 mb-1">어센던시</label>
            <select
              value={classFilter}
              onChange={e => setClassFilter(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">전체</option>
              {availableAscendancies.map(asc => (
                <option key={asc} value={asc}>{ASC_KR[asc] || asc}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-gray-500 mb-1">보기</label>
            <select
              value={view}
              onChange={e => setView(e.target.value as "ranking" | "class" | "ascendancy")}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ranking">빌드 순위</option>
              <option value="class">클래스별</option>
              <option value="ascendancy">어센던시별</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── 콘텐츠 ────────────────────────────────────────────── */}
      {loading ? (
        <div className="bg-gray-900 border border-gray-700 rounded-xl py-20 text-center text-gray-500 text-sm">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            데이터 불러오는 중...
          </div>
        </div>
      ) : view === "ranking" ? (
        <RankingView stats={sortedStats} leagueUrl={mainLeague?.leagueUrl ?? ""} total={mainLeague?.total ?? 0} />
      ) : view === "class" ? (
        <ClassView stats={stats} />
      ) : (
        <AscendancyView stats={stats} leagueUrl={mainLeague?.leagueUrl ?? ""} />
      )}

      {/* ── 리그 비교 ─────────────────────────────────────────── */}
      {!loading && activeLeagues.length > 1 && view === "ranking" && (
        <div className="mt-8">
          <h2 className="text-lg font-black text-white mb-4">
            <span className="text-amber-400">리그별</span> 인기 빌드 비교
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeLeagues.filter(lb => lb.statistics.length > 0).slice(0, 4).map(lb => (
              <div key={lb.leagueUrl} className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/50 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{lb.leagueName}</h3>
                    <p className="text-[10px] text-gray-500">{lb.total.toLocaleString()}명</p>
                  </div>
                  <a
                    href={`https://poe.ninja/poe1/builds/${lb.leagueUrl}`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-[10px] text-gray-600 hover:text-amber-400 transition-colors"
                  >
                    자세히 ↗
                  </a>
                </div>
                <div className="p-2">
                  {lb.statistics.slice(0, 5).map((s, i) => (
                    <div key={`${s.class}-${s.skill}`} className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-gray-800/50">
                      <span className={`w-5 text-xs font-bold ${i < 3 ? "text-amber-400" : "text-gray-600"}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-200 truncate">{s.skill}</p>
                        <p className="text-[10px] text-gray-500">{ASC_KR[s.class] || s.class}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <TrendIcon trend={s.trend} />
                        <span className="text-xs font-bold text-gray-300">{s.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 text-[10px] text-gray-700 text-right">
        출처: poe.ninja · 1시간 캐시
      </div>
    </>
  );
}

// ── 빌드 순위 뷰 ───────────────────────────────────────────────────
function RankingView({ stats, leagueUrl, total }: { stats: BuildStat[]; leagueUrl: string; total: number }) {
  if (stats.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-xl py-20 text-center text-gray-500 text-sm">
        해당 조건의 빌드가 없습니다.
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
      <div className="grid grid-cols-[40px_1fr_100px_60px_80px] gap-2 px-4 py-2 border-b border-gray-800 text-[10px] text-gray-600 font-semibold">
        <span>#</span>
        <span>빌드 (어센던시 + 스킬)</span>
        <span className="text-right">점유율</span>
        <span className="text-center">트렌드</span>
        <span className="text-right">예상 인원</span>
      </div>
      {stats.map((s, i) => {
        const estCount = Math.round(total * s.percentage / 100);
        return (
          <a
            key={`${s.class}-${s.skill}`}
            href={`https://poe.ninja/poe1/builds/${leagueUrl}?class=${encodeURIComponent(s.class)}&skills=${encodeURIComponent(s.skill).replaceAll("%20", "+")}`}
            target="_blank" rel="noopener noreferrer"
            className="grid grid-cols-[40px_1fr_100px_60px_80px] gap-2 px-4 py-3 border-b border-gray-800/50 hover:bg-gray-800/50 transition-colors"
          >
            <span className={`text-xs font-bold self-center ${i < 3 ? "text-amber-400" : "text-gray-600"}`}>
              {i + 1}
            </span>
            <div className="min-w-0 self-center">
              <p className="text-sm text-gray-200 truncate font-medium">{s.skill}</p>
              <p className="text-[10px] text-gray-500 truncate">
                {ASC_KR[s.class] || s.class}
                <span className="text-gray-700 ml-1">({CLASS_KR[ASCENDANCY_TO_CLASS[s.class]] || s.class})</span>
              </p>
            </div>
            <div className="text-right self-center">
              <div className="relative w-full h-4 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-600/60"
                  style={{ width: `${Math.min(s.percentage * 10, 100)}%` }}
                />
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-200">
                  {s.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-center self-center">
              <TrendIcon trend={s.trend} />
            </div>
            <span className="text-xs text-gray-400 text-right self-center">
              ~{estCount.toLocaleString()}명
            </span>
          </a>
        );
      })}
    </div>
  );
}

// ── 클래스별 뷰 ────────────────────────────────────────────────────
function ClassView({ stats }: { stats: BuildStat[] }) {
  const classData = aggregateByClass(stats);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {classData.map(cls => (
        <div key={cls.class} className="bg-gray-900 border border-gray-700 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-white">
              {CLASS_KR[cls.class] || cls.class}
              <span className="text-[10px] text-gray-600 ml-1 font-normal">{cls.class}</span>
            </h3>
            <span className="text-sm font-bold text-amber-400">{cls.percentage.toFixed(1)}%</span>
          </div>
          <div className="relative w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-amber-600"
              style={{ width: `${Math.min(cls.percentage * 5, 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-500">
            인기 스킬: <span className="text-gray-300">{cls.topSkill}</span>
          </p>
        </div>
      ))}
    </div>
  );
}

// ── 어센던시별 뷰 ──────────────────────────────────────────────────
function AscendancyView({ stats, leagueUrl }: { stats: BuildStat[]; leagueUrl: string }) {
  const ascData = aggregateByAscendancy(stats);

  return (
    <div className="space-y-4">
      {ascData.map(({ ascendancy, skills }) => {
        const parentClass = ASCENDANCY_TO_CLASS[ascendancy] || ascendancy;
        return (
          <div key={ascendancy} className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-800 bg-gray-800/50 flex items-center gap-2">
              <h3 className="text-sm font-bold text-amber-400">
                {ASC_KR[ascendancy] || ascendancy}
              </h3>
              <span className="text-[10px] text-gray-600">
                {CLASS_KR[parentClass] || parentClass}
              </span>
              <span className="text-[10px] text-gray-700 ml-auto">
                합계 {skills.reduce((s, x) => s + x.percentage, 0).toFixed(1)}%
              </span>
            </div>
            <div className="p-2">
              {skills.map((s, i) => (
                <a
                  key={s.skill}
                  href={`https://poe.ninja/poe1/builds/${leagueUrl}?class=${encodeURIComponent(ascendancy)}&skills=${encodeURIComponent(s.skill).replaceAll("%20", "+")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-800/50 transition-colors"
                >
                  <span className={`w-5 text-xs font-bold ${i < 3 ? "text-amber-400" : "text-gray-600"}`}>{i + 1}</span>
                  <span className="text-sm text-gray-200 flex-1 truncate">{s.skill}</span>
                  <TrendIcon trend={s.trend} />
                  <span className="text-xs font-bold text-gray-300 w-14 text-right">{s.percentage.toFixed(1)}%</span>
                </a>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
