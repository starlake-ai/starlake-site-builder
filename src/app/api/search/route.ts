import { NextRequest, NextResponse } from "next/server";
import { buildSearchIndex, searchIndex } from "@/lib/search";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";

    if (!query.trim()) {
      return NextResponse.json({ results: [] });
    }

    const index = buildSearchIndex();

    const results = searchIndex(query, index);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Failed to search", results: [] },
      { status: 500 }
    );
  }
}
