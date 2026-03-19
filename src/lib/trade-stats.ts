export interface StatEntry {
  id: string;
  text: string;
}

/**
 * mod 텍스트에서 수치를 추출하고 stat ID와 매핑합니다.
 * 예: "+58 to maximum Life" → { id: "explicit.stat_3299347043", value: 58 }
 */
export function matchModToStatId(
  modText: string,
  stats: StatEntry[]
): { id: string; value: number } | null {
  // 첫 번째 숫자 추출
  const numMatch = modText.match(/([\d.]+)/);
  const value = numMatch ? parseFloat(numMatch[1]) : 0;

  // 숫자를 #으로 치환한 패턴
  const normalized = modText
    .replace(/[\d.]+/g, "#")
    .toLowerCase()
    .trim();

  for (const stat of stats) {
    const statNormalized = stat.text
      .replace(/[\d.]+/g, "#")
      .toLowerCase()
      .trim();

    // 정확한 매치 또는 포함 관계
    if (statNormalized === normalized || statNormalized.includes(normalized) || normalized.includes(statNormalized)) {
      return { id: stat.id, value };
    }
  }

  return null;
}

// 클라이언트 사이드 캐시 (컴포넌트 레벨)
let clientStatsCache: { data: StatEntry[]; game: string; fetchedAt: number } | null = null;
const CLIENT_CACHE_TTL = 60 * 60 * 1000; // 1시간

export async function fetchTradeStats(game: "poe1" | "poe2"): Promise<StatEntry[]> {
  if (
    clientStatsCache &&
    clientStatsCache.game === game &&
    Date.now() - clientStatsCache.fetchedAt < CLIENT_CACHE_TTL
  ) {
    return clientStatsCache.data;
  }

  try {
    const res = await fetch(`/api/trade-stats?game=${game}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as StatEntry[];
    clientStatsCache = { data, game, fetchedAt: Date.now() };
    return data;
  } catch {
    return [];
  }
}
