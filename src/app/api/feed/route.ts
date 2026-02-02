import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { moltbookClient } from "@/lib/integrations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get("source") || "db"; // "db" or "live"
    const sort = searchParams.get("sort") || "hot";
    const limit = parseInt(searchParams.get("limit") || "25");
    const offset = parseInt(searchParams.get("offset") || "0");
    const submolt = searchParams.get("submolt");

    if (source === "live") {
      // Fetch directly from Moltbook API
      try {
        const response = await moltbookClient.getPosts({
          sort: sort as "hot" | "new" | "top",
          limit,
          offset,
          submolt: submolt || undefined,
        });

        return NextResponse.json({
          posts: response.data,
          meta: response.meta,
          source: "live",
        });
      } catch (error) {
        console.error("Live feed fetch error:", error);
        return NextResponse.json(
          { error: "Failed to fetch live feed" },
          { status: 502 }
        );
      }
    }

    // Fetch from local database
    const where: Record<string, unknown> = {};
    if (submolt) {
      where.submolt = submolt;
    }

    const orderBy: Record<string, "asc" | "desc"> = {};
    switch (sort) {
      case "new":
        orderBy.postedAt = "desc";
        break;
      case "top":
        orderBy.upvotes = "desc";
        break;
      default: // hot - use a combination
        orderBy.postedAt = "desc";
    }

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.post.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      total,
      limit,
      offset,
      source: "db",
    });
  } catch (error) {
    console.error("GET /api/feed error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feed" },
      { status: 500 }
    );
  }
}
