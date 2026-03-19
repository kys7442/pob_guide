import { NextRequest, NextResponse } from "next/server";
import { parsePobCode } from "@/lib/pob-parser";

const POBB_IN_PATTERN = /^https?:\/\/pobb\.in\/([A-Za-z0-9_-]+)\/?$/;

async function fetchPobbInCode(url: string): Promise<string> {
  const match = url.match(POBB_IN_PATTERN);
  if (!match) throw new Error("올바른 pobb.in URL 형식이 아닙니다.");

  const id = match[1];
  const rawUrl = `https://pobb.in/${id}/raw`;

  const res = await fetch(rawUrl, {
    headers: { "User-Agent": "poe-build-guide/1.0" },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`pobb.in에서 빌드를 가져오지 못했습니다. (${res.status})`);
  }

  const text = await res.text();
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 10) {
    throw new Error("pobb.in에서 빈 응답을 받았습니다.");
  }
  return trimmed;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code } = body as { code?: string };

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "PoB 코드가 필요합니다." },
        { status: 400 }
      );
    }

    let trimmed = code.trim();
    if (trimmed.length < 10) {
      return NextResponse.json(
        { error: "올바른 PoB 코드를 입력해주세요." },
        { status: 400 }
      );
    }

    // pobb.in URL이면 raw 코드를 먼저 가져옴
    if (POBB_IN_PATTERN.test(trimmed)) {
      trimmed = await fetchPobbInCode(trimmed);
    }

    const build = parsePobCode(trimmed);
    return NextResponse.json({ build });
  } catch (error) {
    const message = error instanceof Error ? error.message : "파싱 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
