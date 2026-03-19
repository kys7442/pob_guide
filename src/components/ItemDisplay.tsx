"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import type { ParsedBuild, Item } from "@/lib/types";
import { translateSlot, translateRarity, translateItemName } from "@/lib/translations";
import { useSeason } from "@/lib/season-context";
import { fetchTradeStats, matchModToStatId } from "@/lib/trade-stats";
import { clsx } from "clsx";

// PoE 거래소 검색 URL 생성 (기본 — name/type만)
function buildBaseTradeUrl(item: Item, gameVersion: "poe1" | "poe2", league: string): string {
  const encodedLeague = encodeURIComponent(league);
  return gameVersion === "poe2"
    ? `https://www.pathofexile.com/trade2/search/poe2/${encodedLeague}`
    : `https://www.pathofexile.com/trade/search/${encodedLeague}`;
}

function buildTradeQuery(item: Item, statFilters?: Array<{ id: string; value: { min: number } }>): object {
  const query: Record<string, unknown> = {};

  if (item.rarity === "Unique" && item.name) {
    query.name = item.name;
  } else if (item.baseType) {
    query.type = item.baseType;
  }

  if (statFilters && statFilters.length > 0) {
    query.stats = [{ type: "and", filters: statFilters }];
  }

  return { query };
}

function getTradeUrl(item: Item, gameVersion: "poe1" | "poe2", league: string, statFilters?: Array<{ id: string; value: { min: number } }>): string {
  const baseUrl = buildBaseTradeUrl(item, gameVersion, league);
  const query = buildTradeQuery(item, statFilters);
  return `${baseUrl}?q=${encodeURIComponent(JSON.stringify(query))}`;
}

interface ItemDisplayProps {
  build: ParsedBuild;
}

// PoE 장비창 3열 구조 정의
// 왼쪽: 주무기, 반지1, 장갑
// 가운데: 투구, 몸통, 허리띠
// 오른쪽: 보조/방패, 목걸이, 반지2, 장화
const LEFT_COLUMN = ["Weapon 1", "Ring 1", "Gloves"];
const CENTER_COLUMN = ["Helmet", "Body Armour", "Belt"];
const RIGHT_COLUMN = ["Weapon 2", "Amulet", "Ring 2", "Boots"];
const FLASK_SLOTS = ["Flask 1", "Flask 2", "Flask 3", "Flask 4", "Flask 5"];

export default function ItemDisplay({ build }: ItemDisplayProps) {
  const { items, meta } = build;
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const { getTradeLeague } = useSeason();
  const tradeLeague = getTradeLeague(meta.gameVersion);

  // 슬롯 이름 → 아이템 맵
  const itemMap = new Map<string, Item>();
  for (const slot of items) {
    if (slot.item) itemMap.set(slot.slotName, slot.item);
  }

  const filledItems = items.filter((s) => s.item);
  const selectedItem = selectedSlot ? itemMap.get(selectedSlot) ?? null : null;

  if (filledItems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 text-sm">장비 데이터가 없습니다.</p>
        <p className="text-gray-600 text-xs mt-1">PoB에 아이템을 장착한 경우에만 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* PoE 장비창 3열 레이아웃 */}
      <div className="grid grid-cols-3 gap-2">
        {/* 왼쪽 열: 주무기(Weapon 1), 반지1(Ring 1), 장갑(Gloves) */}
        <div className="flex flex-col gap-2">
          {LEFT_COLUMN.map((slotName) => (
            <SlotCard
              key={slotName}
              slotName={slotName}
              item={itemMap.get(slotName) ?? null}
              isSelected={selectedSlot === slotName}
              onClick={() => setSelectedSlot(selectedSlot === slotName ? null : slotName)}
            />
          ))}
        </div>

        {/* 가운데 열: 투구(Helmet), 몸통(Body Armour), 허리띠(Belt) */}
        <div className="flex flex-col gap-2">
          {CENTER_COLUMN.map((slotName) => (
            <SlotCard
              key={slotName}
              slotName={slotName}
              item={itemMap.get(slotName) ?? null}
              isSelected={selectedSlot === slotName}
              onClick={() => setSelectedSlot(selectedSlot === slotName ? null : slotName)}
            />
          ))}
        </div>

        {/* 오른쪽 열: 보조/방패(Weapon 2), 목걸이(Amulet), 반지2(Ring 2), 장화(Boots) */}
        <div className="flex flex-col gap-2">
          {RIGHT_COLUMN.map((slotName) => (
            <SlotCard
              key={slotName}
              slotName={slotName}
              item={itemMap.get(slotName) ?? null}
              isSelected={selectedSlot === slotName}
              onClick={() => setSelectedSlot(selectedSlot === slotName ? null : slotName)}
            />
          ))}
        </div>
      </div>

      {/* 하단: 플라스크 5개 가로 나열 */}
      <div className="flex gap-2">
        {FLASK_SLOTS.map((slotName) => (
          <div key={slotName} className="flex-1">
            <SlotCard
              slotName={slotName}
              item={itemMap.get(slotName) ?? null}
              isSelected={selectedSlot === slotName}
              onClick={() => setSelectedSlot(selectedSlot === slotName ? null : slotName)}
              compact
            />
          </div>
        ))}
      </div>

      {/* 선택된 아이템 상세 */}
      {selectedItem && (
        <div className="border-t border-gray-700 pt-3">
          <ItemDetail item={selectedItem} slotName={selectedSlot || ""} gameVersion={meta.gameVersion} league={tradeLeague} />
        </div>
      )}

      {!selectedItem && (
        <p className="text-center text-xs text-gray-600 pt-1">
          아이템을 클릭하면 상세 정보가 표시됩니다
        </p>
      )}
    </div>
  );
}

interface SlotCardProps {
  slotName: string;
  item: Item | null;
  isSelected: boolean;
  onClick: () => void;
  compact?: boolean;
}

function SlotCard({ slotName, item, isSelected, onClick, compact = false }: SlotCardProps) {
  const slotKr = translateSlot(slotName);

  if (!item) {
    // 빈 슬롯: 회색 빈 슬롯 (슬롯 이름만 표시)
    return (
      <div
        className={clsx(
          "text-left px-2 py-2 rounded-lg border border-dashed border-gray-700 bg-gray-900/30",
          compact ? "min-h-[44px]" : "min-h-[56px]",
          "flex flex-col justify-center"
        )}
      >
        <div className="text-[10px] text-gray-600 text-center">{slotKr}</div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={clsx(
        "text-left px-2 py-2 rounded-lg border transition-all w-full",
        compact ? "min-h-[44px]" : "min-h-[56px]",
        getSlotBg(item.rarity),
        getSlotBorderClass(item.rarity, isSelected)
      )}
    >
      <div className="flex items-center gap-1.5">
        {/* 아이템 아이콘 */}
        {item.icon && (
          <div className="flex-shrink-0 relative w-8 h-8">
            <Image
              src={item.icon}
              alt={item.name}
              fill
              sizes="32px"
              className="object-contain"
              unoptimized
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          {/* 슬롯 이름 (한글) */}
          <div className="text-[9px] text-gray-500 mb-0.5">{slotKr}</div>
          {/* 아이템 이름 */}
          {(() => {
            const krName = translateItemName(item.name) ?? translateItemName(item.baseType ?? "");
            return krName ? (
              <>
                <div className={clsx("text-[11px] font-semibold leading-tight truncate", getRarityClass(item.rarity))}>
                  {krName}
                </div>
                <div className="text-[9px] text-gray-500 truncate mt-0.5">{item.name}</div>
              </>
            ) : (
              <div className={clsx("text-[11px] font-semibold leading-tight truncate", getRarityClass(item.rarity))}>
                {item.name}
              </div>
            );
          })()}
          {/* 베이스 타입 */}
          {!compact && item.baseType && item.baseType !== item.name && !translateItemName(item.name) && !translateItemName(item.baseType ?? "") && (
            <div className="text-[9px] text-gray-500 truncate mt-0.5">{item.baseType}</div>
          )}
        </div>
      </div>
    </button>
  );
}

function ItemDetail({ item, slotName, gameVersion, league }: { item: Item; slotName: string; gameVersion: "poe1" | "poe2"; league: string }) {
  const slotKr = translateSlot(slotName);
  const [tradeUrl, setTradeUrl] = useState(() => getTradeUrl(item, gameVersion, league));
  const [loadingStats, setLoadingStats] = useState(false);

  const handleTradeClick = useCallback(async (e: React.MouseEvent<HTMLAnchorElement>) => {
    // stat filters가 이미 적용된 경우 바로 열기
    if (tradeUrl.includes("stats")) return;

    e.preventDefault();
    setLoadingStats(true);

    try {
      const stats = await fetchTradeStats(gameVersion);
      if (stats.length > 0 && item.explicitMods && item.explicitMods.length > 0) {
        const statFilters: Array<{ id: string; value: { min: number } }> = [];
        for (const mod of item.explicitMods.slice(0, 6)) {
          const match = matchModToStatId(mod, stats);
          if (match) {
            statFilters.push({ id: match.id, value: { min: Math.floor(match.value * 0.8) } });
          }
        }
        const newUrl = getTradeUrl(item, gameVersion, league, statFilters.length > 0 ? statFilters : undefined);
        setTradeUrl(newUrl);
        window.open(newUrl, "_blank", "noopener,noreferrer");
        return;
      }
    } catch {
      // stat 매핑 실패 시 기본 URL로 폴백
    } finally {
      setLoadingStats(false);
    }

    window.open(tradeUrl, "_blank", "noopener,noreferrer");
  }, [item, gameVersion, league, tradeUrl]);

  return (
    <div className={clsx("rounded-lg border p-4", getItemBorderClass(item.rarity))}>
      {/* 헤더 */}
      <div className="mb-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className={clsx("text-[10px] px-1.5 py-0.5 rounded", getRarityBadgeClass(item.rarity))}>
              {translateRarity(item.rarity)}
            </span>
            <span className="text-[10px] text-gray-500">{slotKr}</span>
          </div>
          {/* 거래소 링크 */}
          <a
            href={tradeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleTradeClick}
            className="flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-gray-800 border border-gray-600 text-gray-300 hover:border-amber-500 hover:text-amber-400 transition-colors"
          >
            {loadingStats ? (
              <svg className="w-3 h-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" x2="21" y1="14" y2="3"/>
              </svg>
            )}
            거래소 검색
          </a>
        </div>

        {/* 아이콘 + 이름 */}
        <div className="flex items-center gap-3">
          {item.icon && (
            <div className="flex-shrink-0 relative w-12 h-12">
              <Image
                src={item.icon}
                alt={item.name}
                fill
                sizes="48px"
                className="object-contain"
                unoptimized
              />
            </div>
          )}
          <div>
            {(() => {
              const krName = translateItemName(item.name) ?? translateItemName(item.baseType ?? "");
              return krName ? (
                <>
                  <div className={clsx("font-bold text-base leading-tight", getRarityClass(item.rarity))}>
                    {krName}
                  </div>
                  <div className="text-gray-400 text-sm">{item.name}</div>
                </>
              ) : (
                <div className={clsx("font-bold text-base leading-tight", getRarityClass(item.rarity))}>
                  {item.name}
                </div>
              );
            })()}
            {item.baseType && item.baseType !== item.name && !translateItemName(item.name) && !translateItemName(item.baseType ?? "") && (
              <div className="text-gray-400 text-sm">{item.baseType}</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* 암묵 모드 */}
        {item.implicitMods && item.implicitMods.length > 0 && (
          <div>
            <div className="text-[10px] text-gray-600 uppercase mb-1">암묵 속성</div>
            <div className="space-y-0.5">
              {item.implicitMods.map((mod, i) => (
                <div key={i} className="text-xs text-gray-300">{mod}</div>
              ))}
            </div>
          </div>
        )}

        {/* 명시 모드 */}
        {item.explicitMods && item.explicitMods.length > 0 && (
          <div>
            <div className="text-[10px] text-gray-600 uppercase mb-1">명시 속성</div>
            <div className="space-y-0.5">
              {item.explicitMods.slice(0, 10).map((mod, i) => (
                <div key={i} className="text-xs text-blue-200">{mod}</div>
              ))}
              {item.explicitMods.length > 10 && (
                <div className="text-xs text-gray-600">+{item.explicitMods.length - 10}개 더...</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getRarityClass(rarity: Item["rarity"]): string {
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

function getSlotBorderClass(rarity: Item["rarity"], selected: boolean): string {
  if (selected) {
    switch (rarity) {
      case "Unique": return "border-red-500 ring-1 ring-red-500/40";
      case "Rare":   return "border-yellow-400 ring-1 ring-yellow-400/40";
      case "Magic":  return "border-blue-500 ring-1 ring-blue-500/40";
      default:       return "border-gray-400 ring-1 ring-gray-400/30";
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

function getItemBorderClass(rarity: Item["rarity"]): string {
  switch (rarity) {
    case "Unique": return "border border-red-700/60 bg-red-950/20";
    case "Rare":   return "border border-yellow-600/60 bg-yellow-950/20";
    case "Magic":  return "border border-blue-700/60 bg-blue-950/20";
    default:       return "border border-gray-600 bg-gray-800/50";
  }
}
