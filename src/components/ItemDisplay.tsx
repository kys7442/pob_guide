"use client";

import { useState, useCallback, useEffect, useRef, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import type { ParsedBuild, Item } from "@/lib/types";
import { translateSlot, translateRarity, translateItemName } from "@/lib/translations";
import { useSeason } from "@/lib/season-context";
import { fetchTradeStats, matchModToStatId } from "@/lib/trade-stats";
import { useKoreanNames } from "@/lib/use-korean-names";
import { clsx } from "clsx";

// ── 리그 목록 ──────────────────────────────────────────────────────────────
async function fetchLeagues(game: "poe1" | "poe2"): Promise<string[]> {
  try {
    const res = await fetch(`/api/trade-leagues?game=${game}`);
    if (!res.ok) return [];
    return await res.json() as string[];
  } catch { return []; }
}

// ── 슬롯 → 거래소 카테고리 ─────────────────────────────────────────────────
const SLOT_TO_CATEGORY: Record<string, string> = {
  "Helmet": "armour.head",
  "Body Armour": "armour.chest",
  "Gloves": "armour.gloves",
  "Boots": "armour.boots",
  "Belt": "armour.belt",
  "Amulet": "accessory.amulet",
  "Ring 1": "accessory.ring",
  "Ring 2": "accessory.ring",
  "Ring 3": "accessory.ring",
  "Flask 1": "flask", "Flask 2": "flask", "Flask 3": "flask",
  "Flask 4": "flask", "Flask 5": "flask",
};

function getWeaponCategory(baseType: string): string {
  const b = baseType.toLowerCase();
  if (b.includes("bow")) return "weapon.bow";
  if (b.includes("wand")) return "weapon.wand";
  if (b.includes("staff") || b.includes("quarterstaff")) return "weapon.staff";
  if (b.includes("dagger") || b.includes("rune dagger")) return "weapon.dagger";
  if (b.includes("claw")) return "weapon.claw";
  if (b.includes("sword") || b.includes("foil") || b.includes("sabre") || b.includes("rapier")) return "weapon.onesword";
  if (b.includes("axe") && !b.includes("great") && !b.includes("poleaxe")) return "weapon.oneaxe";
  if (b.includes("mace") || b.includes("sceptre") || b.includes("gavel") || b.includes("club")) return "weapon.onemace";
  if (b.includes("greatsword") || b.includes("poleaxe")) return "weapon.twosword";
  if (b.includes("greataxe") || b.includes("vaal axe")) return "weapon.twoaxe";
  if (b.includes("maul") || b.includes("great mallet") || b.includes("greathammer")) return "weapon.twomace";
  return "weapon";
}

// ── 거래소 쿼리 빌더 ────────────────────────────────────────────────────────
function buildTradeQuery(
  item: Item,
  slotName: string,
  statFilters?: Array<{ id: string; value: { min: number } }>
): object {
  const query: Record<string, unknown> = { status: { option: "any" } };

  if (item.rarity === "Unique" && item.name) query.name = item.name;
  if (item.baseType) query.type = item.baseType;

  const typeFilterFields: Record<string, unknown> = {};
  const rarityMap: Record<string, string> = {
    Normal: "normal", Magic: "magic", Rare: "rare", Unique: "unique",
  };
  if (rarityMap[item.rarity]) typeFilterFields.rarity = { option: rarityMap[item.rarity] };

  let category = SLOT_TO_CATEGORY[slotName];
  if (!category && (slotName === "Weapon 1" || slotName === "Weapon 2") && item.baseType)
    category = getWeaponCategory(item.baseType);
  if (category) typeFilterFields.category = { option: category };

  const miscFilterFields: Record<string, unknown> = {};
  if (item.corrupted === true) miscFilterFields.corrupted = { option: "true" };

  const allFilters: Record<string, unknown> = {};
  if (Object.keys(typeFilterFields).length > 0) allFilters.type_filters = { filters: typeFilterFields };
  if (Object.keys(miscFilterFields).length > 0) allFilters.misc_filters = { filters: miscFilterFields };
  if (Object.keys(allFilters).length > 0) query.filters = allFilters;

  query.stats = [{ type: "and", filters: statFilters ?? [] }];
  return { query, sort: { price: "asc" } };
}

function getTradeUrl(
  item: Item, slotName: string, gameVersion: "poe1" | "poe2", league: string,
  statFilters?: Array<{ id: string; value: { min: number } }>
): string {
  const encodedLeague = encodeURIComponent(league);
  const baseUrl = gameVersion === "poe2"
    ? `https://www.pathofexile.com/trade2/search/poe2/${encodedLeague}`
    : `https://www.pathofexile.com/trade/search/${encodedLeague}`;
  const queryObj = buildTradeQuery(item, slotName, statFilters);
  return `${baseUrl}?q=${encodeURIComponent(JSON.stringify(queryObj))}`;
}

// ── 거래소 검색 버튼 (스탯 매핑 포함) ─────────────────────────────────────
type KrLookup = (name: string) => string | null;

interface TradeButtonProps {
  item: Item;
  slotName: string;
  gameVersion: "poe1" | "poe2";
  league: string;
  className?: string;
}

function TradeButton({ item, slotName, gameVersion, league, className }: TradeButtonProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (done) {
      window.open(getTradeUrl(item, slotName, gameVersion, league), "_blank", "noopener,noreferrer");
      return;
    }
    setLoading(true);
    try {
      const stats = await fetchTradeStats(gameVersion);
      const statFilters: Array<{ id: string; value: { min: number } }> = [];

      for (const mod of item.enchantMods ?? []) {
        const m = matchModToStatId(mod, stats, "enchant");
        if (m) statFilters.push({ id: m.id, value: { min: Math.floor(m.value * 0.8) } });
      }
      for (const mod of item.implicitMods ?? []) {
        const m = matchModToStatId(mod, stats, "implicit");
        if (m) statFilters.push({ id: m.id, value: { min: Math.floor(m.value * 0.8) } });
      }
      for (const mod of (item.explicitMods ?? []).slice(0, 8)) {
        const m = matchModToStatId(mod, stats, "explicit");
        if (m) statFilters.push({ id: m.id, value: { min: Math.floor(m.value * 0.8) } });
      }

      const url = getTradeUrl(item, slotName, gameVersion, league, statFilters);
      setDone(true);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      window.open(getTradeUrl(item, slotName, gameVersion, league), "_blank", "noopener,noreferrer");
    } finally {
      setLoading(false);
    }
  }, [item, slotName, gameVersion, league, done]);

  return (
    <button
      onClick={handleClick}
      title="거래소 검색"
      className={clsx(
        "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded",
        "bg-gray-800/90 border border-gray-600 text-gray-300",
        "hover:border-amber-500 hover:text-amber-400 transition-colors",
        className
      )}
    >
      {loading ? (
        <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      ) : (
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
          <polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/>
        </svg>
      )}
      거래소
    </button>
  );
}

// ── 아이템 툴팁 (포털) ─────────────────────────────────────────────────────
interface TooltipProps {
  item: Item;
  slotName: string;
  gameVersion: "poe1" | "poe2";
  league: string;
  lookupKr: KrLookup;
  anchorEl: HTMLElement;
}

function ItemTooltip({ item, slotName, gameVersion, league, lookupKr, anchorEl }: TooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0, position: "fixed", zIndex: 9999 });

  useLayoutEffect(() => {
    if (!ref.current) return;
    const anchor = anchorEl.getBoundingClientRect();
    const tip = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const GAP = 8;
    const W = Math.min(tip.width, 340);

    // 오른쪽 공간 우선, 없으면 왼쪽
    let left = anchor.right + GAP;
    if (left + W > vw - GAP) left = anchor.left - W - GAP;
    left = Math.max(GAP, left);

    let top = anchor.top;
    if (top + tip.height > vh - GAP) top = vh - tip.height - GAP;
    top = Math.max(GAP, top);

    setStyle({ position: "fixed", zIndex: 9999, top, left, width: W, opacity: 1 });
  }, [anchorEl]);

  const krName = lookupKr(item.name) ?? lookupKr(item.baseType ?? "") ??
    translateItemName(item.name) ?? translateItemName(item.baseType ?? "");

  const rarityColor: Record<Item["rarity"], string> = {
    Unique: "border-red-600 bg-red-950/95",
    Rare: "border-yellow-500 bg-yellow-950/95",
    Magic: "border-blue-600 bg-blue-950/95",
    Normal: "border-gray-500 bg-gray-900/95",
    Unknown: "border-gray-500 bg-gray-900/95",
  };

  return createPortal(
    <div
      ref={ref}
      style={style}
      className={clsx(
        "rounded-lg border p-3 shadow-2xl text-xs pointer-events-none",
        "backdrop-blur-sm max-h-[80vh] overflow-y-auto",
        rarityColor[item.rarity]
      )}
    >
      {/* 헤더: 이름 + 희귀도 */}
      <div className="mb-2">
        <div className="flex items-center gap-1.5 mb-1">
          <span className={clsx("text-[10px] px-1.5 py-0.5 rounded", getRarityBadgeClass(item.rarity))}>
            {translateRarity(item.rarity)}
          </span>
          <span className="text-[10px] text-gray-500">{translateSlot(slotName)}</span>
          {item.corrupted && (
            <span className="text-[10px] px-1 py-0.5 rounded bg-red-900/60 text-red-400">타락</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {item.icon && (
            <div className="flex-shrink-0 relative w-10 h-10">
              <Image src={item.icon} alt={item.name} fill sizes="40px" className="object-contain" unoptimized />
            </div>
          )}
          <div>
            {krName ? (
              <>
                <div className={clsx("font-bold text-sm leading-tight", getRarityTextClass(item.rarity))}>{krName}</div>
                <div className="text-gray-400 text-[11px]">({item.name})</div>
              </>
            ) : (
              <div className={clsx("font-bold text-sm leading-tight", getRarityTextClass(item.rarity))}>{item.name}</div>
            )}
            {item.baseType && item.baseType !== item.name && !krName && (
              <div className="text-gray-400 text-[11px]">{item.baseType}</div>
            )}
          </div>
        </div>
      </div>

      {/* 인챈트 */}
      {item.enchantMods && item.enchantMods.length > 0 && (
        <div className="mb-2">
          <div className="text-[9px] text-amber-600 uppercase mb-0.5">인챈트</div>
          {item.enchantMods.map((m, i) => <div key={i} className="text-amber-300">{m}</div>)}
        </div>
      )}

      {/* 암묵 */}
      {item.implicitMods && item.implicitMods.length > 0 && (
        <div className="mb-2">
          <div className="text-[9px] text-gray-500 uppercase mb-0.5">암묵 속성</div>
          {item.implicitMods.map((m, i) => <div key={i} className="text-gray-300">{m}</div>)}
        </div>
      )}

      {/* 명시 */}
      {item.explicitMods && item.explicitMods.length > 0 && (
        <div className="mb-2">
          <div className="text-[9px] text-gray-500 uppercase mb-0.5">명시 속성</div>
          {item.explicitMods.map((m, i) => <div key={i} className="text-blue-200">{m}</div>)}
        </div>
      )}

      {/* 거래소 버튼 (pointer-events 복구) */}
      <div className="mt-2 pt-2 border-t border-gray-700/50 pointer-events-auto">
        <TradeButton item={item} slotName={slotName} gameVersion={gameVersion} league={league}
          className="w-full justify-center py-1" />
      </div>
    </div>,
    document.body
  );
}

// ── SlotCard ───────────────────────────────────────────────────────────────
interface SlotCardProps {
  slotName: string;
  item: Item | null;
  compact?: boolean;
  lookupKr: KrLookup;
  gameVersion: "poe1" | "poe2";
  league: string;
}

function SlotCard({ slotName, item, compact = false, lookupKr, gameVersion, league }: SlotCardProps) {
  const slotKr = translateSlot(slotName);
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 빈 슬롯
  if (!item) {
    return (
      <div className={clsx(
        "px-2 py-2 rounded-lg border border-dashed border-gray-700 bg-gray-900/30",
        compact ? "min-h-[44px]" : "min-h-[56px]",
        "flex flex-col justify-center"
      )}>
        <div className="text-[10px] text-gray-600 text-center">{slotKr}</div>
      </div>
    );
  }

  const krName = lookupKr(item.name) ?? lookupKr(item.baseType ?? "") ??
    translateItemName(item.name) ?? translateItemName(item.baseType ?? "");

  return (
    <div
      ref={cardRef}
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={clsx(
        "px-2 py-2 rounded-lg border transition-all",
        compact ? "min-h-[44px]" : "min-h-[56px]",
        getSlotBg(item.rarity),
        getSlotBorderClass(item.rarity, hovered)
      )}>
        <div className="flex items-center gap-1.5">
          {item.icon && (
            <div className="flex-shrink-0 relative w-8 h-8">
              <Image src={item.icon} alt={item.name} fill sizes="32px" className="object-contain" unoptimized />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[9px] text-gray-500 mb-0.5">{slotKr}</div>
            {krName ? (
              <>
                <div className={clsx("text-[11px] font-semibold leading-tight truncate", getRarityTextClass(item.rarity))}>
                  {krName}
                </div>
                <div className="text-[9px] text-gray-500 truncate">({item.name})</div>
              </>
            ) : (
              <div className={clsx("text-[11px] font-semibold leading-tight truncate", getRarityTextClass(item.rarity))}>
                {item.name}
              </div>
            )}
          </div>
          {/* 카드 내 직접 거래소 버튼 */}
          {!compact && (
            <TradeButton item={item} slotName={slotName} gameVersion={gameVersion} league={league}
              className="flex-shrink-0 self-start mt-0.5" />
          )}
        </div>
        {/* compact 카드에도 거래소 버튼 */}
        {compact && (
          <div className="mt-1 flex justify-end">
            <TradeButton item={item} slotName={slotName} gameVersion={gameVersion} league={league} />
          </div>
        )}
      </div>

      {/* 호버 툴팁 */}
      {hovered && cardRef.current && (
        <ItemTooltip
          item={item}
          slotName={slotName}
          gameVersion={gameVersion}
          league={league}
          lookupKr={lookupKr}
          anchorEl={cardRef.current}
        />
      )}
    </div>
  );
}

// ── 레이아웃 상수 ──────────────────────────────────────────────────────────
const LEFT_COLUMN   = ["Weapon 1", "Ring 1", "Gloves"];
const CENTER_COLUMN = ["Helmet", "Body Armour", "Belt"];
const RIGHT_COLUMN  = ["Weapon 2", "Amulet", "Ring 2", "Boots"];
const FLASK_SLOTS   = ["Flask 1", "Flask 2", "Flask 3", "Flask 4", "Flask 5"];

// ── 메인 컴포넌트 ──────────────────────────────────────────────────────────
interface ItemDisplayProps { build: ParsedBuild; }

export default function ItemDisplay({ build }: ItemDisplayProps) {
  const { items, meta } = build;
  const { getTradeLeague } = useSeason();
  const [league, setLeague] = useState(getTradeLeague(meta.gameVersion));
  const [leagueList, setLeagueList] = useState<string[]>([]);
  const lookupKr = useKoreanNames(meta.gameVersion);

  useEffect(() => {
    fetchLeagues(meta.gameVersion).then(list => {
      if (list.length > 0) { setLeagueList(list); setLeague(list[0]); }
    });
  }, [meta.gameVersion]);

  const itemMap = new Map<string, Item>();
  for (const slot of items) {
    if (slot.item) itemMap.set(slot.slotName, slot.item);
  }

  if (items.filter(s => s.item).length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">장비 데이터가 없습니다.</p>
        <p className="text-gray-600 text-xs mt-1">PoB에 아이템을 장착한 경우에만 표시됩니다.</p>
      </div>
    );
  }

  const cardProps = { lookupKr, gameVersion: meta.gameVersion, league };

  return (
    <div className="space-y-3">
      {/* 리그 선택 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">리그:</span>
        {leagueList.length > 0 ? (
          <select
            value={league}
            onChange={e => setLeague(e.target.value)}
            className="text-xs bg-gray-800 border border-gray-600 rounded px-2 py-0.5 text-gray-200 focus:outline-none focus:border-amber-500"
          >
            {leagueList.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        ) : (
          <span className="text-xs text-gray-400">{league}</span>
        )}
      </div>

      {/* 3열 장비창 */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-2">
          {LEFT_COLUMN.map(s => (
            <SlotCard key={s} slotName={s} item={itemMap.get(s) ?? null} {...cardProps} />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {CENTER_COLUMN.map(s => (
            <SlotCard key={s} slotName={s} item={itemMap.get(s) ?? null} {...cardProps} />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {RIGHT_COLUMN.map(s => (
            <SlotCard key={s} slotName={s} item={itemMap.get(s) ?? null} {...cardProps} />
          ))}
        </div>
      </div>

      {/* 플라스크 */}
      <div className="flex gap-2">
        {FLASK_SLOTS.map(s => (
          <div key={s} className="flex-1">
            <SlotCard slotName={s} item={itemMap.get(s) ?? null} compact {...cardProps} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 스타일 헬퍼 ───────────────────────────────────────────────────────────
function getRarityTextClass(rarity: Item["rarity"]): string {
  switch (rarity) {
    case "Unique": return "text-red-400";
    case "Rare":   return "text-yellow-300";
    case "Magic":  return "text-blue-400";
    default:       return "text-white";
  }
}

function getRarityBadgeClass(rarity: Item["rarity"]): string {
  switch (rarity) {
    case "Unique": return "bg-red-900/60 text-red-300";
    case "Rare":   return "bg-yellow-900/60 text-yellow-300";
    case "Magic":  return "bg-blue-900/60 text-blue-300";
    default:       return "bg-gray-800 text-gray-300";
  }
}

function getSlotBorderClass(rarity: Item["rarity"], hovered: boolean): string {
  if (hovered) {
    switch (rarity) {
      case "Unique": return "border-red-400 ring-1 ring-red-400/30";
      case "Rare":   return "border-yellow-300 ring-1 ring-yellow-300/30";
      case "Magic":  return "border-blue-400 ring-1 ring-blue-400/30";
      default:       return "border-gray-300 ring-1 ring-gray-300/20";
    }
  }
  switch (rarity) {
    case "Unique": return "border-red-700/60 hover:border-red-500/80";
    case "Rare":   return "border-yellow-600/60 hover:border-yellow-400/80";
    case "Magic":  return "border-blue-700/60 hover:border-blue-500/80";
    default:       return "border-gray-600/60 hover:border-gray-400/80";
  }
}

function getSlotBg(rarity: Item["rarity"]): string {
  switch (rarity) {
    case "Unique": return "bg-red-950/30";
    case "Rare":   return "bg-yellow-950/20";
    case "Magic":  return "bg-blue-950/20";
    default:       return "bg-gray-800/50";
  }
}
