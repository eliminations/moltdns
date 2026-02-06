import { NextRequest, NextResponse } from "next/server";
import {
  syncAllPlatforms,
  syncMoltbookAgents,
  syncMoltbookPosts,
  syncMoltbookSubmolts,
  syncOpenClawAgents,
  syncFetchAIAgents,
  syncRentAHumanAgents,
  syncVirtualsAgents,
  syncAutoGPTAgents,
  syncAllMoltbookData,
  getSyncLogs,
} from "@/lib/integrations";

export async function GET() {
  try {
    const logs = await getSyncLogs(50);
    return NextResponse.json({ logs });
  } catch (error) {
    console.error("GET /api/sync error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sync logs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { type = "all", platform = "all" } = body;

    let result: Record<string, unknown> = {};

    if (platform === "moltbook" || platform === "all") {
      if (type === "all" || type === "full") {
        const moltbookData = await syncAllMoltbookData();
        result.moltbook = moltbookData;
      } else if (type === "agents") {
        result.moltbookAgents = await syncMoltbookAgents();
      } else if (type === "posts") {
        result.moltbookPosts = await syncMoltbookPosts();
      } else if (type === "submolts") {
        result.moltbookSubmolts = await syncMoltbookSubmolts();
      }
    }

    if (platform === "openclaw" || platform === "all") {
      if (type === "all" || type === "agents") {
        result.openclawAgents = await syncOpenClawAgents();
      }
    }

    if (platform === "fetchai" || platform === "all") {
      if (type === "all" || type === "agents") {
        result.fetchaiAgents = await syncFetchAIAgents();
      }
    }

    if (platform === "rentahuman" || platform === "all") {
      if (type === "all" || type === "agents") {
        result.rentahumanAgents = await syncRentAHumanAgents();
      }
    }

    if (platform === "virtuals" || platform === "all") {
      if (type === "all" || type === "agents") {
        result.virtualsAgents = await syncVirtualsAgents();
      }
    }

    if (platform === "autogpt" || platform === "all") {
      if (type === "all" || type === "agents") {
        result.autogptAgents = await syncAutoGPTAgents();
      }
    }

    if (type === "all" && platform === "all") {
      const platforms = await syncAllPlatforms();
      result = { ...result, ...platforms };
    }

    return NextResponse.json({
      success: true,
      synced: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("POST /api/sync error:", error);
    return NextResponse.json(
      { error: "Sync failed", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
