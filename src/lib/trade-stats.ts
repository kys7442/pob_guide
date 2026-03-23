export interface StatEntry {
  id: string;
  text: string;
}

/**
 * mod 텍스트에서 수치를 추출하고 stat ID와 매핑합니다.
 * 예: "+58 to maximum Life" → { id: "explicit.stat_3299347043", value: 58 }
 * @param modText  아이템에 표시된 mod 텍스트
 * @param stats    거래소 stat 목록
 * @param prefer   "explicit" | "implicit" — 우선 검색할 stat 접두어
 */
export function matchModToStatId(
  modText: string,
  stats: StatEntry[],
  prefer: "explicit" | "implicit" | "enchant" = "explicit"
): { id: string; value: number } | null {
  // 첫 번째 숫자 추출 (범위 "X-Y"는 X를 사용)
  const numMatch = modText.match(/([\d.]+)/);
  const value = numMatch ? parseFloat(numMatch[1]) : 0;

  // 정규화: 숫자 → #, 소문자, 앞뒤 공백 제거, + 기호 제거
  const normalize = (text: string) =>
    text
      .replace(/\([\d.]+-[\d.]+\)/g, "#")   // (X-Y) → #
      .replace(/[\d.]+/g, "#")              // 나머지 숫자 → #
      .replace(/\++/g, "")                 // + 기호 제거
      .replace(/\s+/g, " ")
      .toLowerCase()
      .trim();

  const normalized = normalize(modText);

  // 정확한 매치를 먼저 시도 (prefer 접두어 우선)
  const preferred = stats.filter(s => s.id.startsWith(prefer + "."));
  const others = stats.filter(s => !s.id.startsWith(prefer + "."));
  const ordered = [...preferred, ...others];

  // 1차: 정확한 매치
  for (const stat of ordered) {
    if (normalize(stat.text) === normalized) {
      return { id: stat.id, value };
    }
  }

  // 2차: stat 텍스트가 mod 텍스트를 포함하거나 그 반대
  for (const stat of ordered) {
    const statNorm = normalize(stat.text);
    if (statNorm.length > 5 && (statNorm === normalized || normalized.includes(statNorm) || statNorm.includes(normalized))) {
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
