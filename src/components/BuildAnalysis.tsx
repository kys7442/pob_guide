"use client";

import { useState } from "react";
import type { ParsedBuild } from "@/lib/types";
import { Brain, ChevronDown, ChevronUp, Loader2, AlertCircle } from "lucide-react";

interface BuildAnalysisProps {
  build: ParsedBuild;
}

export default function BuildAnalysis({ build }: BuildAnalysisProps) {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);
  const [fetched, setFetched] = useState(false);

  async function fetchAnalysis() {
    if (fetched) {
      setOpen(!open);
      return;
    }

    setLoading(true);
    setError("");
    setOpen(true);

    try {
      const res = await fetch("/api/analyze-build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ build }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "분석 실패");
      } else {
        setAnalysis(data.analysis);
        setFetched(true);
      }
    } catch {
      setError("서버 연결 오류");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl overflow-hidden">
      {/* 헤더 버튼 */}
      <button
        onClick={fetchAnalysis}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          <span className="font-semibold text-white">AI 빌드 분석 보고서</span>
          <span className="text-xs px-2 py-0.5 rounded bg-purple-900/50 border border-purple-700 text-purple-300">
            AI
          </span>
        </div>
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />}
          {!loading && (
            open
              ? <ChevronUp className="w-4 h-4 text-gray-400" />
              : <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* 내용 */}
      {open && (
        <div className="border-t border-gray-700 px-5 py-4">
          {loading && (
            <div className="flex items-center gap-3 py-4">
              <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
              <p className="text-gray-400 text-sm">빌드를 분석하고 있습니다...</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 py-2">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {analysis && !loading && (
            <div className="prose prose-invert prose-sm max-w-none">
              <MarkdownRenderer content={analysis} />
            </div>
          )}

          {!loading && !error && !analysis && (
            <p className="text-gray-500 text-sm py-2">분석 중...</p>
          )}
        </div>
      )}
    </div>
  );
}

// 간단한 마크다운 렌더러
function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  lines.forEach((line, idx) => {
    if (line.startsWith("### ")) {
      elements.push(
        <h3 key={idx} className="text-amber-400 font-bold text-sm mt-4 mb-2 uppercase tracking-wide">
          {line.replace("### ", "")}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      elements.push(
        <h2 key={idx} className="text-amber-300 font-bold text-base mt-5 mb-2">
          {line.replace("## ", "")}
        </h2>
      );
    } else if (line.startsWith("**") && line.endsWith("**")) {
      const text = line.replace(/\*\*/g, "");
      elements.push(
        <p key={idx} className="font-bold text-white text-sm">{text}</p>
      );
    } else if (line.match(/^\*\*.+\*\*:/)) {
      // **라벨**: 내용
      const match = line.match(/^\*\*(.+?)\*\*:(.*)/);
      if (match) {
        elements.push(
          <div key={idx} className="flex gap-2 text-sm my-1">
            <span className="font-bold text-gray-200 flex-shrink-0">{match[1]}:</span>
            <span className="text-gray-400">{match[2].trim()}</span>
          </div>
        );
      }
    } else if (line.match(/^\d+\.\s/)) {
      // 번호 목록
      const match = line.match(/^(\d+)\.\s(.+)/);
      if (match) {
        const itemContent = match[2];
        const boldMatch = itemContent.match(/^\*\*(.+?)\*\*:(.*)/);
        elements.push(
          <div key={idx} className="flex gap-2 text-sm my-1 ml-2">
            <span className="text-amber-600 font-mono flex-shrink-0">{match[1]}.</span>
            {boldMatch ? (
              <span className="text-gray-300">
                <strong className="text-gray-100">{boldMatch[1]}</strong>:{boldMatch[2]}
              </span>
            ) : (
              <span className="text-gray-300" dangerouslySetInnerHTML={{
                __html: itemContent.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
              }} />
            )}
          </div>
        );
      }
    } else if (line.startsWith("- ")) {
      elements.push(
        <div key={idx} className="flex gap-2 text-sm my-1 ml-2">
          <span className="text-amber-600 flex-shrink-0">▸</span>
          <span className="text-gray-300" dangerouslySetInnerHTML={{
            __html: line.replace("- ", "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          }} />
        </div>
      );
    } else if (line.startsWith("---")) {
      elements.push(<hr key={idx} className="border-gray-700 my-3" />);
    } else if (line.startsWith("*") && line.endsWith("*")) {
      elements.push(
        <p key={idx} className="text-gray-600 text-xs italic mt-2">{line.replace(/\*/g, "")}</p>
      );
    } else if (line.trim()) {
      elements.push(
        <p key={idx} className="text-gray-300 text-sm my-1" dangerouslySetInnerHTML={{
          __html: line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        }} />
      );
    }
  });

  return <div className="space-y-0.5">{elements}</div>;
}
