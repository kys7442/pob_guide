import { NextRequest, NextResponse } from "next/server";

// 서버 메모리 캐시 (24시간)
interface StatEntry {
  id: string;
  text: string;
}

interface StatsCache {
  data: StatEntry[];
  fetchedAt: number;
}

const statsCache = new Map<string, StatsCache>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

async function fetchStats(game: string): Promise<StatEntry[]> {
  const cacheKey = game;
  const cached = statsCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data;
  }

  const url = game === "poe2"
    ? "https://www.pathofexile.com/api/trade2/data/stats"
    : "https://www.pathofexile.com/api/trade/data/stats";

  const res = await fetch(url, {
    headers: {
      "User-Agent": "poe-build-guide/1.0",
      "Accept": "application/json",
    },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    throw new Error(`PoE trade stats API 오류: HTTP ${res.status}`);
  }

  const json = await res.json() as { result: Array<{ label: string; entries: Array<{ id: string; text: string }> }> };
  const stats: StatEntry[] = [];

  for (const group of json.result || []) {
    for (const entry of group.entries || []) {
      if (entry.id && entry.text) {
        stats.push({ id: entry.id, text: entry.text });
      }
    }
  }

  statsCache.set(cacheKey, { data: stats, fetchedAt: Date.now() });
  return stats;
}

// GET /api/trade-stats?game=poe1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game") || "poe1";

  try {
    const stats = await fetchStats(game);
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "stat 목록 로드 실패" },
      { status: 503 }
    );
  }
}
