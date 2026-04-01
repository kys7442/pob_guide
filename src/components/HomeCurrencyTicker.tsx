"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import type { TickerItem } from "@/app/api/currency-rates/route";

interface MarketData {
  league: string;
  currencies: TickerItem[];
  uniqueItems: TickerItem[];
  scarabs: TickerItem[];
  leagueItems: TickerItem[];
  skillGems: TickerItem[];
}

const CLIENT_TTL = 10 * 60 * 1000;
let _cached: { data: MarketData; at: number } | null = null;

const TABS = [
  { key: "currencies",  label: "커런시" },
  { key: "uniqueItems", label: "고유 아이템" },
  { key: "scarabs",     label: "갑충석" },
  { key: "leagueItems", label: "리그 아이템" },
  { key: "skillGems",   label: "스킬 젬" },
] as const;

type TabKey = typeof TABS[number]["key"];

function formatChaos(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  if (value >= 100) return value.toFixed(0);
  return value.toFixed(1);
}

function formatDiv(value: number): string {
  if (value >= 100) return value.toFixed(0);
  if (value >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

function RankRow({ rank, item, divRate }: { rank: number; item: TickerItem; divRate: number | null }) {
  const divValue = divRate && divRate > 0 ? item.chaosValue / divRate : null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/60 transition-colors rounded-lg">
      <span className={`w-6 text-center text-xs font-bold flex-shrink-0 ${rank <= 3 ? "text-amber-400" : "text-gray-600"}`}>
        {rank}
      </span>
      <div className="w-8 h-8 flex-shrink-0 relative">
        {item.icon ? (
          <Image src={item.icon} alt={item.name} fill sizes="32px" className="object-contain" unoptimized />
        ) : (
          <div className="w-full h-full rounded bg-gray-700 flex items-center justify-center">
            <span className="text-[9px] text-gray-400">₡</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-200 truncate">{item.name}</p>
        {item.baseType && (
          <p className="text-[10px] text-gray-600 truncate">{item.baseType}</p>
        )}
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="text-right">
          <span className="text-xs text-gray-600 block mb-0.5">카오스</span>
          <span className="text-sm font-bold text-amber-400">
            {formatChaos(item.chaosValue)}
            <span className="text-[10px] text-gray-500 ml-0.5 font-normal">c</span>
          </span>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-600 block mb-0.5">디바인</span>
          {divValue !== null ? (
            <span className="text-sm font-bold text-sky-400">
              {formatDiv(divValue)}
              <span className="text-[10px] text-sky-600 ml-0.5 font-normal">div</span>
            </span>
          ) : (
            <span className="text-sm text-gray-700">-</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function HomeCurrencyTicker() {
  const [data, setData] = useState<MarketData | null>(_cached?.data ?? null);
  const [loading, setLoading] = useState(_cached === null);
  const [activeTab, setActiveTab] = useState<TabKey>("currencies");

  useEffect(() => {
    if (_cached && Date.now() - _cached.at < CLIENT_TTL) return;
    fetch("/api/currency-rates")
      .then(r => r.json())
      .then((d: MarketData) => {
        _cached = { data: d, at: Date.now() };
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const items: TickerItem[] = data ? (data[activeTab] ?? []) : [];
  const divRate: number | null =
    data?.currencies.find(c => c.name === "Divine Orb")?.chaosValue ?? null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-white">
            <span className="text-amber-400">PoE</span> 시세 현황
          </h2>
          {data && (
            <p className="text-xs text-gray-500 mt-0.5">
              {data.league} 리그
              {divRate && (
                <span className="ml-2 text-sky-500">1 div = {formatChaos(divRate)}c</span>
              )}
            </p>
          )}
        </div>
        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            로딩 중...
          </div>
        )}
      </div>

      <div className="flex bg-gray-900 border border-gray-700 rounded-xl overflow-hidden mb-4">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${activeTab === tab.key ? "bg-amber-600 text-black" : "text-gray-400 hover:text-gray-200 hover:bg-gray-800"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-800">
          <span className="w-6 text-center text-[10px] text-gray-600">#</span>
          <span className="w-8 flex-shrink-0" />
          <span className="flex-1 text-[10px] text-gray-600">아이템</span>
          <div className="flex gap-3 flex-shrink-0">
            <span className="w-14 text-right text-[10px] text-amber-600/70">카오스</span>
            <span className="w-14 text-right text-[10px] text-sky-600/70">디바인</span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-500 text-sm">데이터 불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-gray-500 text-sm">데이터가 없습니다</div>
        ) : (
          <div className="py-1">
            {items.map((item, i) => (
              <RankRow key={`${item.name}-${i}`} rank={i + 1} item={item} divRate={divRate} />
            ))}
          </div>
        )}

        <div className="px-4 py-2 border-t border-gray-800 text-[10px] text-gray-700 text-right">
          출처: poe.ninja · 10분 캐시
        </div>
      </div>
    </div>
  );
}
