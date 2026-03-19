import type { PlayerStat } from "./types";
import { translateStat } from "./translations";

export interface FormattedStat {
  key: string;
  label: string;
  value: string;
  raw: number;
  category: "survival" | "defence" | "offence" | "resistance" | "other";
  highlight?: boolean;
}

// 표시할 주요 스탯 목록과 순서
const DISPLAY_STATS: Array<{
  key: string;
  category: FormattedStat["category"];
  format?: "number" | "percent" | "multiplier";
  highlight?: boolean;
}> = [
  { key: "Life", category: "survival", highlight: true },
  { key: "TotalLife", category: "survival", highlight: true },
  { key: "EnergyShield", category: "survival" },
  { key: "TotalEnergyShield", category: "survival" },
  { key: "Mana", category: "survival" },
  { key: "TotalMana", category: "survival" },
  { key: "TotalDPS", category: "offence", highlight: true },
  { key: "WithPoisonDPS", category: "offence" },
  { key: "CombinedDPS", category: "offence" },
  { key: "AverageDamage", category: "offence" },
  { key: "CritChance", category: "offence", format: "percent" },
  { key: "CritMultiplier", category: "offence", format: "multiplier" },
  { key: "Armour", category: "defence" },
  { key: "TotalArmour", category: "defence" },
  { key: "Evasion", category: "defence" },
  { key: "TotalEvasion", category: "defence" },
  { key: "BlockChance", category: "defence", format: "percent" },
  { key: "SpellBlockChance", category: "defence", format: "percent" },
  { key: "FireResist", category: "resistance" },
  { key: "ColdResist", category: "resistance" },
  { key: "LightningResist", category: "resistance" },
  { key: "ChaosResist", category: "resistance" },
  { key: "MovementSpeed", category: "other", format: "percent" },
  { key: "LifeRegen", category: "other" },
];

export function formatStats(stats: PlayerStat[]): FormattedStat[] {
  const statMap = new Map(stats.map((s) => [s.stat, s.value]));
  const result: FormattedStat[] = [];

  for (const def of DISPLAY_STATS) {
    // Life 중복 방지: TotalLife가 있으면 Life는 생략
    if (def.key === "Life" && statMap.has("TotalLife")) continue;
    if (def.key === "EnergyShield" && statMap.has("TotalEnergyShield")) continue;
    if (def.key === "Mana" && statMap.has("TotalMana")) continue;
    if (def.key === "Armour" && statMap.has("TotalArmour")) continue;
    if (def.key === "Evasion" && statMap.has("TotalEvasion")) continue;
    if (def.key === "TotalDPS" && statMap.has("CombinedDPS")) continue;

    const value = statMap.get(def.key);
    if (value === undefined || value === 0) continue;

    result.push({
      key: def.key,
      label: translateStat(def.key),
      value: formatValue(value, def.format),
      raw: value,
      category: def.category,
      highlight: def.highlight,
    });
  }

  return result;
}

function formatValue(value: number, format?: string): string {
  if (format === "percent") {
    return `${value.toFixed(1)}%`;
  }
  if (format === "multiplier") {
    return `${value.toFixed(0)}%`;
  }

  // 큰 수 포맷팅
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return value.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  return value.toFixed(1);
}

export function getResistances(stats: PlayerStat[]): {
  fire: number;
  cold: number;
  lightning: number;
  chaos: number;
} {
  const statMap = new Map(stats.map((s) => [s.stat, s.value]));
  return {
    fire: statMap.get("FireResist") || 0,
    cold: statMap.get("ColdResist") || 0,
    lightning: statMap.get("LightningResist") || 0,
    chaos: statMap.get("ChaosResist") || -60,
  };
}

export function getResistanceColor(value: number): string {
  if (value >= 75) return "text-yellow-400"; // 캡
  if (value >= 50) return "text-green-400";
  if (value >= 0) return "text-blue-400";
  return "text-red-400"; // 음수
}
