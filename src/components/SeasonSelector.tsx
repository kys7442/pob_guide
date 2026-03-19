"use client";

import { useState } from "react";
import { CalendarDays, ChevronDown } from "lucide-react";
import { useSeason } from "@/lib/season-context";

export default function SeasonSelector() {
  const { poe1Season, poe2Season, seasons, setPoe1Season, setPoe2Season } = useSeason();
  const [open, setOpen] = useState(false);

  if (!seasons) return null;

  const currentPoe1 = seasons.poe1.find(s => s.id === poe1Season);
  const currentPoe2 = seasons.poe2.find(s => s.id === poe2Season);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors px-2 py-1 rounded border border-gray-700 hover:border-gray-500"
      >
        <CalendarDays className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">
          시즌 {currentPoe1?.version ?? currentPoe2?.version ?? ""}
        </span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <>
          {/* 오버레이 */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          {/* 드롭다운 */}
          <div className="absolute right-0 top-full mt-1 z-50 bg-gray-900 border border-gray-700 rounded-lg shadow-xl p-3 w-64">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-2">시즌 선택 (거래소 리그)</p>

            {/* PoE 1 */}
            <div className="mb-3">
              <p className="text-[10px] text-amber-400 mb-1">Path of Exile 1</p>
              <div className="space-y-1">
                {seasons.poe1.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setPoe1Season(s.id); setOpen(false); }}
                    className={`w-full text-left flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors ${
                      poe1Season === s.id
                        ? "bg-amber-900/40 text-amber-300 border border-amber-700"
                        : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] text-gray-600">{s.version}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* PoE 2 */}
            <div>
              <p className="text-[10px] text-purple-400 mb-1">Path of Exile 2</p>
              <div className="space-y-1">
                {seasons.poe2.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setPoe2Season(s.id); setOpen(false); }}
                    className={`w-full text-left flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors ${
                      poe2Season === s.id
                        ? "bg-purple-900/40 text-purple-300 border border-purple-700"
                        : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] text-gray-600">{s.version}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[9px] text-gray-600 mt-2 pt-2 border-t border-gray-800">
              선택한 시즌이 거래소 검색 리그에 적용됩니다
            </p>
          </div>
        </>
      )}
    </div>
  );
}
