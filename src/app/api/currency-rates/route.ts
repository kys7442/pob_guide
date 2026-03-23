import { NextRequest, NextResponse } from "next/server";

const cache = new Map<string, { data: unknown; fetchedAt: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10분

export interface TickerItem {
  name: string;
  chaosValue: number;
  icon: string | null;
  category: "currency" | "unique" | "scarab" | "league" | "gem";
  baseType?: string;
}

const LEAGUES = ["Mercenaries", "Settlers", "Mirage", "Standard"];
const UNIQUE_TYPES = ["UniqueArmour", "UniqueWeapon", "UniqueAccessory", "UniqueJewel", "UniqueFlask"];

async function ninjaFetch(url: string) {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached.data;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Accept": "application/json",
    },
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  cache.set(url, { data, fetchedAt: Date.now() });
  return data;
}

// 리그 병렬 감지: 모두 동시에 요청 후 가장 먼저 성공한 것 사용
async function findActiveLeague(): Promise<string> {
  const cacheKey = "__active_league__";
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached.data as string;

  const results = await Promise.allSettled(
    LEAGUES.map(async league => {
      const d = await ninjaFetch(
        `https://poe.ninja/api/data/currencyoverview?league=${encodeURIComponent(league)}&type=Currency`
      ) as { lines: unknown[] };
      if (!d.lines?.length) throw new Error("empty");
      return league;
    })
  );

  for (let i = 0; i < LEAGUES.length; i++) {
    if (results[i].status === "fulfilled") {
      const league = (results[i] as PromiseFulfilledResult<string>).value;
      cache.set(cacheKey, { data: league, fetchedAt: Date.now() });
      return league;
    }
  }
  return "Standard";
}

type NinjaLine = { name?: string; currencyTypeName?: string; baseType?: string; chaosValue?: number; chaosEquivalent?: number; icon?: string };

function dedup(items: TickerItem[]): TickerItem[] {
  return items.filter((item, i, arr) => arr.findIndex(x => x.name === item.name) === i);
}

function topN(items: TickerItem[], n = 50): TickerItem[] {
  return dedup(items.sort((a, b) => b.chaosValue - a.chaosValue)).slice(0, n);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section") || "all";

  try {
    const league = await findActiveLeague();
    const enc = encodeURIComponent(league);

    // ── 모든 카테고리 병렬 fetch ──────────────────────────────────────
    const [
      currencyRaw,
      fragmentRaw,
      scarabRaw,
      gemRaw,
      ...uniqueRaws
    ] = await Promise.all([
      ninjaFetch(`https://poe.ninja/api/data/currencyoverview?league=${enc}&type=Currency`)
        .catch(() => ({ lines: [], currencyDetails: [] })),
      ninjaFetch(`https://poe.ninja/api/data/currencyoverview?league=${enc}&type=Fragment`)
        .catch(() => ({ lines: [], currencyDetails: [] })),
      ninjaFetch(`https://poe.ninja/api/data/itemoverview?league=${enc}&type=Scarab`)
        .catch(() => ({ lines: [] })),
      ninjaFetch(`https://poe.ninja/api/data/itemoverview?league=${enc}&type=SkillGem`)
        .catch(() => ({ lines: [] })),
      ...UNIQUE_TYPES.map(type =>
        ninjaFetch(`https://poe.ninja/api/data/itemoverview?league=${enc}&type=${type}`)
          .catch(() => ({ lines: [] }))
      ),
    ]) as [
      { lines: Array<NinjaLine>; currencyDetails: Array<{ name: string; icon: string }> },
      { lines: Array<NinjaLine>; currencyDetails: Array<{ name: string; icon: string }> },
      { lines: Array<NinjaLine> },
      { lines: Array<NinjaLine> },
      ...Array<{ lines: Array<NinjaLine> }>
    ];

    // ── 화폐 ─────────────────────────────────────────────────────────
    const iconMap = new Map((currencyRaw.currencyDetails ?? []).map(c => [c.name, c.icon]));

    const currencies: TickerItem[] = topN(
      (currencyRaw.lines ?? [])
        .filter(l => (l.chaosEquivalent ?? 0) >= 1)
        .map(l => ({
          name: l.currencyTypeName!,
          chaosValue: Math.round((l.chaosEquivalent ?? 0) * 10) / 10,
          icon: iconMap.get(l.currencyTypeName!) ?? null,
          category: "currency" as const,
        }))
    );

    if (section === "currency") return NextResponse.json({ league, items: currencies });

    // ── 고유 아이템 ───────────────────────────────────────────────────
    const allUniques: TickerItem[] = uniqueRaws.flatMap(d =>
      (d.lines ?? [])
        .filter((l: NinjaLine) => (l.chaosValue ?? 0) > 0)
        .map((l: NinjaLine) => ({
          name: l.name!,
          chaosValue: Math.round(l.chaosValue ?? 0),
          icon: l.icon ?? null,
          category: "unique" as const,
          baseType: l.baseType,
        }))
    );
    const uniqueItems = topN(allUniques);

    if (section === "unique") return NextResponse.json({ league, items: uniqueItems });

    // ── 갑충석 ───────────────────────────────────────────────────────
    const scarabs: TickerItem[] = topN(
      (scarabRaw.lines ?? [])
        .filter((l: NinjaLine) => (l.chaosValue ?? 0) > 0)
        .map((l: NinjaLine) => ({
          name: l.name!,
          chaosValue: Math.round(l.chaosValue ?? 0),
          icon: l.icon ?? null,
          category: "scarab" as const,
          baseType: l.baseType,
        }))
    );

    if (section === "scarab") return NextResponse.json({ league, items: scarabs });

    // ── 리그 아이템 (Fragment) ─────────────────────────────────────────
    const fIconMap = new Map((fragmentRaw.currencyDetails ?? []).map(c => [c.name, c.icon]));
    const leagueItems: TickerItem[] = topN(
      (fragmentRaw.lines ?? [])
        .filter((l: NinjaLine) => (l.chaosEquivalent ?? 0) >= 1)
        .map((l: NinjaLine) => ({
          name: l.currencyTypeName!,
          chaosValue: Math.round((l.chaosEquivalent ?? 0) * 10) / 10,
          icon: fIconMap.get(l.currencyTypeName!) ?? null,
          category: "league" as const,
        }))
    );

    if (section === "league") return NextResponse.json({ league, items: leagueItems });

    // ── 스킬 젬 ───────────────────────────────────────────────────────
    const skillGems: TickerItem[] = topN(
      (gemRaw.lines ?? [])
        .filter((l: NinjaLine) => (l.chaosValue ?? 0) > 0)
        .map((l: NinjaLine) => ({
          name: l.name!,
          chaosValue: Math.round(l.chaosValue ?? 0),
          icon: l.icon ?? null,
          category: "gem" as const,
          baseType: l.baseType,
        }))
    );

    if (section === "gem") return NextResponse.json({ league, items: skillGems });

    // ── 티커용 벨트 (기존 호환) ───────────────────────────────────────
    const BELT_BASE_TYPES = ["Belt", "Sash", "Buckle", "Cord", "Strap", "Band",
      "Leather Belt", "Heavy Belt", "Rustic Sash", "Studded Belt", "Chain Belt", "Cloth Belt", "Crystal Belt"];
    const belts: TickerItem[] = topN(
      allUniques.filter(l => BELT_BASE_TYPES.some(b => l.baseType?.includes(b)))
    );

    return NextResponse.json({ league, currencies, belts, top10: uniqueItems.slice(0, 10), uniqueItems, scarabs, leagueItems, skillGems });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "데이터 로드 실패" },
      { status: 503 }
    );
  }
}
