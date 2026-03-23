import { NextRequest, NextResponse } from "next/server";

const leagueCache = new Map<string, { data: string[]; fetchedAt: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10분

async function fetchLeagues(game: string): Promise<string[]> {
  const cacheKey = game;
  const cached = leagueCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data;
  }

  const url = game === "poe2"
    ? "https://www.pathofexile.com/api/trade2/data/leagues"
    : "https://www.pathofexile.com/api/trade/data/leagues";

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; poe-build-guide/1.0)",
      "Accept": "application/json",
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const json = await res.json() as { result: Array<{ id: string; text: string }> };
  const leagues = (json.result || []).map(l => l.id);

  leagueCache.set(cacheKey, { data: leagues, fetchedAt: Date.now() });
  return leagues;
}

// GET /api/trade-leagues?game=poe1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game") || "poe1";

  try {
    const leagues = await fetchLeagues(game);
    return NextResponse.json(leagues);
  } catch (error) {
    // 폴백: 기본 리그 목록
    const fallback = game === "poe2"
      ? ["Dawn of the Hunt", "Standard"]
      : ["Standard", "Hardcore"];
    return NextResponse.json(fallback, {
      headers: { "X-Fallback": "true" },
    });
  }
}
