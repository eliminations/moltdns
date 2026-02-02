import { NextRequest, NextResponse } from "next/server";
import { syncAllPlatforms, syncMoltbookAgents, syncOpenClawAgents } from "@/lib/integrations";

// This endpoint triggers a scrape/sync of all platforms
// In production, this should be protected and called by a cron job

export async function POST(request: NextRequest) {
  try {
    // Simple auth check - in production use proper auth
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.SCRAPE_API_KEY || "dev-scrape-key";

    if (authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for specific platform parameter
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");

    let results;

    if (platform === "moltbook") {
      const count = await syncMoltbookAgents();
      results = { moltbook: count, openclaw: 0, total: count };
    } else if (platform === "openclaw") {
      const count = await syncOpenClawAgents();
      results = { moltbook: 0, openclaw: count, total: count };
    } else {
      results = await syncAllPlatforms();
    }

    return NextResponse.json({
      success: true,
      synced: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Scrape API error:", error);
    return NextResponse.json({ error: "Scrape failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to trigger a sync with platforms",
    endpoints: {
      all: "POST /api/scrape",
      moltbook: "POST /api/scrape?platform=moltbook",
      openclaw: "POST /api/scrape?platform=openclaw",
    },
    note: "Requires Authorization header with Bearer token",
  });
}
