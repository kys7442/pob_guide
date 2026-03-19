"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export interface Season {
  id: string;
  name: string;
  version: string;
  current?: boolean;
  tradeLeague?: string; // 거래소 리그명 (URL용)
}

interface SeasonData {
  poe1: Season[];
  poe2: Season[];
}

interface SeasonContextType {
  poe1Season: string;   // 현재 선택된 PoE 1 시즌 ID
  poe2Season: string;   // 현재 선택된 PoE 2 시즌 ID
  seasons: SeasonData | null;
  getTradeLeague: (gameVersion: "poe1" | "poe2") => string;
  setPoe1Season: (id: string) => void;
  setPoe2Season: (id: string) => void;
}

const SeasonContext = createContext<SeasonContextType>({
  poe1Season: "poe1-3.28",
  poe2Season: "poe2-dawn",
  seasons: null,
  getTradeLeague: () => "Standard",
  setPoe1Season: () => {},
  setPoe2Season: () => {},
});

// 시즌 ID → 거래소 리그명 매핑
const TRADE_LEAGUE_MAP: Record<string, string> = {
  "poe1-3.28":       "Standard",
  "poe1-3.27":       "Standard",
  "poe1-3.26":       "Standard",
  "poe1-settlers":   "Settlers",
  "poe1-necropolis": "Necropolis",
  "poe1-affliction": "Affliction",
  "poe1-standard":   "Standard",
  "poe2-dawn":       "Dawn of the Hunt",
  "poe2-standard":   "Standard",
};

export function SeasonProvider({ children }: { children: ReactNode }) {
  const [poe1Season, setPoe1SeasonState] = useState("poe1-3.28");
  const [poe2Season, setPoe2SeasonState] = useState("poe2-dawn");
  const [seasons, setSeasons] = useState<SeasonData | null>(null);

  // 저장된 시즌 복원
  useEffect(() => {
    const s1 = localStorage.getItem("poe-season-poe1");
    const s2 = localStorage.getItem("poe-season-poe2");
    if (s1) setPoe1SeasonState(s1);
    if (s2) setPoe2SeasonState(s2);
  }, []);

  // 시즌 목록 로드
  useEffect(() => {
    fetch("/data/seasons.json")
      .then(r => r.json())
      .then((data: SeasonData) => setSeasons(data))
      .catch(() => {});
  }, []);

  function setPoe1Season(id: string) {
    setPoe1SeasonState(id);
    localStorage.setItem("poe-season-poe1", id);
  }

  function setPoe2Season(id: string) {
    setPoe2SeasonState(id);
    localStorage.setItem("poe-season-poe2", id);
  }

  function getTradeLeague(gameVersion: "poe1" | "poe2"): string {
    const seasonId = gameVersion === "poe1" ? poe1Season : poe2Season;
    return TRADE_LEAGUE_MAP[seasonId] || "Standard";
  }

  return (
    <SeasonContext.Provider value={{ poe1Season, poe2Season, seasons, getTradeLeague, setPoe1Season, setPoe2Season }}>
      {children}
    </SeasonContext.Provider>
  );
}

export function useSeason() {
  return useContext(SeasonContext);
}
