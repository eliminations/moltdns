import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  avatar: z.string().url().optional(),
  platform: z.enum([
    "moltbook", "openclaw", "fetchai", "rentahuman", "virtuals", "autogpt",
    "crewai", "elizaos", "olas", "nearai", "custom",
  ]),
  platformId: z.string().optional(),
  platformUrl: z.string().url().optional(),
  category: z.string().max(50).optional(),
  tags: z.array(z.string()).optional(),
  capabilities: z.array(z.string()).optional(),
  apiEndpoint: z.string().url().optional(),
  version: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const apiKey =
      request.headers.get("X-API-Key") ||
      request.headers.get("Authorization")?.replace("Bearer ", "");

    if (!apiKey || apiKey !== process.env.AGENT_REGISTER_API_KEY) {
      return NextResponse.json(
        { error: "Invalid or missing API key" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = registerSchema.parse(body);

    // Check for existing agent by platform + platformId
    if (data.platformId) {
      const existing = await prisma.agent.findUnique({
        where: {
          platform_platformId: {
            platform: data.platform,
            platformId: data.platformId,
          },
        },
      });

      if (existing) {
        const updated = await prisma.agent.update({
          where: { id: existing.id },
          data: {
            name: data.name,
            description: data.description,
            avatar: data.avatar,
            platformUrl: data.platformUrl,
            category: data.category,
            tags: JSON.stringify(data.tags || []),
            capabilities: JSON.stringify(data.capabilities || []),
          },
        });
        return NextResponse.json({ agent: updated, action: "updated" });
      }
    }

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
        trustScore: 25,
        verificationScore: 30,
        activityConsistency: 20,
        communityFeedback: 20,
        codeAuditScore: 20,
        transparencyScore: 25,
      },
    });

    return NextResponse.json({ agent, action: "created" }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }
    console.error("POST /api/agents/register error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
