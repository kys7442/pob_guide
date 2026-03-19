import type { ParsedBuild, ItemSlot, Item, PassiveInfo, GameVersion } from "./types";

interface NinjaCharacterData {
  character: {
    name: string;
    class: string;
    level: number;
    league: string;
  };
  items: NinjaItem[];
  passiveSkills?: {
    items?: NinjaItem[];
    hashes?: number[];
    masteryEffects?: Record<string, number>;
    banditChoice?: string;
    pantheonMajor?: string;
    pantheonMinor?: string;
  };
}

interface NinjaItem {
  id: string;
  name: string;
  typeLine?: string;
  baseType?: string;
  frameType?: number;
  identified?: boolean;
  inventoryId?: string;
  icon?: string;
  properties?: Array<{ name: string; values: Array<[string, number]> }>;
  requirements?: Array<{ name: string; values: Array<[string, number]> }>;
  implicitMods?: string[];
  explicitMods?: string[];
  socketedItems?: NinjaItem[];
  sockets?: Array<{ group: number; sClass: string; attr: string }>;
}

// poe.ninja URL 파싱
export function parseNinjaUrl(url: string): {
  gameVersion: GameVersion;
  league: string;
  accountName: string;
  charName: string;
} | null {
  // poe1: https://poe.ninja/poe1/builds/{league}/character/{accountName}/{charName}
  // poe2: https://poe.ninja/poe2/builds/{league}/character/{accountName}/{charName}
  // 구형: https://poe.ninja/builds/{league}/character/{accountName}/{charName}
  const poe1Match = url.match(/poe\.ninja\/poe1\/builds\/([^/]+)\/character\/([^/]+)\/([^/?]+)/);
  const poe2Match = url.match(/poe\.ninja\/poe2\/builds\/([^/]+)\/character\/([^/]+)\/([^/?]+)/);
  const legacyMatch = url.match(/poe\.ninja\/builds\/([^/]+)\/character\/([^/]+)\/([^/?]+)/);

  if (poe1Match) {
    return { gameVersion: "poe1", league: poe1Match[1], accountName: poe1Match[2], charName: poe1Match[3] };
  }
  if (poe2Match) {
    return { gameVersion: "poe2", league: poe2Match[1], accountName: poe2Match[2], charName: poe2Match[3] };
  }
  if (legacyMatch) {
    return { gameVersion: "poe1", league: legacyMatch[1], accountName: legacyMatch[2], charName: legacyMatch[3] };
  }
  return null;
}

export async function fetchNinjaCharacter(
  accountName: string,
  charName: string,
  gameVersion: GameVersion
): Promise<ParsedBuild> {
  const baseUrl =
    gameVersion === "poe2"
      ? "https://www.pathofexile.com/character-window/get-items"
      : "https://www.pathofexile.com/character-window/get-items";

  // GGG API 호출 (서버사이드)
  const itemsRes = await fetch(
    `${baseUrl}?accountName=${encodeURIComponent(accountName)}&character=${encodeURIComponent(charName)}`,
    {
      headers: {
        "User-Agent": "poe-build-guide/1.0",
      },
      next: { revalidate: 300 }, // 5분 캐시
    }
  );

  if (!itemsRes.ok) {
    if (itemsRes.status === 403) {
      throw new Error("캐릭터 정보가 비공개 설정입니다. 캐릭터를 공개로 설정해주세요.");
    }
    throw new Error(`GGG API 오류: ${itemsRes.status} ${itemsRes.statusText}`);
  }

  const itemsData = (await itemsRes.json()) as NinjaCharacterData;

  // 패시브 스킬 가져오기
  let passiveData: NinjaCharacterData["passiveSkills"] | null = null;
  try {
    const passiveRes = await fetch(
      `https://www.pathofexile.com/character-window/get-passive-skills?accountName=${encodeURIComponent(accountName)}&character=${encodeURIComponent(charName)}`,
      {
        headers: {
          "User-Agent": "poe-build-guide/1.0",
        },
        next: { revalidate: 300 },
      }
    );
    if (passiveRes.ok) {
      const pd = await passiveRes.json();
      passiveData = pd as NinjaCharacterData["passiveSkills"];
    }
  } catch {
    // 패시브 데이터 없어도 계속 진행
  }

  return convertNinjaToBuilld(itemsData, passiveData, gameVersion);
}

function frameTypeToRarity(frameType?: number): Item["rarity"] {
  switch (frameType) {
    case 0: return "Normal";
    case 1: return "Magic";
    case 2: return "Rare";
    case 3: return "Unique";
    default: return "Unknown";
  }
}

function convertNinjaToBuilld(
  data: NinjaCharacterData,
  passiveData: NinjaCharacterData["passiveSkills"] | null,
  gameVersion: GameVersion
): ParsedBuild {
  const char = data.character || {};

  // 장비 아이템 변환
  const items: ItemSlot[] = [];
  const processedSlots = new Set<string>();

  for (const ninjaItem of data.items || []) {
    if (!ninjaItem.inventoryId || ninjaItem.inventoryId === "MainInventory") continue;

    const slotName = ninjaItem.inventoryId;
    if (processedSlots.has(slotName)) continue;
    processedSlots.add(slotName);

    const item: Item = {
      id: ninjaItem.id,
      name: ninjaItem.name || ninjaItem.typeLine || "아이템",
      rarity: frameTypeToRarity(ninjaItem.frameType),
      baseType: ninjaItem.baseType || ninjaItem.typeLine,
      icon: ninjaItem.icon,
      implicitMods: ninjaItem.implicitMods || [],
      explicitMods: ninjaItem.explicitMods || [],
      properties: (ninjaItem.properties || []).map((p) => ({
        name: p.name,
        value: p.values.map((v) => v[0]).join(", "),
      })),
    };

    items.push({ slotName, item });
  }

  // 소켓된 스킬 젬 추출
  const skills = extractSkillsFromItems(data.items || []);

  // 패시브 정보
  const passives: PassiveInfo = {
    totalNodes: passiveData?.hashes?.length || 0,
    nodeIds: passiveData?.hashes || [],
    keystones: [],
    nodeCounts: estimateNodeCounts(passiveData?.hashes?.length || 0),
  };

  return {
    meta: {
      gameVersion,
      source: "ninja",
    },
    character: {
      level: char.level || 1,
      className: char.class || "",
      ascendClassName: "",
      mainSkill: skills[0]?.gems.find((g) => !g.isSupport)?.name,
    },
    stats: [],
    skills,
    items,
    passives,
  };
}

function extractSkillsFromItems(items: NinjaItem[]) {
  const skillSlots = [];

  for (const item of items) {
    if (!item.socketedItems || item.socketedItems.length === 0) continue;

    const gems = item.socketedItems.map((gem) => ({
      name: gem.name || gem.typeLine || "",
      enabled: true,
      isSupport: (gem.typeLine || "").toLowerCase().includes("support") ||
        (gem.name || "").toLowerCase().includes("support"),
    }));

    if (gems.length > 0) {
      skillSlots.push({
        slotId: item.inventoryId || "",
        label: item.name || item.typeLine || "장비 슬롯",
        gems,
        isMainSkill: skillSlots.length === 0,
      });
    }
  }

  return skillSlots;
}

function estimateNodeCounts(total: number): PassiveInfo["nodeCounts"] {
  return {
    life: Math.round(total * 0.25),
    defence: Math.round(total * 0.2),
    offence: Math.round(total * 0.3),
    speed: Math.round(total * 0.1),
    other: Math.round(total * 0.15),
  };
}
