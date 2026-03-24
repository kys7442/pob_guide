import { NextRequest, NextResponse } from "next/server";
import type { ParsedBuild } from "@/lib/types";
import { CLASS_KR, ASCENDANCY_KR, translateSkillGem } from "@/lib/translations";

// 빌드 요약 텍스트 생성 (AI 프롬프트용)
function buildSummaryText(build: ParsedBuild): string {
  const { character, stats, skills, items, passives, meta } = build;

  const className = CLASS_KR[character.className] || character.className;
  const ascendName = ASCENDANCY_KR[character.ascendClassName] || character.ascendClassName;
  const mainSkillKr = character.mainSkill
    ? translateSkillGem(character.mainSkill, meta.gameVersion)
    : "알 수 없음";

  const lifeVal = stats.find(s => s.stat === "TotalLife" || s.stat === "Life")?.value || 0;
  const dpsVal = stats.find(s => s.stat === "TotalDPS" || s.stat === "CombinedDPS")?.value || 0;
  const fireRes = stats.find(s => s.stat === "FireResist")?.value || 0;
  const coldRes = stats.find(s => s.stat === "ColdResist")?.value || 0;
  const lightRes = stats.find(s => s.stat === "LightningResist")?.value || 0;

  const mainSkillSlot = skills.find(s => s.isMainSkill) || skills[0];
  const gemNames = mainSkillSlot
    ? mainSkillSlot.gems.map(g => g.name).join(", ")
    : "정보 없음";

  const equippedItems = items.filter(s => s.item).map(s => {
    const item = s.item!;
    return `${s.slotName}: ${item.name}(${item.rarity})`;
  }).join(", ");

  return `
게임: Path of Exile ${meta.gameVersion === "poe2" ? "2" : "1"}
클래스: ${className} / 어센던시: ${ascendName}
레벨: ${character.level}
메인 스킬: ${mainSkillKr} (${character.mainSkill})
메인 스킬 젬 구성: ${gemNames}
생명력: ${lifeVal.toFixed(0)}
DPS: ${dpsVal > 0 ? dpsVal.toFixed(0) : "정보 없음"}
저항 (화/냉/번): ${fireRes}/${coldRes}/${lightRes}
패시브 노드 수: ${passives.totalNodes}
키스톤: ${passives.keystones.join(", ") || "없음"}
장비: ${equippedItems || "정보 없음"}
`.trim();
}

// Google Gemini API 호출 (무료 tier)
async function analyzeWithGemini(buildSummary: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY 환경변수가 설정되지 않았습니다.");
  }

  const prompt = `
당신은 Path of Exile 전문가입니다. 아래 빌드 정보를 분석하여 한국어로 간결한 빌드 분석 보고서를 작성해주세요.
스킬명, 어센던시명, 아이템명 등 영문 고유명사는 반드시 한글 설명 옆에 영문명을 병기하세요. 예: "사이클론 (Cyclone)", "저거넛 (Juggernaut)"

## 빌드 정보
${buildSummary}

## 분석 보고서 형식 (반드시 이 형식으로 작성)

### 빌드 평가
(이 빌드의 전반적인 특성과 강점/약점을 2-3문장으로 설명)

### 추천도 평가
**전체 추천도**: ★★★☆☆ (5점 만점으로 평가하여 별 아이콘으로 표시)
**리그 스타터 적합도**: ★★★☆☆ (일반 아이템으로도 진행 가능한지 평가)
**보스 킬러 적합도**: ★★★☆☆ (보스 처치 특화 여부 평가)
**파밍 효율**: ★★★☆☆ (지도 파밍 및 아이템 수급 효율 평가)

### 난이도
**조작 난이도**: ★★☆☆☆ (실제 플레이 조작의 복잡도, 예: 쉬움~매우 어려움)
**빌드 이해 난이도**: ★★★☆☆ (메커니즘 이해의 복잡도)
**아이템 수급 난이도**: ★★☆☆☆ (필요 아이템 구하기 어려움 정도)

### 난이도별 평가
**초보자**: (이 빌드가 초보자에게 어떤지, 조작 난이도와 진입장벽을 설명)
**중급자**: (이 빌드가 중급자에게 어떤지, 최적화 포인트 설명)
**고급자**: (이 빌드가 고급자에게 어떤지, 엔드게임 가능성 설명)

### 예산 추정
**최소 예산** (리그 진행 가능): (대략적인 게임 내 화폐 수량)
**중간 예산** (편안한 맵 파밍): (대략적인 게임 내 화폐 수량)
**풀세팅 예산** (최상위 콘텐츠): (대략적인 게임 내 화폐 수량)

### 핵심 메커니즘
(이 빌드의 핵심 작동 방식을 번호 목록으로 3-5개 설명)

### 플레이 팁
(초보자가 이 빌드를 쉽게 이해하고 따라할 수 있는 실용적인 팁 2-3개)
`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API 오류: ${response.status} - ${err.substring(0, 100)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini 응답이 비어있습니다.");
  return text;
}

// 별점 문자열 생성 (예: 3 → "★★★☆☆")
function starRating(score: number): string {
  const maxStars = 5;
  const filled = Math.max(0, Math.min(maxStars, Math.round(score)));
  return "★".repeat(filled) + "☆".repeat(maxStars - filled);
}

// 메인 스킬 기반 조작 난이도 추정 (1~5, 낮을수록 쉬움)
function estimateOperationDifficulty(mainSkill: string): { score: number; label: string } {
  const skill = mainSkill.toLowerCase().replace(/\s/g, "");
  if (["flickerstrike"].includes(skill)) return { score: 5, label: "매우 어려움" };
  if (["bladevortex", "bladeflurry", "scougearrow", "scouragearrow"].includes(skill)) return { score: 4, label: "어려움" };
  if (["arc", "ballightning", "spark", "stormbrand", "essencedrain"].includes(skill)) return { score: 3, label: "보통" };
  if (["cyclone", "boneshatter", "earthquake", "raisespectre", "raisezombie", "summonskeletons"].includes(skill)) return { score: 2, label: "쉬움" };
  if (["righteousfire", "blazeofcalamity"].includes(skill)) return { score: 1, label: "매우 쉬움" };
  return { score: 3, label: "보통" };
}

// 어센던시별 리그 스타터 적합도 추정 (1~5)
function estimateLeagueStarterScore(ascendancy: string): number {
  const a = ascendancy.toLowerCase();
  // 저거넛 (Juggernaut), 개척자 (Pathfinder), 죽음의 맹세 (Death's Oath 류) 등 높음
  if (["juggernaut", "저거넛", "pathfinder", "개척자"].some(k => a.includes(k))) return 5;
  if (["chieftain", "족장", "champion", "챔피언", "occultist", "강령술사"].some(k => a.includes(k))) return 4;
  if (["raider", "약탈자", "elementalist", "원소술사", "inquisitor", "심문관"].some(k => a.includes(k))) return 3;
  if (["assassin", "암살자", "saboteur", "사보타주"].some(k => a.includes(k))) return 3;
  if (["trickster", "속임수꾼", "ascendant", "승천자"].some(k => a.includes(k))) return 3;
  return 3;
}

// 빌드 완성도에 따른 보스 킬러 적합도 (1~5)
function estimateBossKillerScore(dpsVal: number, lifeOk: boolean, resOk: boolean): number {
  let score = 1;
  if (dpsVal >= 1000000) score += 2;
  else if (dpsVal >= 300000) score += 1;
  if (lifeOk) score += 1;
  if (resOk) score += 1;
  return Math.min(5, score);
}

// 규칙 기반 폴백 분석 (API 키 없을 때)
function ruleBasedAnalysis(build: ParsedBuild): string {
  const { character, stats, meta } = build;
  const lifeVal = stats.find(s => s.stat === "TotalLife" || s.stat === "Life")?.value || 0;
  const dpsVal = stats.find(s => s.stat === "TotalDPS" || s.stat === "CombinedDPS")?.value || 0;
  const fireRes = stats.find(s => s.stat === "FireResist")?.value || 0;
  const coldRes = stats.find(s => s.stat === "ColdResist")?.value || 0;
  const lightRes = stats.find(s => s.stat === "LightningResist")?.value || 0;

  const resOk = fireRes >= 70 && coldRes >= 70 && lightRes >= 70;
  const lifeOk = lifeVal >= 4000;
  const dpsOk = dpsVal >= 100000;

  const className = CLASS_KR[character.className] || character.className;
  const ascendName = ASCENDANCY_KR[character.ascendClassName] || character.ascendClassName;
  const ascendEn = character.ascendClassName || "";
  const mainSkillKr = character.mainSkill
    ? translateSkillGem(character.mainSkill, meta.gameVersion)
    : "알 수 없음";
  const mainSkillEn = character.mainSkill || "알 수 없음";

  // 추천도/난이도 계산
  const operationDiff = estimateOperationDifficulty(mainSkillEn);
  const leagueStarterScore = estimateLeagueStarterScore(ascendName + " " + ascendEn);
  const bossKillerScore = estimateBossKillerScore(dpsVal, lifeOk, resOk);

  // 파밍 효율: 이동 스킬이 메인이거나 Raider/Pathfinder류면 높음, 기본값 보통
  const farmingScore = ["flickerstrike", "cyclone", "lightningstrike"].includes(mainSkillEn.toLowerCase().replace(/\s/g, ""))
    ? 4 : 3;

  // 전체 추천도: 리그 스타터 + 보스킬러 + 파밍의 평균
  const overallScore = Math.round((leagueStarterScore + bossKillerScore + farmingScore) / 3);

  // 빌드 이해 난이도: 조작 난이도와 유사하되 1 낮게 (이해는 쉬운 편)
  const buildUnderstandScore = Math.max(1, operationDiff.score - 1);
  // 아이템 수급 난이도: DPS 높을수록 고가 아이템 필요
  const itemDiffScore = dpsVal >= 500000 ? 4 : dpsVal >= 200000 ? 3 : 2;
  const itemDiffLabel = itemDiffScore >= 4 ? "어려움" : itemDiffScore === 3 ? "보통" : "쉬움";

  return `### 빌드 평가
${className} ${ascendName} (${ascendEn}) 빌드입니다. 메인 스킬은 ${mainSkillKr} (${mainSkillEn})이며 레벨 ${character.level} 기준으로 분석합니다.
${lifeOk ? "생존력이 충분합니다." : "생명력이 부족합니다 — 패시브 트리에서 생명력 노드 투자를 늘려주세요."}
${resOk ? "저항이 75% 캡에 근접해 있습니다." : "저항이 75% 미만입니다 — 장비 교체나 패시브로 저항을 올려주세요."}

### 추천도 평가
**전체 추천도**: ${starRating(overallScore)} (${overallScore}/5)
**리그 스타터 적합도**: ${starRating(leagueStarterScore)} (일반 아이템으로도 ${leagueStarterScore >= 4 ? "충분히 진행 가능" : "진행 가능하나 핵심 유니크 권장"})
**보스 킬러 적합도**: ${starRating(bossKillerScore)}
**파밍 효율**: ${starRating(farmingScore)}

### 난이도
**조작 난이도**: ${starRating(operationDiff.score)} (${operationDiff.label})
**빌드 이해 난이도**: ${starRating(buildUnderstandScore)}
**아이템 수급 난이도**: ${starRating(itemDiffScore)} (${itemDiffLabel})

### 난이도별 평가
**초보자**: ${ascendName} (${ascendEn}) 어센던시를 활용한 빌드입니다. PoE 처음이라면 캐릭터 성장과 저항 맞추기에 집중하세요.
**중급자**: 메인 스킬 지원 젬 최적화와 아이템 업그레이드로 DPS를 크게 향상시킬 수 있습니다.
**고급자**: 유니크 아이템 조합과 클러스터 주얼 (Cluster Jewel) 활용으로 엔드게임 콘텐츠 클리어가 가능합니다.

### 예산 추정
**최소 예산** (리그 진행 가능): 1~5 디바인 (주요 유니크 없이 레어 아이템으로 구성)
**중간 예산** (편안한 맵 파밍): 10~30 디바인 (핵심 유니크 장착)
**풀세팅 예산** (최상위 콘텐츠): 50 디바인 이상 (최상위 장비 완성)

### 핵심 메커니즘
1. **메인 스킬**: ${mainSkillKr} (${mainSkillEn}) — 빌드의 핵심 딜링 스킬입니다
2. **방어 레이어**: ${lifeOk ? "충분한 생명력으로 생존" : "생명력 보강 필요"}, ${resOk ? "저항 캡 달성" : "저항 보강 필요"}
3. **어센던시**: ${ascendName} (${ascendEn})의 특수 능력을 활용하여 빌드 성능을 극대화합니다
4. **패시브 트리**: ${build.passives.totalNodes}개 노드로 ${dpsOk ? "공격력과 생존력 균형" : "생존력 위주"}로 구성

### 플레이 팁
- 저항 75% 유지가 최우선 — 장비보다 저항을 먼저 맞추세요
- 메인 스킬 젬 (Gem)을 레벨 20, 20품질로 업그레이드하면 큰 DPS 상승이 있습니다
- ${character.level < 70 ? "레벨 업에 집중하고 메인 스킬 슬롯을 6링크 (6-Link)로 만드는 게 목표입니다" : "맵 파밍 중 더 좋은 아이템을 찾아 장착하면서 성능을 높여주세요"}

---
*참고: AI API 키가 설정되지 않아 기본 분석을 제공합니다. GEMINI_API_KEY를 설정하면 더 정확한 AI 분석을 이용할 수 있습니다.*`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const build = body.build as ParsedBuild;

    if (!build) {
      return NextResponse.json({ error: "빌드 데이터가 없습니다." }, { status: 400 });
    }

    const buildSummary = buildSummaryText(build);

    let analysis: string;
    if (process.env.GEMINI_API_KEY) {
      analysis = await analyzeWithGemini(buildSummary);
    } else {
      // API 키 없으면 규칙 기반 분석
      analysis = ruleBasedAnalysis(build);
    }

    return NextResponse.json({ analysis });
  } catch (error) {
    const message = error instanceof Error ? error.message : "분석 중 오류가 발생했습니다.";
    // 오류 시 규칙 기반 폴백
    try {
      const body = await req.clone().json();
      const fallback = ruleBasedAnalysis(body.build as ParsedBuild);
      return NextResponse.json({ analysis: fallback, warning: message });
    } catch {
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
}
