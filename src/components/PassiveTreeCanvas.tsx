"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ExternalLink, ZoomIn, ZoomOut, Maximize2, Loader2 } from "lucide-react";
import { translateKeystone } from "@/lib/translations";

interface TreeNode {
  id: number;
  name: string;
  x: number;
  y: number;
  isKeystone: boolean;
  isNotable: boolean;
  isMastery: boolean;
  isStart: boolean;
  out: number[];
}

interface TreeData {
  nodes: TreeNode[];
  connections: [number, number][];
  takenIds: number[];
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  error?: string;
}

interface PassiveTreeCanvasProps {
  nodeIds: number[];
  gameVersion: "poe1" | "poe2";
  totalNodes: number;
  pobCode?: string;
}

export default function PassiveTreeCanvas({ nodeIds, gameVersion, totalNodes, pobCode }: PassiveTreeCanvasProps) {
  const pobbInId = pobCode?.match(/pobb\.in\/([A-Za-z0-9_-]+)/)?.[1];
  const pobbInUrl = pobbInId ? `https://pobb.in/${pobbInId}` : null;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [treeData, setTreeData] = useState<TreeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<TreeNode | null>(null);

  // 트리 데이터 로드
  useEffect(() => {
    if (nodeIds.length === 0) return;

    setLoading(true);
    setError("");

    const nodesParam = nodeIds.slice(0, 2000).join(","); // 최대 2000개
    fetch(`/api/passive-tree?nodes=${nodesParam}&version=${gameVersion}`)
      .then(r => r.json())
      .then((data: TreeData) => {
        if (data.error) {
          setError(data.error);
        } else {
          setTreeData(data);
          // 초기 위치: 취득 노드 중심으로
          fitToNodes(data);
        }
      })
      .catch(() => setError("트리 데이터를 불러오지 못했습니다."))
      .finally(() => setLoading(false));
  }, [nodeIds, gameVersion]);

  const fitToNodes = useCallback((data: TreeData) => {
    if (!containerRef.current || data.nodes.length === 0) return;
    const takenSet = new Set(data.takenIds);
    const takenNodes = data.nodes.filter(n => takenSet.has(n.id) && (n.x !== 0 || n.y !== 0));
    if (takenNodes.length === 0) return;

    const xs = takenNodes.map(n => n.x);
    const ys = takenNodes.map(n => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const { width, height } = containerRef.current.getBoundingClientRect();
    const padding = 40;
    const scaleX = (width - padding * 2) / (maxX - minX || 1);
    const scaleY = (height - padding * 2) / (maxY - minY || 1);
    const newZoom = Math.min(scaleX, scaleY, 2);

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    setZoom(newZoom);
    setOffset({
      x: width / 2 - cx * newZoom,
      y: height / 2 - cy * newZoom,
    });
  }, []);

  // 캔버스 렌더링
  useEffect(() => {
    if (!treeData || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const takenSet = new Set(treeData.takenIds);
    const nodeMap = new Map(treeData.nodes.map(n => [n.id, n]));

    // 변환 함수
    const tx = (x: number) => x * zoom + offset.x;
    const ty = (y: number) => y * zoom + offset.y;

    // 배경
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 연결선 그리기
    for (const [id1, id2] of treeData.connections) {
      const n1 = nodeMap.get(id1);
      const n2 = nodeMap.get(id2);
      if (!n1 || !n2) continue;
      if (n1.x === 0 && n1.y === 0) continue;
      if (n2.x === 0 && n2.y === 0) continue;

      const both = takenSet.has(id1) && takenSet.has(id2);
      if (both) {
        // 취득 노드 간 연결선 - 밝고 뚜렷하게
        ctx.strokeStyle = "rgba(220,180,60,0.85)";
        ctx.lineWidth = Math.max(1.5, 2 * zoom);
        ctx.shadowColor = "rgba(220,180,60,0.4)";
        ctx.shadowBlur = 3;
      } else {
        // 미취득 연결선
        ctx.strokeStyle = "rgba(80,80,80,0.25)";
        ctx.lineWidth = 0.5;
        ctx.shadowBlur = 0;
      }

      ctx.beginPath();
      ctx.moveTo(tx(n1.x), ty(n1.y));
      ctx.lineTo(tx(n2.x), ty(n2.y));
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    // 노드 그리기
    for (const node of treeData.nodes) {
      const taken = takenSet.has(node.id);
      const x = tx(node.x);
      const y = ty(node.y);

      // 화면 밖 노드 스킵
      if (x < -10 || x > canvas.width + 10 || y < -10 || y > canvas.height + 10) continue;

      let radius = 3;
      let fillColor = taken ? "#c8a84b" : "#2a2a2a";
      let strokeColor = taken ? "#ffd700" : "#444";

      if (node.isKeystone) {
        radius = taken ? 8 : 5;
        fillColor = taken ? "#ff8c00" : "#1a1a1a";
        strokeColor = taken ? "#ffaa00" : "#555";
      } else if (node.isNotable) {
        radius = taken ? 5 : 3;
        fillColor = taken ? "#d4a017" : "#222";
        strokeColor = taken ? "#ffd700" : "#444";
      } else if (node.isStart) {
        radius = 6;
        fillColor = "#1a3a5c";
        strokeColor = "#4a8aac";
      }

      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = taken ? 1.5 : 0.8;
      ctx.stroke();

      // 키스톤 이름 표시 (취득한 것만, 줌 충분할 때)
      if (node.isKeystone && taken && zoom > 0.3) {
        const krName = translateKeystone(node.name);
        ctx.fillStyle = "#ffd700";
        ctx.font = `${Math.max(8, 10 * zoom)}px 'Noto Sans KR', sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(krName || node.name, x, y + radius + 10);
      }
    }
  }, [treeData, zoom, offset]);

  // 마우스 이벤트
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const factor = e.deltaY > 0 ? 0.85 : 1.18;
    const newZoom = Math.max(0.05, Math.min(8, zoom * factor));

    setOffset(prev => ({
      x: mouseX - (mouseX - prev.x) * (newZoom / zoom),
      y: mouseY - (mouseY - prev.y) * (newZoom / zoom),
    }));
    setZoom(newZoom);
  }, [zoom]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  }, [offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (dragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    // 호버 노드 감지
    if (treeData && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const found = treeData.nodes.find(n => {
        const nx = n.x * zoom + offset.x;
        const ny = n.y * zoom + offset.y;
        const r = n.isKeystone ? 8 : 5;
        return Math.sqrt((mx - nx) ** 2 + (my - ny) ** 2) < r + 3;
      });
      setHoveredNode(found || null);
    }
  }, [dragging, dragStart, treeData, zoom, offset]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  if (nodeIds.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600 text-sm">
        패시브 트리 노드 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* 컨트롤 바 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">취득 노드: <strong className="text-white">{totalNodes}</strong></span>
          {!error && (
            <>
              <button
                onClick={() => setZoom(z => Math.min(8, z * 1.3))}
                className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                title="확대"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoom(z => Math.max(0.05, z * 0.77))}
                className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                title="축소"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => treeData && fitToNodes(treeData)}
                className="p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                title="맞춤 보기"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {pobbInUrl && (
            <a
              href={pobbInUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-300 transition-colors font-medium"
            >
              <ExternalLink className="w-3 h-3" /> pobb.in에서 전체 보기
            </a>
          )}
          <a
            href="https://www.pathofexile.com/passive-skill-tree"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-amber-400 transition-colors"
          >
            <ExternalLink className="w-3 h-3" /> 공식 트리
          </a>
        </div>
      </div>

      {/* 캔버스 영역 */}
      <div
        ref={containerRef}
        className="relative bg-gray-950 border border-gray-700 rounded-lg overflow-hidden"
        style={{ height: "420px" }}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80 z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-sm text-gray-400">패시브 트리 로딩 중...</p>
            </div>
          </div>
        )}

        {error && !loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center p-4">
            <p className="text-sm text-gray-400">트리 시각화 데이터를 불러오지 못했습니다.</p>
            <p className="text-xs text-gray-600">{error}</p>
            {pobbInUrl && (
              <div className="bg-gray-800/60 border border-amber-800/40 rounded-lg px-4 py-3 max-w-sm">
                <p className="text-xs text-amber-400 mb-2 font-medium">pobb.in에서 이 빌드의 전체 패시브 트리를 볼 수 있습니다</p>
                <a
                  href={pobbInUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded bg-amber-700 hover:bg-amber-600 text-black font-bold transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> pobb.in에서 패시브 트리 보기
                </a>
              </div>
            )}
            <div className="flex gap-2 mt-1">
              <a
                href="https://www.pathofexile.com/passive-skill-tree"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-gray-800 border border-gray-700 text-gray-300 hover:text-gray-200 transition-colors"
              >
                <ExternalLink className="w-3 h-3" /> 공식 패시브 트리
              </a>
              {!pobbInUrl && (
                <a
                  href="https://pobb.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded bg-gray-800 border border-gray-700 text-gray-300 hover:text-gray-200 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> pobb.in
                </a>
              )}
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className={`w-full h-full ${dragging ? "cursor-grabbing" : "cursor-grab"}`}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        )}

        {/* 호버 툴팁 */}
        {hoveredNode && (
          <div className="absolute bottom-3 left-3 bg-gray-900 border border-gray-600 rounded px-3 py-2 pointer-events-none">
            <div className="text-amber-300 text-xs font-semibold">
              {translateKeystone(hoveredNode.name) || hoveredNode.name}
            </div>
            {hoveredNode.isKeystone && <div className="text-yellow-600 text-[10px]">키스톤</div>}
            {hoveredNode.isNotable && <div className="text-orange-600 text-[10px]">주목할 노드</div>}
          </div>
        )}

        {/* 범례 */}
        {!loading && !error && treeData && (
          <div className="absolute top-2 right-2 bg-gray-900/80 rounded p-2 text-[10px] space-y-1">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-amber-400 border border-yellow-500" />
              <span className="text-gray-400">취득 노드</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-orange-500 border border-yellow-400" />
              <span className="text-gray-400">키스톤</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-gray-700 border border-gray-500 mx-0.5" />
              <span className="text-gray-400">미취득</span>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-600 text-center">
        {error
          ? "※ 브라우저 보안 설정에 따라 표시가 제한될 수 있습니다"
          : "마우스 휠: 확대/축소 | 드래그: 이동"}
      </p>
    </div>
  );
}
