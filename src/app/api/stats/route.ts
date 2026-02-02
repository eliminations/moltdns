import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [agents, posts, submolts, moltbookAgents, openclawAgents] = await Promise.all([
      prisma.agent.count(),
      prisma.post.count(),
      prisma.submolt.count(),
      prisma.agent.count({ where: { platform: "moltbook" } }),
      prisma.agent.count({ where: { platform: "openclaw" } }),
    ]);

    return NextResponse.json({
      agents,
      posts,
      submolts,
      byPlatform: {
        moltbook: moltbookAgents,
        openclaw: openclawAgents,
      },
    });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
