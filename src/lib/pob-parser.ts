import { XMLParser } from "fast-xml-parser";
import { inflateSync } from "zlib";
import type { ParsedBuild, PlayerStat, SkillSlot, SkillGem, ItemSlot, Item, PassiveInfo, GameVersion } from "./types";
import { KEYSTONE_KR, getGemColor } from "./translations";

// 실제 PoB 슬롯명 → 표준 슬롯명 매핑
const SLOT_NAME_MAP: Record<string, string> = {
  "Weapon 1": "Weapon 1",
  "Weapon 2": "Weapon 2",
  "Weapon 1 Swap": "Weapon 1 Swap",
  "Weapon 2 Swap": "Weapon 2 Swap",
  "Body Armour": "Body Armour",
  "Helmet": "Helmet",
  "Gloves": "Gloves",
  "Boots": "Boots",
  "Ring 1": "Ring 1",
  "Ring 2": "Ring 2",
  "Ring 3": "Ring 3",
  "Amulet": "Amulet",
  "Belt": "Belt",
  "Flask 1": "Flask 1",
  "Flask 2": "Flask 2",
  "Flask 3": "Flask 3",
  "Flask 4": "Flask 4",
  "Flask 5": "Flask 5",
};

// 메인 장비 슬롯 (Abyssal Socket 등 제외)
const MAIN_SLOTS = new Set([
  "Weapon 1", "Weapon 2", "Weapon 1 Swap", "Weapon 2 Swap",
  "Body Armour", "Helmet", "Gloves", "Boots",
  "Ring 1", "Ring 2", "Ring 3", "Amulet", "Belt",
  "Flask 1", "Flask 2", "Flask 3", "Flask 4", "Flask 5",
]);

export function parsePobCode(pobCode: string): ParsedBuild {
  // 1. URL-safe base64 → 표준 base64
  const base64 = pobCode
    .trim()
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  // 2. base64 디코딩
  const compressed = Buffer.from(base64, "base64");

  // 3. zlib inflate 압축 해제
  let xmlString: string;
  try {
    xmlString = inflateSync(compressed).toString("utf-8");
  } catch {
    throw new Error("PoB 코드 압축 해제 실패. 올바른 PoB 코드인지 확인해주세요.");
  }

  // 4. XML 파싱
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: (name) =>
      ["Skill", "Gem", "Item", "Slot", "PlayerStat", "SkillSet", "Spec"].includes(name),
  });

  let xmlData: Record<string, unknown>;
  try {
    xmlData = parser.parse(xmlString);
  } catch {
    throw new Error("XML 파싱 실패. PoB 코드 형식이 올바르지 않습니다.");
  }

  const pathOfBuilding = xmlData["PathOfBuilding"] as Record<string, unknown>;
  if (!pathOfBuilding) {
    throw new Error("올바른 PathOfBuilding 형식이 아닙니다.");
  }

  // 5. 게임 버전 감지
  const buildNode = pathOfBuilding["Build"] as Record<string, unknown>;
  const targetVersion = String(buildNode?.["@_targetVersion"] || "3_0");
  const gameVersion: GameVersion = targetVersion.startsWith("2") ? "poe2" : "poe1";

  // 6. 캐릭터 정보
  const level = parseInt(String(buildNode?.["@_level"] || "1"), 10);
  const className = String(buildNode?.["@_className"] || "");
  const ascendClassName = String(buildNode?.["@_ascendClassName"] || "");
  const mainSocketGroup = parseInt(String(buildNode?.["@_mainSocketGroup"] || "1"), 10);

  // 7. 스탯 추출
  const playerStats = buildNode?.["PlayerStat"] as Array<Record<string, unknown>> || [];
  const stats: PlayerStat[] = playerStats.map((s) => ({
    stat: String(s["@_stat"] || ""),
    value: parseFloat(String(s["@_value"] || "0")),
  }));

  // 8. 스킬 추출 — Skills > SkillSet > Skill (실제 PoB 구조)
  const skillsNode = pathOfBuilding["Skills"] as Record<string, unknown>;
  let rawSkills: Array<Record<string, unknown>> = [];

  // SkillSet이 있는 경우 (최신 PoB)
  const skillSets = skillsNode?.["SkillSet"] as Array<Record<string, unknown>>;
  if (skillSets && skillSets.length > 0) {
    // activeSkillSet 또는 첫 번째 세트 사용
    const activeSetId = String(skillsNode?.["@_activeSkillSet"] || "1");
    const activeSet = skillSets.find(
      (s) => String(s["@_id"]) === activeSetId
    ) || skillSets[0];
    rawSkills = (activeSet["Skill"] as Array<Record<string, unknown>>) || [];
  } else {
    // 직접 Skills > Skill (구버전 PoB)
    rawSkills = (skillsNode?.["Skill"] as Array<Record<string, unknown>>) || [];
  }

  const skills: SkillSlot[] = rawSkills
    .map((skill, idx) => {
      const gemList = (skill["Gem"] as Array<Record<string, unknown>>) || [];
      const gems: SkillGem[] = gemList.map((gem) => {
        const gemId = String(gem["@_gemId"] || "");
        const nameSpec = String(gem["@_nameSpec"] || "");
        const isSupport = gemId.includes("Support");
        return {
          name: nameSpec,
          level: parseInt(String(gem["@_level"] || "1"), 10),
          quality: parseInt(String(gem["@_quality"] || "0"), 10),
          enabled: String(gem["@_enabled"] || "true") === "true",
          isSupport,
          color: getGemColor(nameSpec, isSupport),
        };
      });

      const slotRaw = String(skill["@_slot"] || "");
      return {
        slotId: slotRaw,
        label: slotRaw || `스킬 그룹 ${idx + 1}`,
        gems,
        isMainSkill: idx + 1 === mainSocketGroup,
      };
    })
    .filter((s) => s.gems.length > 0);

  // 메인 스킬 이름
  const mainSkillSlot = skills.find((s) => s.isMainSkill) || skills[0];
  const mainSkill = mainSkillSlot?.gems.find((g) => !g.isSupport)?.name;

  // 9. 아이템 추출
  const itemsNode = pathOfBuilding["Items"] as Record<string, unknown>;
  const itemList = (itemsNode?.["Item"] as Array<Record<string, unknown>>) || [];

  // 아이템 ID → 아이템 매핑
  const itemMap = new Map<string, Item>();
  for (const rawItem of itemList) {
    const itemId = String(rawItem["@_id"] || "");
    const rawText = typeof rawItem === "string"
      ? rawItem
      : String(rawItem["#text"] || "");
    itemMap.set(itemId, parseItemText(rawText));
  }

  // ItemSet 추출 (첫 번째 또는 활성 세트)
  let activeItemSet: Record<string, unknown> | null = null;
  const rawItemSets = itemsNode?.["ItemSet"];
  if (Array.isArray(rawItemSets)) {
    activeItemSet = rawItemSets[0] as Record<string, unknown>;
  } else if (rawItemSets && typeof rawItemSets === "object") {
    activeItemSet = rawItemSets as Record<string, unknown>;
  }

  const items: ItemSlot[] = [];
  const processedSlots = new Set<string>();

  if (activeItemSet) {
    const slotList = (activeItemSet["Slot"] as Array<Record<string, unknown>>) || [];
    for (const slot of slotList) {
      const slotName = String(slot["@_name"] || "");
      const itemId = String(slot["@_itemId"] || "0");

      // 메인 슬롯만 포함 (Abyssal Socket 등 제외)
      if (!MAIN_SLOTS.has(slotName)) continue;
      if (processedSlots.has(slotName)) continue;
      processedSlots.add(slotName);

      items.push({
        slotName,
        item: itemId !== "0" ? itemMap.get(itemId) : undefined,
      });
    }
  }

  // 빠진 메인 슬롯 추가
  for (const slot of MAIN_SLOTS) {
    if (!processedSlots.has(slot)) {
      items.push({ slotName: slot, item: undefined });
    }
  }

  // 정렬
  const SLOT_ORDER = [
    "Helmet", "Body Armour", "Gloves", "Boots",
    "Weapon 1", "Weapon 2", "Weapon 1 Swap", "Weapon 2 Swap",
    "Amulet", "Ring 1", "Ring 2", "Ring 3", "Belt",
    "Flask 1", "Flask 2", "Flask 3", "Flask 4", "Flask 5",
  ];
  items.sort((a, b) => {
    const ai = SLOT_ORDER.indexOf(a.slotName);
    const bi = SLOT_ORDER.indexOf(b.slotName);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  // 10. 패시브 트리
  const treeNode = pathOfBuilding["Tree"] as Record<string, unknown>;
  let nodesStr = "";
  const specList = treeNode?.["Spec"] as Array<Record<string, unknown>>;
  if (Array.isArray(specList) && specList.length > 0) {
    // activeSpec 또는 첫번째
    const activeSpecId = String(treeNode?.["@_activeSpec"] || "1");
    const activeSpec = specList.find((s) => String(s["@_title"] || s["@_id"] || "1") === activeSpecId) || specList[0];
    nodesStr = String(activeSpec?.["@_nodes"] || "");
  } else if (treeNode?.["Spec"] && typeof treeNode["Spec"] === "object") {
    const spec = treeNode["Spec"] as Record<string, unknown>;
    nodesStr = String(spec["@_nodes"] || "");
  }

  const nodes = nodesStr ? nodesStr.split(",").map(n => n.trim()).filter(Boolean) : [];
  const keystonesInXml = extractKeystonesFromXml(pathOfBuilding);

  const passives: PassiveInfo = {
    totalNodes: nodes.length,
    nodeIds: nodes.map(n => parseInt(n, 10)).filter(n => !isNaN(n)),
    keystones: keystonesInXml,
    nodeCounts: estimateNodeCounts(nodes.length),
  };

  return {
    meta: { gameVersion, source: "pob" },
    character: { level, className, ascendClassName, mainSkill },
    stats,
    skills: skills.filter((s) => s.gems.length > 0),
    items,
    passives,
  };
}

function parseItemText(text: string): Item {
  // XML 태그 제거
  const cleaned = text
    .replace(/<[^>]+>/g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  if (cleaned.length === 0) {
    return { name: "알 수 없는 아이템", rarity: "Unknown" };
  }

  let rarity: Item["rarity"] = "Normal";
  let name = "";
  let baseType = "";
  let icon: string | undefined;
  const implicitMods: string[] = [];
  const explicitMods: string[] = [];

  let nameLines: string[] = [];
  let implicitCount = 0;
  let foundImplicits = false;
  let modsCollected = 0;

  // 메타데이터로 건너뛸 라인 패턴
  const META_PATTERNS = [
    /^Unique ID:/,
    /^Item Level:/,
    /^LevelReq:/,
    /^Quality:/,
    /^Sockets:/,
    /^Energy Shield:/,
    /^Armour:/,
    /^Evasion:/,
    /^EnergyShieldBasePercentile:/,
    /^ArmourBasePercentile:/,
    /^EvasionBasePercentile:/,
    /^Requires Level/,
    /^Requires Str/,
    /^Requires Dex/,
    /^Requires Int/,
    /^--------/,
    /^Corrupted$/,
    /^Mirrored$/,
    /^Synthesised Item$/,
    /^\{.*\}$/,  // {mutated} 등 태그
  ];

  for (const line of cleaned) {
    if (line.startsWith("Rarity: ")) {
      const r = line.replace("Rarity: ", "").trim().toLowerCase();
      if (r === "unique") rarity = "Unique";
      else if (r === "rare") rarity = "Rare";
      else if (r === "magic") rarity = "Magic";
      else rarity = "Normal";
      continue;
    }

    if (line.startsWith("Icon: ")) {
      const iconPath = line.replace("Icon: ", "").trim();
      icon = `https://web.poecdn.com/image/${iconPath}`;
      continue;
    }

    if (line.startsWith("Implicits: ")) {
      implicitCount = parseInt(line.replace("Implicits: ", "").trim(), 10);
      foundImplicits = true;
      modsCollected = 0;
      continue;
    }

    // 메타데이터 스킵
    if (META_PATTERNS.some((p) => p.test(line))) continue;

    // {mutated} 같은 prefix 제거
    const cleanLine = line.replace(/^\{[^}]+\}/, "").trim();
    if (!cleanLine) continue;

    if (!foundImplicits) {
      // Implicits: N 줄 전 → 이름/베이스 타입
      nameLines.push(cleanLine);
    } else {
      // Implicits 이후
      if (modsCollected < implicitCount) {
        implicitMods.push(cleanLine);
        modsCollected++;
      } else {
        explicitMods.push(cleanLine);
      }
    }
  }

  // 이름 처리
  if (nameLines.length >= 2) {
    name = nameLines[0];
    baseType = nameLines[1];
  } else if (nameLines.length === 1) {
    name = nameLines[0];
  }

  return {
    name: name || "아이템",
    rarity,
    baseType: baseType || undefined,
    icon,
    implicitMods: implicitMods.filter(m => m.length > 0),
    explicitMods: explicitMods.filter(m => m.length > 0 && !m.startsWith("ModRange")),
    rawText: text,
  };
}

function extractKeystonesFromXml(data: Record<string, unknown>): string[] {
  const keystones: string[] = [];
  const knownKeystoneNames = Object.keys(KEYSTONE_KR);
  const jsonStr = JSON.stringify(data);
  for (const name of knownKeystoneNames) {
    if (jsonStr.includes(`"${name}"`)) {
      keystones.push(name);
    }
  }
  return keystones;
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
