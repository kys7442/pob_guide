import { NextResponse } from "next/server";

// ── 캐시 (1시간) ────────────────────────────────────────────────────
let _cache: { data: BuildIndexResponse; at: number } | null = null;
const CACHE_TTL = 60 * 60 * 1000; // 1시간

// ── 타입 ────────────────────────────────────────────────────────────
export interface BuildStat {
  class: string;
  skill: string;
  percentage: number;
  trend: number; // 1=상승, -1=하락, 0=유지
}

export interface LeagueBuild {
  leagueName: string;
  leagueUrl: string;
  total: number;
  status: number; // 0=active, 1=recentlyActive, 2=passive
  statistics: BuildStat[];
}

export interface BuildIndexResponse {
  leagueBuilds: LeagueBuild[];
}

async function fetchBuildIndex(): Promise<BuildIndexResponse> {
  if (_cache && Date.now() - _cache.at < CACHE_TTL) return _cache.data;

  const res = await fetch("https://poe.ninja/poe1/api/data/build-index-state", {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      Accept: "application/json",
      Referer: "https://poe.ninja/",
    },
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`poe.ninja HTTP ${res.status}`);

  const data: BuildIndexResponse = await res.json();
  _cache = { data, at: Date.now() };
  return data;
}

// GET /api/ninja-builds
export async function GET() {
  try {
    const data = await fetchBuildIndex();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "데이터 로드 실패" },
      { status: 503 }
    );
  }
}
