"use client";

import { useState, useEffect } from "react";
import type { GameVersion } from "./types";

// 클라이언트 캐시 (게임버전별)
const cache = new Map<string, { data: Record<string, string>; fetchedAt: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1시간

async function fetchKoreanNames(game: GameVersion): Promise<Record<string, string>> {
  const cached = cache.get(game);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data;
  }

  try {
    const res = await fetch(`/api/trade-items?game=${game}`);
    if (!res.ok) return {};
    const data = await res.json() as Record<string, string>;
    // 오류 응답 구분
    if (data && typeof data === "object" && !("error" in data)) {
      cache.set(game, { data, fetchedAt: Date.now() });
      return data;
    }
  } catch {
    // 네트워크 오류 — 조용히 실패
  }
  return {};
}

/**
 * 한국어 아이템명 맵을 가져오는 훅.
 * 반환 값: (englishName) => 한글명 | null
 */
export function useKoreanNames(game: GameVersion) {
  const [nameMap, setNameMap] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    fetchKoreanNames(game).then(map => {
      if (!cancelled) setNameMap(map);
    });
    return () => { cancelled = true; };
  }, [game]);

  return (englishName: string): string | null => {
    return nameMap[englishName] ?? null;
  };
}
