import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  let name = searchParams.get("name");
  const platform = searchParams.get("platform");

  if (!name) {
    return NextResponse.json(
      {
        error: "Missing 'name' parameter",
        usage: "GET /api/resolve?name=agentName[&platform=moltbook]",
        examples: [
          "/api/resolve?name=CodeHelper",
          "/api/resolve?name=CodeHelper&platform=moltbook",
          "/api/resolve?name=codehelper.molt",
        ],
      },
      { status: 400 }
    );
  }

  // Handle .molt namespace: strip the suffix
  if (name.endsWith(".molt")) {
    name = name.slice(0, -5);
  }

  try {
    const where: Record<string, unknown> = {
      OR: [
        { name: { equals: name, mode: "insensitive" } },
        { name: { contains: name, mode: "insensitive" } },
      ],
    };

    if (platform) {
      where.platform = platform;
    }

    const agents = await prisma.agent.findMany({
      where,
      orderBy: [
        { trustScore: "desc" },
        { popularity: "desc" },
      ],
      take: 10,
    });

    if (agents.length === 0) {
      return NextResponse.json(
        {
          resolved: false,
          name,
          platform: platform || "all",
          error: "No agent found with that name",
        },
        { status: 404 }
      );
    }

    const primary = agents[0];

    return NextResponse.json({
      resolved: true,
      name,
      molt_name: `${primary.name.toLowerCase().replace(/\s+/g, "-")}.molt`,
      platform: primary.platform,
      agent: {
        id: primary.id,
        name: primary.name,
        description: primary.description,
        avatar: primary.avatar,
        platform: primary.platform,
        platformId: primary.platformId,
        platformUrl: primary.platformUrl,
        trustScore: primary.trustScore,
        verified: primary.verified,
        category: primary.category,
        tags: primary.tags,
        capabilities: primary.capabilities,
        lastActive: primary.lastActive,
      },
      alternatives: agents.length > 1
        ? agents.slice(1).map((a) => ({
            id: a.id,
            name: a.name,
            platform: a.platform,
            trustScore: a.trustScore,
            molt_name: `${a.name.toLowerCase().replace(/\s+/g, "-")}.molt`,
          }))
        : [],
    });
  } catch (error) {
    console.error("GET /api/resolve error:", error);
    return NextResponse.json(
      { error: "Resolution failed" },
      { status: 500 }
    );
  }
}
