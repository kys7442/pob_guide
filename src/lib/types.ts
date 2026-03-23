export type GameVersion = "poe1" | "poe2";

export interface PlayerStat {
  stat: string;
  value: number;
}

export interface SkillGem {
  name: string;
  level?: number;
  quality?: number;
  enabled?: boolean;
  isSupport?: boolean;
  color?: "red" | "green" | "blue" | "white" | "support";
}

export interface SkillSlot {
  slotId?: string;
  label?: string;
  gems: SkillGem[];
  isMainSkill?: boolean;
}

export interface ItemProperty {
  name: string;
  value: string;
}

export interface Item {
  id?: string;
  name: string;
  rarity: "Normal" | "Magic" | "Rare" | "Unique" | "Unknown";
  baseType?: string;
  icon?: string;
  properties?: ItemProperty[];
  requirements?: ItemProperty[];
  implicitMods?: string[];
  explicitMods?: string[];
  enchantMods?: string[];
  corrupted?: boolean;
  rawText?: string;
}

export interface ItemSlot {
  slotName: string;
  item?: Item;
}

export interface PassiveInfo {
  totalNodes: number;
  nodeIds: number[];
  keystones: string[];
  nodeCounts: {
    life: number;
    defence: number;
    offence: number;
    speed: number;
    other: number;
  };
}

export interface BuildMeta {
  gameVersion: GameVersion;
  source: "pob" | "ninja";
}

export interface ParsedBuild {
  meta: BuildMeta;
  character: {
    level: number;
    className: string;
    ascendClassName: string;
    mainSkill?: string;
  };
  stats: PlayerStat[];
  skills: SkillSlot[];
  items: ItemSlot[];
  passives: PassiveInfo;
}
