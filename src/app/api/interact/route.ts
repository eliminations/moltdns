import { NextRequest, NextResponse } from "next/server";
import { moltbookClient } from "@/lib/integrations";
import { z } from "zod";

const postSchema = z.object({
  action: z.enum(["post", "reply", "vote"]),
  title: z.string().optional(),
  content: z.string().min(1).max(10000),
  postId: z.string().optional(),
  submoltId: z.string().optional(),
  direction: z.enum(["up", "down"]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = postSchema.parse(body);

    // Check if API key is configured
    if (!process.env.MOLTBOOK_API_KEY) {
      return NextResponse.json(
        {
          error: "Moltbook API key not configured",
          message: "Set MOLTBOOK_API_KEY in your environment to enable interactions",
        },
        { status: 503 }
      );
    }

    switch (data.action) {
      case "post": {
        if (!data.title) {
          return NextResponse.json(
            { error: "Title is required for creating a post" },
            { status: 400 }
          );
        }

        const post = await moltbookClient.createPost({
          title: data.title,
          content: data.content,
          submolt_id: data.submoltId,
        });

        return NextResponse.json({
          success: true,
          post,
          message: "Post created successfully",
        });
      }

      case "reply": {
        if (!data.postId) {
          return NextResponse.json(
            { error: "postId is required for replying" },
            { status: 400 }
          );
        }

        const comment = await moltbookClient.createComment(data.postId, data.content);

        return NextResponse.json({
          success: true,
          comment,
          message: "Reply posted successfully",
        });
      }

      case "vote": {
        if (!data.postId || !data.direction) {
          return NextResponse.json(
            { error: "postId and direction are required for voting" },
            { status: 400 }
          );
        }

        const result = await moltbookClient.vote(data.postId, data.direction);

        return NextResponse.json({
          success: true,
          result,
          message: `Vote ${data.direction} recorded`,
        });
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("POST /api/interact error:", error);
    return NextResponse.json(
      {
        error: "Interaction failed",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return interaction capabilities and status
  const hasApiKey = !!process.env.MOLTBOOK_API_KEY;

  let connectionStatus = "unknown";
  try {
    const status = await moltbookClient.testConnection();
    connectionStatus = status.status;
  } catch {
    connectionStatus = "error";
  }

  return NextResponse.json({
    capabilities: {
      post: hasApiKey,
      reply: hasApiKey,
      vote: hasApiKey,
    },
    status: {
      authenticated: hasApiKey,
      connection: connectionStatus,
    },
    endpoints: {
      post: "POST /api/interact with action: 'post', title, content, submoltId?",
      reply: "POST /api/interact with action: 'reply', postId, content",
      vote: "POST /api/interact with action: 'vote', postId, direction: 'up'|'down'",
    },
  });
}
