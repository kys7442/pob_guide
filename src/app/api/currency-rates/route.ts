import { NextRequest, NextResponse } from "next/server";

const cache = new Map<string, { data: unknown; fetchedAt: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10분
const CACHE_MAX_SIZE = 30;

function cacheSet(key: string, data: unknown) {
  if (cache.size >= CACHE_MAX_SIZE) {
    // 가장 오래된 항목 삭제
    const oldest = [...cache.entries()].sort((a, b) => a[1].fetchedAt - b[1].fetchedAt)[0];
    if (oldest) cache.delete(oldest[0]);
  }
  cache.set(key, { data, fetchedAt: Date.now() });
}

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
  cacheSet(url, data);
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
      cacheSet(cacheKey, league);
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

const BELT_BASE_TYPES = ["Belt", "Sash", "Buckle", "Cord", "Strap", "Band",
  "Leather Belt", "Heavy Belt", "Rustic Sash", "Studded Belt", "Chain Belt", "Cloth Belt", "Crystal Belt"];

function parseCurrencies(raw: { lines: Array<NinjaLine>; currencyDetails: Array<{ name: string; icon: string }> }): TickerItem[] {
  const iconMap = new Map((raw.currencyDetails ?? []).map(c => [c.name, c.icon]));
  return topN(
    (raw.lines ?? [])
      .filter(l => (l.chaosEquivalent ?? 0) >= 1)
      .map(l => ({
        name: l.currencyTypeName!,
        chaosValue: Math.round((l.chaosEquivalent ?? 0) * 10) / 10,
        icon: iconMap.get(l.currencyTypeName!) ?? null,
        category: "currency" as const,
      }))
  );
}

function parseUniques(raws: Array<{ lines: Array<NinjaLine> }>): TickerItem[] {
  return topN(
    raws.flatMap(d =>
      (d.lines ?? [])
        .filter((l: NinjaLine) => (l.chaosValue ?? 0) > 0)
        .map((l: NinjaLine) => ({
          name: l.name!,
          chaosValue: Math.round(l.chaosValue ?? 0),
          icon: l.icon ?? null,
          category: "unique" as const,
          baseType: l.baseType,
        }))
    )
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const section = searchParams.get("section") || "ticker";

  try {
    const league = await findActiveLeague();
    const enc = encodeURIComponent(league);

    // ── currency ─────────────────────────────────────────────────────
    if (section === "currency") {
      const raw = await ninjaFetch(`https://poe.ninja/api/data/currencyoverview?league=${enc}&type=Currency`)
        .catch(() => ({ lines: [], currencyDetails: [] })) as { lines: Array<NinjaLine>; currencyDetails: Array<{ name: string; icon: string }> };
      return NextResponse.json({ league, items: parseCurrencies(raw) });
    }

    // ── scarab ────────────────────────────────────────────────────────
    if (section === "scarab") {
      const raw = await ninjaFetch(`https://poe.ninja/api/data/itemoverview?league=${enc}&type=Scarab`)
        .catch(() => ({ lines: [] })) as { lines: Array<NinjaLine> };
      return NextResponse.json({ league, items: topN((raw.lines ?? []).filter(l => (l.chaosValue ?? 0) > 0).map(l => ({ name: l.name!, chaosValue: Math.round(l.chaosValue ?? 0), icon: l.icon ?? null, category: "scarab" as const, baseType: l.baseType }))) });
    }

    // ── gem ───────────────────────────────────────────────────────────
    if (section === "gem") {
      const raw = await ninjaFetch(`https://poe.ninja/api/data/itemoverview?league=${enc}&type=SkillGem`)
        .catch(() => ({ lines: [] })) as { lines: Array<NinjaLine> };
      return NextResponse.json({ league, items: topN((raw.lines ?? []).filter(l => (l.chaosValue ?? 0) > 0).map(l => ({ name: l.name!, chaosValue: Math.round(l.chaosValue ?? 0), icon: l.icon ?? null, category: "gem" as const, baseType: l.baseType }))) });
    }

    // ── league (fragment) ─────────────────────────────────────────────
    if (section === "league") {
      const raw = await ninjaFetch(`https://poe.ninja/api/data/currencyoverview?league=${enc}&type=Fragment`)
        .catch(() => ({ lines: [], currencyDetails: [] })) as { lines: Array<NinjaLine>; currencyDetails: Array<{ name: string; icon: string }> };
      const fIconMap = new Map((raw.currencyDetails ?? []).map(c => [c.name, c.icon]));
      return NextResponse.json({ league, items: topN((raw.lines ?? []).filter(l => (l.chaosEquivalent ?? 0) >= 1).map(l => ({ name: l.currencyTypeName!, chaosValue: Math.round((l.chaosEquivalent ?? 0) * 10) / 10, icon: fIconMap.get(l.currencyTypeName!) ?? null, category: "league" as const }))) });
    }

    // ── unique ────────────────────────────────────────────────────────
    if (section === "unique") {
      const uniqueRaws = await Promise.all(
        UNIQUE_TYPES.map(type =>
          ninjaFetch(`https://poe.ninja/api/data/itemoverview?league=${enc}&type=${type}`)
            .catch(() => ({ lines: [] }))
        )
      ) as Array<{ lines: Array<NinjaLine> }>;
      return NextResponse.json({ league, items: parseUniques(uniqueRaws) });
    }

    // ── ticker (기본값) — 5개 카테고리 병렬 요청 ─────────
    const [currencyRaw, fragmentRaw, scarabRaw, gemRaw, ...uniqueRaws] = await Promise.all([
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

    const currencies = parseCurrencies(currencyRaw);
    const uniqueItems = parseUniques(uniqueRaws);

    const fIconMap = new Map((fragmentRaw.currencyDetails ?? []).map(c => [c.name, c.icon]));
    const leagueItems = topN(
      (fragmentRaw.lines ?? [])
        .filter(l => (l.chaosEquivalent ?? 0) >= 1)
        .map(l => ({
          name: l.currencyTypeName!,
          chaosValue: Math.round((l.chaosEquivalent ?? 0) * 10) / 10,
          icon: fIconMap.get(l.currencyTypeName!) ?? null,
          category: "league" as const,
        }))
    );

    const scarabs = topN(
      (scarabRaw.lines ?? [])
        .filter(l => (l.chaosValue ?? 0) > 0)
        .map(l => ({
          name: l.name!,
          chaosValue: Math.round(l.chaosValue ?? 0),
          icon: l.icon ?? null,
          category: "scarab" as const,
          baseType: l.baseType,
        }))
    );

    const skillGems = topN(
      (gemRaw.lines ?? [])
        .filter(l => (l.chaosValue ?? 0) > 0)
        .map(l => ({
          name: l.name!,
          chaosValue: Math.round(l.chaosValue ?? 0),
          icon: l.icon ?? null,
          category: "gem" as const,
          baseType: l.baseType,
        }))
    );

    return NextResponse.json({ league, currencies, uniqueItems, scarabs, leagueItems, skillGems });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "데이터 로드 실패" },
      { status: 503 }
    );
  }
}
