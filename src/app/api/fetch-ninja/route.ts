import { NextRequest, NextResponse } from "next/server";
import { parseNinjaUrl, fetchNinjaCharacter } from "@/lib/ninja-fetcher";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "poe.ninja URL이 필요합니다." },
      { status: 400 }
    );
  }

  const parsed = parseNinjaUrl(url);
  if (!parsed) {
    return NextResponse.json(
      {
        error:
          "올바른 poe.ninja URL 형식이 아닙니다.\n예: https://poe.ninja/poe1/builds/{리그}/character/{계정명}/{캐릭터명}",
      },
      { status: 400 }
    );
  }

  try {
    const build = await fetchNinjaCharacter(
      parsed.accountName,
      parsed.charName,
      parsed.gameVersion
    );
    return NextResponse.json({ build });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "캐릭터 정보를 가져오는 데 실패했습니다.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
