"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import type { TickerItem } from "@/app/api/currency-rates/route";

interface TickerData {
  league: string;
  currencies: TickerItem[];
  belts: TickerItem[];
  top10: TickerItem[];
}

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

function TickerCard({ item, divRate }: { item: TickerItem; divRate: number | null }) {
  const divValue = divRate && divRate > 0 ? item.chaosValue / divRate : null;
  const showDiv = divValue !== null && divValue >= 1;

  return (
    <div className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/80 border border-gray-700/60 mx-1.5 min-w-[140px]">
      {item.icon ? (
        <div className="relative w-7 h-7 flex-shrink-0">
          <Image src={item.icon} alt={item.name} fill sizes="28px" className="object-contain" unoptimized />
        </div>
      ) : (
        <div className="w-7 h-7 flex-shrink-0 rounded bg-gray-700 flex items-center justify-center">
          <span className="text-[9px] text-gray-400">₡</span>
        </div>
      )}
      <div className="min-w-0">
        <div className="text-[10px] text-gray-300 truncate leading-tight max-w-[90px]">{item.name}</div>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-[13px] font-bold text-amber-400 leading-tight">
            {formatChaos(item.chaosValue)}
            <span className="text-[9px] text-gray-500 ml-0.5 font-normal">c</span>
          </span>
          {showDiv && (
            <span className="text-[11px] font-semibold text-sky-400 leading-tight">
              {formatDiv(divValue!)}
              <span className="text-[9px] text-sky-600 ml-0.5 font-normal">div</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function MarqueeRow({ items, label, speed = 40, divRate }: { items: TickerItem[]; label: string; speed?: number; divRate: number | null }) {
  if (!items || items.length === 0) return null;
  const repeated = [...items, ...items, ...items];
  const duration = (items.length * speed).toFixed(0);

  return (
    <div className="flex items-center gap-2 overflow-hidden">
      <span className="flex-shrink-0 text-[10px] font-semibold text-amber-500 w-[60px] text-right pr-2 border-r border-gray-700">{label}</span>
      <div className="flex-1 overflow-hidden relative">
        <div
          className="flex"
          style={{ animation: `marquee ${duration}s linear infinite`, width: "max-content" }}
        >
          {repeated.map((item, i) => (
            <TickerCard key={`${item.name}-${i}`} item={item} divRate={divRate} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CurrencyTicker() {
  const [data, setData] = useState<TickerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/currency-rates?section=ticker")
      .then(r => r.json())
      .then((d: TickerData) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="text-xs text-gray-500">시세 로딩 중...</span>
      </div>
    );
  }

  if (!data) return null;

  // Divine Orb의 카오스 가치 추출 (한글명 "신성한 오브" or 영문 "Divine Orb")
  const divineItem = data.currencies.find(c =>
    c.name === "Divine Orb" || c.name === "신성한 오브"
  );
  const divRate = divineItem?.chaosValue ?? null;

  return (
    <div className="space-y-2">
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.3333%); }
        }
      `}</style>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2 h-2 rounded-full bg-amber-500" />
        <span className="text-[11px] text-amber-400 font-semibold">poe.ninja 시세</span>
        <span className="text-[10px] text-gray-600">{data.league} 리그</span>
        {divRate && (
          <span className="text-[10px] text-gray-600 ml-auto">
            1 div = <span className="text-sky-500">{formatChaos(divRate)}c</span>
          </span>
        )}
      </div>
      <MarqueeRow items={data.currencies} label="화폐" speed={15} divRate={divRate} />
      <MarqueeRow items={data.belts} label="고유 허리띠" speed={18} divRate={divRate} />
      <MarqueeRow items={data.top10} label="TOP10" speed={20} divRate={divRate} />
    </div>
  );
}
