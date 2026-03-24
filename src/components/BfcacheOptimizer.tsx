"use client";

import { useEffect } from "react";

/**
 * bfcache(뒤로-앞으로 캐시) 최적화:
 * - pageshow 이벤트로 bfcache 복원 감지
 * - 복원 시 광고 슬롯 새로고침
 * - unload 이벤트 미사용 (bfcache 차단 방지)
 */
export default function BfcacheOptimizer() {
  useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        // bfcache에서 복원됨 — 광고 새로고침
        try {
          const ads = document.querySelectorAll(".adsbygoogle");
          ads.forEach((ad) => {
            if (!ad.getAttribute("data-adsbygoogle-status")) {
              (window.adsbygoogle = window.adsbygoogle || []).push({});
            }
          });
        } catch {
          // 광고 새로고침 실패 무시
        }
      }
    }

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return null;
}
