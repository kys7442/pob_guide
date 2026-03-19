import { NextRequest, NextResponse } from "next/server";

// 서버 메모리 캐시 (재시작 시 초기화)
const treeCache: Map<string, TreeCache> = new Map();

interface TreeCache {
  data: SimpleTreeData;
  fetchedAt: number;
}

export interface SimpleNode {
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

export interface SimpleTreeData {
  nodes: SimpleNode[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

// orbit 각도 계산 (PoE 공식 트리 좌표 계산 방식)
function calcOrbitAngle(orbit: number, orbitIndex: number, skillsPerOrbit: number[]): number {
  const count = skillsPerOrbit[orbit] ?? 12;
  // PoE는 북쪽(위)에서 시작해 시계방향 회전
  return (2 * Math.PI * orbitIndex) / count - Math.PI / 2;
}

// 공식 PoE 페이지에서 패시브 트리 JSON 추출
async function fetchOfficialTreeData(version: string): Promise<SimpleTreeData> {
  const cacheKey = version;
  const cached = treeCache.get(cacheKey);
  const CACHE_TTL = 24 * 60 * 60 * 1000; // 24시간

  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data;
  }

  // PoE1 전용 (공식 passive-skill-tree 페이지에서 추출)
  const url = "https://www.pathofexile.com/passive-skill-tree";
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; poe-build-guide/1.0)",
      "Accept": "text/html",
    },
    signal: AbortSignal.timeout(10000),
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    throw new Error(`공식 트리 페이지 로드 실패: HTTP ${res.status}`);
  }

  const html = await res.text();
  const marker = "passiveSkillTreeData = ";
  const idx = html.indexOf(marker);
  if (idx < 0) {
    throw new Error("페이지에서 passiveSkillTreeData를 찾을 수 없습니다");
  }

  // JSON 객체 범위 추출
  const start = idx + marker.length;
  let depth = 0;
  let end = start;
  for (let i = start; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") {
      depth--;
      if (depth === 0) { end = i + 1; break; }
    }
  }

  const rawData = JSON.parse(html.slice(start, end)) as {
    nodes: Record<string, {
      skill?: number;
      name?: string;
      group?: number;
      orbit?: number;
      orbitIndex?: number;
      isKeystone?: boolean;
      isNotable?: boolean;
      isMastery?: boolean;
      classStartIndex?: number;
      ascendancyName?: string;
      out?: (string | number)[];
    }>;
    groups: Record<string, { x: number; y: number }>;
    constants: { orbitRadii: number[]; skillsPerOrbit: number[] };
    min_x: number;
    max_x: number;
    min_y: number;
    max_y: number;
  };

  const { orbitRadii, skillsPerOrbit } = rawData.constants;
  const groups = rawData.groups;
  const nodes: SimpleNode[] = [];

  for (const [idStr, node] of Object.entries(rawData.nodes)) {
    if (idStr === "root") continue;

    const id = node.skill ?? parseInt(idStr, 10);
    if (isNaN(id)) continue;

    // 어센던시 노드 제외
    if (node.ascendancyName) continue;

    const name = node.name ?? "";
    const groupId = String(node.group ?? "");
    const orbit = node.orbit ?? 0;
    const orbitIndex = node.orbitIndex ?? 0;

    // 그룹 위치 + orbit 계산으로 x, y 결정
    let x = 0, y = 0;
    const group = groups[groupId];
    if (group) {
      const radius = orbitRadii[orbit] ?? 0;
      if (radius === 0) {
        x = group.x;
        y = group.y;
      } else {
        const angle = calcOrbitAngle(orbit, orbitIndex, skillsPerOrbit);
        x = group.x + radius * Math.cos(angle);
        y = group.y + radius * Math.sin(angle);
      }
    }

    const isStart = node.classStartIndex !== undefined && node.classStartIndex >= 0;

    nodes.push({
      id,
      name,
      x: Math.round(x),
      y: Math.round(y),
      isKeystone: Boolean(node.isKeystone),
      isNotable: Boolean(node.isNotable),
      isMastery: Boolean(node.isMastery),
      isStart,
      out: (node.out ?? []).map(v => Number(v)),
    });
  }

  const xs = nodes.filter(n => n.x !== 0 || n.y !== 0).map(n => n.x);
  const ys = nodes.filter(n => n.x !== 0 || n.y !== 0).map(n => n.y);

  const treeData: SimpleTreeData = {
    nodes,
    minX: xs.length ? Math.min(...xs) : rawData.min_x,
    maxX: xs.length ? Math.max(...xs) : rawData.max_x,
    minY: ys.length ? Math.min(...ys) : rawData.min_y,
    maxY: ys.length ? Math.max(...ys) : rawData.max_y,
  };

  treeCache.set(cacheKey, { data: treeData, fetchedAt: Date.now() });
  return treeData;
}

// GET /api/passive-tree?nodes=1,2,3&version=poe1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const version = searchParams.get("version") || "poe1";
  const nodesParam = searchParams.get("nodes") || "";

  // PoE2는 현재 미지원
  if (version === "poe2") {
    return NextResponse.json(
      { error: "PoE2 패시브 트리는 현재 지원하지 않습니다. pobb.in에서 확인해 주세요." },
      { status: 501 }
    );
  }

  const takenNodeIds = new Set(
    nodesParam.split(",").map(n => parseInt(n.trim(), 10)).filter(n => !isNaN(n))
  );

  try {
    const treeData = await fetchOfficialTreeData(version);

    // 취득 노드와 연결 노드만 반환
    const relevantIds = new Set<number>(takenNodeIds);
    const nodeMap = new Map(treeData.nodes.map(n => [n.id, n]));

    for (const id of takenNodeIds) {
      const node = nodeMap.get(id);
      if (node) {
        node.out.forEach(outId => relevantIds.add(outId));
      }
    }

    const relevantNodes = treeData.nodes.filter(n => relevantIds.has(n.id));

    // 연결선 (취득 노드 간만) - 중복 방지를 위해 Set 사용
    const connectionSet = new Set<string>();
    const connections: [number, number][] = [];
    for (const node of treeData.nodes) {
      if (!takenNodeIds.has(node.id)) continue;
      for (const outId of node.out) {
        if (takenNodeIds.has(outId)) {
          const key = `${Math.min(node.id, outId)}-${Math.max(node.id, outId)}`;
          if (!connectionSet.has(key)) {
            connectionSet.add(key);
            connections.push([node.id, outId]);
          }
        }
      }
    }

    return NextResponse.json({
      nodes: relevantNodes,
      connections,
      takenIds: Array.from(takenNodeIds),
      bounds: {
        minX: treeData.minX,
        maxX: treeData.maxX,
        minY: treeData.minY,
        maxY: treeData.maxY,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "트리 데이터 로드 실패" },
      { status: 502 }
    );
  }
}
