import { NextRequest, NextResponse } from "next/server";

const cache = new Map<string, { data: unknown; fetchedAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5분

export interface NinjaBuild {
  rank: number;
  name: string;
  class: string;
  ascendancy: string;
  level: number;
  life: number;
  energyShield: number;
  ehp: number;
  dps: number;
  mainSkill: string;
  pobCode?: string;
  accountName?: string;
  characterName?: string;
  online?: boolean;
  dead?: boolean;
  retired?: boolean;
  experience?: number;
  depthSolo?: number;
  depthDuo?: number;
}

const LEAGUES = ["Mercenaries", "Settlers", "Mirage", "Standard"];

async function findActiveLeague(): Promise<string> {
  for (const league of LEAGUES) {
    try {
      const url = `https://poe.ninja/api/data/builds?league=${encodeURIComponent(league)}&type=exp&limit=1`;
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" },
        signal: AbortSignal.timeout(6000),
        cache: "no-store",
      });
      if (res.ok) {
        const d = await res.json() as { entries?: unknown[] };
        if (d.entries && d.entries.length > 0) return league;
      }
    } catch { /* next */ }
  }
  return "Standard";
}

// GET /api/ninja-builds?league=Mirage&sort=dps&min-life=2000&min-ehp=20000&min-energyshield=1000&offset=0&limit=20
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const league = searchParams.get("league") || await findActiveLeague();
  const sort = searchParams.get("sort") || "dps";
  const minLife = searchParams.get("min-life") || "";
  const minEhp = searchParams.get("min-ehp") || "";
  const minEs = searchParams.get("min-energyshield") || "";
  const classParam = searchParams.get("class") || "";
  const offset = searchParams.get("offset") || "0";
  const limit = "50";

  // 캐시 키
  const cacheKey = `ninja-builds:${league}:${sort}:${minLife}:${minEhp}:${minEs}:${classParam}:${offset}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const params = new URLSearchParams({ league, type: "exp", sort, limit, offset });
    if (minLife) params.set("min-life", minLife);
    if (minEhp) params.set("min-ehp", minEhp);
    if (minEs) params.set("min-energyshield", minEs);
    if (classParam) params.set("class", classParam);

    const url = `https://poe.ninja/api/data/builds?${params.toString()}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "application/json",
        "Referer": "https://poe.ninja/",
      },
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });

    if (!res.ok) throw new Error(`poe.ninja HTTP ${res.status}`);

    const raw = await res.json() as {
      entries?: Array<{
        rank?: number;
        account?: { name?: string };
        character?: {
          name?: string; class?: string; ascendancy?: string;
          level?: number; life?: number; energyShield?: number;
          ehp?: number; dps?: number; mainSkill?: string;
          pobCode?: string; experience?: number;
          depthSolo?: number; depthDuo?: number;
          online?: boolean; dead?: boolean; retired?: boolean;
        };
      }>;
      total?: number;
    };

    const builds: NinjaBuild[] = (raw.entries ?? []).map((e, i) => ({
      rank: e.rank ?? (parseInt(offset) + i + 1),
      name: e.character?.name ?? "Unknown",
      class: e.character?.class ?? "",
      ascendancy: e.character?.ascendancy ?? "",
      level: e.character?.level ?? 0,
      life: e.character?.life ?? 0,
      energyShield: e.character?.energyShield ?? 0,
      ehp: e.character?.ehp ?? 0,
      dps: e.character?.dps ?? 0,
      mainSkill: e.character?.mainSkill ?? "",
      pobCode: e.character?.pobCode,
      accountName: e.account?.name,
      characterName: e.character?.name,
      online: e.character?.online,
      dead: e.character?.dead,
      retired: e.character?.retired,
      experience: e.character?.experience,
      depthSolo: e.character?.depthSolo,
      depthDuo: e.character?.depthDuo,
    }));

    const result = { league, total: raw.total ?? 0, builds };
    cache.set(cacheKey, { data: result, fetchedAt: Date.now() });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "데이터 로드 실패" },
      { status: 503 }
    );
  }
}
