import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "페이지를 찾을 수 없습니다 - PoE 빌드 가이드",
};

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mb-6">
        <span className="text-3xl font-black text-gray-600">404</span>
      </div>
      <h1 className="text-xl font-bold text-white mb-2">페이지를 찾을 수 없습니다</h1>
      <p className="text-sm text-gray-500 mb-6">
        요청하신 페이지가 존재하지 않거나 이동되었습니다.
      </p>
      <div className="flex gap-3">
        <a
          href="/"
          className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-black text-sm font-bold transition-colors"
        >
          시세 보기
        </a>
        <a
          href="/pob"
          className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
        >
          빌드 분석
        </a>
      </div>
    </div>
  );
}
