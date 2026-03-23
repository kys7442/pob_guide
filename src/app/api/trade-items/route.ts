import { NextRequest, NextResponse } from "next/server";

// 서버 메모리 캐시 (24시간)
const itemCache = new Map<string, { data: Record<string, string>; fetchedAt: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000;

interface TradeEntry {
  type?: string;
  name?: string;
  flags?: { unique?: boolean };
}

interface TradeCategory {
  id: string;
  entries: TradeEntry[];
}

async function fetchCategories(url: string): Promise<TradeCategory[]> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; poe-build-guide/1.0)",
      "Accept": "application/json",
    },
    signal: AbortSignal.timeout(10000),
    // next.js 캐시 비활성화 (항상 최신 리그 데이터 사용)
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json() as { result: TradeCategory[] };
  return json.result || [];
}

async function buildKoreanNameMap(game: string): Promise<Record<string, string>> {
  const cacheKey = game;
  const cached = itemCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data;
  }

  const enUrl = game === "poe2"
    ? "https://www.pathofexile.com/api/trade2/data/items"
    : "https://www.pathofexile.com/api/trade/data/items";

  const krUrl = "https://poe.game.daum.net/api/trade/data/items";

  // 영문 + 한국어 병렬 호출
  const [enCategories, krCategories] = await Promise.all([
    fetchCategories(enUrl),
    fetchCategories(krUrl),
  ]);

  if (krCategories.length === 0) {
    itemCache.set(cacheKey, { data: {}, fetchedAt: Date.now() });
    return {};
  }

  // 카테고리 ID → 한국어 항목 맵
  const krMap = new Map<string, TradeEntry[]>();
  for (const cat of krCategories) {
    krMap.set(cat.id, cat.entries);
  }

  const nameMap: Record<string, string> = {};

  for (const enCat of enCategories) {
    const krEntries = krMap.get(enCat.id);
    if (!krEntries) continue;

    // ── unique 아이템: unique-only 인덱스로 매핑 ──
    // 전체 index가 아닌, unique 항목끼리만 순서 매핑
    // (EN/KR 전체 항목 수는 다를 수 있지만 unique 수는 동일)
    const enUniques = enCat.entries.filter(e => e.flags?.unique);
    const krUniques = krEntries.filter(e => e.flags?.unique);

    const uLen = Math.min(enUniques.length, krUniques.length);
    for (let i = 0; i < uLen; i++) {
      const en = enUniques[i];
      const kr = krUniques[i];
      // 고유 이름 매핑: "Corpsewalker" → "시체 보행자"
      if (en.name && kr.name) {
        nameMap[en.name] = kr.name;
      }
      // 베이스 타입 매핑 (고유 아이템의 base): "Carnal Boots" → "육욕의 장화"
      if (en.type && kr.type && !nameMap[en.type]) {
        nameMap[en.type] = kr.type;
      }
    }

    // ── 일반(비고유) 아이템: 전체 index로 매핑 ──
    // 비고유 항목은 순서가 맞으므로 직접 매핑
    const enNonUniques = enCat.entries.filter(e => !e.flags?.unique);
    const krNonUniques = krEntries.filter(e => !e.flags?.unique);

    const nLen = Math.min(enNonUniques.length, krNonUniques.length);
    for (let i = 0; i < nLen; i++) {
      const en = enNonUniques[i];
      const kr = krNonUniques[i];
      if (en.type && kr.type && !nameMap[en.type]) {
        nameMap[en.type] = kr.type;
      }
    }
  }

  itemCache.set(cacheKey, { data: nameMap, fetchedAt: Date.now() });
  return nameMap;
}

// GET /api/trade-items?game=poe1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game") || "poe1";

  try {
    const nameMap = await buildKoreanNameMap(game);
    return NextResponse.json(nameMap);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "아이템 데이터 로드 실패" },
      { status: 503 }
    );
  }
}
