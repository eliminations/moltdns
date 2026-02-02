import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const agentSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  avatar: z.string().url().optional(),
  platform: z.enum(["moltbook", "openclaw", "custom"]),
  platformId: z.string().optional(),
  platformUrl: z.string().url().optional(),
  category: z.string().max(50).optional(),
  tags: z.array(z.string()).optional(),
  capabilities: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const platform = searchParams.get("platform");
    const category = searchParams.get("category");
    const minTrust = searchParams.get("minTrust");
    const verified = searchParams.get("verified");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort") || "trustScore";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: Record<string, unknown> = {};

    if (platform && platform !== "all") {
      where.platform = platform;
    }

    if (category && category !== "all") {
      where.category = category;
    }

    if (minTrust) {
      where.trustScore = { gte: parseFloat(minTrust) };
    }

    if (verified === "true") {
      where.verified = true;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    const orderBy: Record<string, "asc" | "desc"> = {};
    switch (sort) {
      case "popularity":
        orderBy.popularity = "desc";
        break;
      case "newest":
        orderBy.createdAt = "desc";
        break;
      case "active":
        orderBy.lastActive = "desc";
        break;
      default:
        orderBy.trustScore = "desc";
    }

    const [agents, total] = await Promise.all([
      prisma.agent.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.agent.count({ where }),
    ]);

    return NextResponse.json({
      agents,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error("GET /api/agents error:", error);
    return NextResponse.json(
      { error: "Failed to fetch agents" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = agentSchema.parse(body);

    const agent = await prisma.agent.create({
      data: {
        name: data.name,
        description: data.description,
        avatar: data.avatar,
        platform: data.platform,
        platformId: data.platformId,
        platformUrl: data.platformUrl,
        category: data.category,
        tags: JSON.stringify(data.tags || []),
        capabilities: JSON.stringify(data.capabilities || []),
        trustScore: 20, // Base score for new agents
        verificationScore: 20,
        activityConsistency: 20,
        communityFeedback: 20,
        codeAuditScore: 20,
        transparencyScore: 20,
      },
    });

    return NextResponse.json(agent, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/agents error:", error);
    return NextResponse.json(
      { error: "Failed to create agent" },
      { status: 500 }
    );
  }
}
