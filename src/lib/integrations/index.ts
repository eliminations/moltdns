/**
 * Platform Integrations Index
 *
 * This module exports all platform integrations for AgentUber
 */

export {
  moltbookClient,
  transformMoltbookAgent,
  type MoltbookAgent,
  type MoltbookAgentProfile,
  type MoltbookPost,
  type MoltbookSubmolt,
  type MoltbookComment,
} from "./moltbook";

export {
  openclawClient,
  transformOpenClawAgent,
  type OpenClawAgent,
  type OpenClawSkill,
} from "./openclaw";

export {
  bagsClient,
  MOLTDNS_TOKEN,
  getBagsTokenUrl,
  getBagsTradeUrl,
  type BagsTokenInfo,
  type BagsTradeQuote,
} from "./bags";

import { moltbookClient, transformMoltbookAgent } from "./moltbook";
import { openclawClient, transformOpenClawAgent } from "./openclaw";
import { prisma } from "../db";
import { calculateTrustScore, TrustBreakdown } from "../trust-algorithm";

/**
 * Fetch and sync agents from Moltbook
 * Extracts agents from posts since there's no dedicated agents endpoint
 */
export async function syncMoltbookAgents(limit = 100): Promise<number> {
  console.log("Syncing Moltbook agents (from posts)...");
  let synced = 0;

  try {
    const { agents, postCount } = await moltbookClient.getAgentsFromPosts({ limit: limit * 2 });
    console.log(`  Found ${agents.length} unique agents from ${postCount} posts`);

    for (const moltAgent of agents) {
      try {
        // Fetch real profile data for accurate karma, description, etc.
        let profile;
        try {
          profile = await moltbookClient.getAgentProfile(moltAgent.name);
        } catch {
          // Fall back to post-extracted data if profile fetch fails
          profile = null;
        }

        // Use profile data when available, fall back to post-extracted data
        const realKarma = profile?.karma ?? moltAgent.karma;
        const realDescription = profile?.description || moltAgent.description;
        const realAvatar = profile?.avatar_url || moltAgent.avatar_url;
        const realLastActive = profile?.last_active || moltAgent.last_active;
        const isClaimed = profile?.is_claimed ?? false;
        const followerCount = profile?.follower_count ?? 0;
        const recentPostSubmolts = (profile?.recentPosts || []).map(p => p.submolt.name);
        const allSubmolts = [...new Set([...moltAgent.submolts, ...recentPostSubmolts])];

        const enrichedAgent: typeof moltAgent = {
          ...moltAgent,
          karma: realKarma,
          description: realDescription,
          avatar_url: realAvatar,
          last_active: realLastActive,
          submolts: allSubmolts,
          is_verified: isClaimed,
        };

        const transformed = transformMoltbookAgent(enrichedAgent);

        // Calculate trust scores based on real Moltbook profile data
        const karmaScore = Math.min(100, 40 + Math.log10(Math.max(realKarma, 1) + 1) * 10);
        const postActivity = Math.min(100, moltAgent.post_count * 10 + 30);

        const breakdown: TrustBreakdown = {
          verificationScore: isClaimed ? 75 : 40,
          activityConsistency: Math.max(calculateActivityScore(realLastActive), postActivity),
          communityFeedback: karmaScore,
          codeAuditScore: moltAgent.post_count > 3 ? 55 : 40,
          transparencyScore: realDescription && realDescription !== "Agent on Moltbook"
            ? (moltAgent.post_count > 5 ? 80 : 60)
            : (moltAgent.post_count > 1 ? 50 : 35),
        };

        // Bonus for followers
        if (followerCount > 10) breakdown.communityFeedback = Math.min(100, breakdown.communityFeedback + 10);
        if (followerCount > 50) breakdown.communityFeedback = Math.min(100, breakdown.communityFeedback + 10);

        const trustScore = calculateTrustScore(breakdown);

        await prisma.agent.upsert({
          where: {
            platform_platformId: {
              platform: "moltbook",
              platformId: enrichedAgent.id,
            },
          },
          create: {
            ...transformed,
            tags: JSON.stringify(transformed.tags),
            capabilities: JSON.stringify(transformed.capabilities),
            trustScore,
            ...breakdown,
          },
          update: {
            name: transformed.name,
            description: transformed.description,
            avatar: transformed.avatar,
            platformUrl: transformed.platformUrl,
            tags: JSON.stringify(transformed.tags),
            capabilities: JSON.stringify(transformed.capabilities),
            trustScore,
            ...breakdown,
            popularity: transformed.popularity,
            lastActive: transformed.lastActive,
            verified: transformed.verified,
          },
        });

        synced++;
        if (synced % 10 === 0) console.log(`  Synced ${synced}/${agents.length} agents...`);
      } catch (error) {
        console.error(`Failed to sync Moltbook agent ${moltAgent.name}:`, error);
      }
    }

    // Log the sync
    await prisma.syncLog.create({
      data: {
        platform: "moltbook",
        type: "agents",
        status: "success",
        count: synced,
      },
    });
  } catch (error) {
    console.error("Moltbook sync error:", error);
    await prisma.syncLog.create({
      data: {
        platform: "moltbook",
        type: "agents",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }

  console.log(`Synced ${synced} agents from Moltbook`);
  return synced;
}

/**
 * Fetch and sync agents from OpenClaw
 */
export async function syncOpenClawAgents(limit = 100): Promise<number> {
  console.log("Syncing OpenClaw agents...");
  let synced = 0;

  try {
    const response = await openclawClient.getPublicAgents({ limit, sort: "popular" });

    if (!response.success || !response.data) {
      throw new Error("Failed to fetch OpenClaw agents");
    }

    const agents = response.data;

    for (const clawAgent of agents) {
      try {
        const transformed = transformOpenClawAgent(clawAgent);

        // Calculate trust scores based on OpenClaw data
        const breakdown: TrustBreakdown = {
          verificationScore: clawAgent.usage_stats.uptime_percentage > 95 ? 85 : 50,
          activityConsistency: Math.min(100, clawAgent.usage_stats.uptime_percentage),
          communityFeedback: Math.min(
            100,
            30 + Math.log10(clawAgent.usage_stats.active_users + 1) * 20
          ),
          codeAuditScore: clawAgent.skills.length > 5 ? 60 : 35,
          transparencyScore: clawAgent.description.length > 100 ? 70 : 40,
        };

        const trustScore = calculateTrustScore(breakdown);

        await prisma.agent.upsert({
          where: {
            platform_platformId: {
              platform: "openclaw",
              platformId: clawAgent.id,
            },
          },
          create: {
            ...transformed,
            tags: JSON.stringify(transformed.tags),
            capabilities: JSON.stringify(transformed.capabilities),
            trustScore,
            ...breakdown,
          },
          update: {
            name: transformed.name,
            description: transformed.description,
            avatar: transformed.avatar,
            platformUrl: transformed.platformUrl,
            tags: JSON.stringify(transformed.tags),
            capabilities: JSON.stringify(transformed.capabilities),
            trustScore,
            ...breakdown,
            popularity: transformed.popularity,
            lastActive: transformed.lastActive,
            verified: transformed.verified,
          },
        });

        synced++;
      } catch (error) {
        console.error(`Failed to sync OpenClaw agent ${clawAgent.name}:`, error);
      }
    }
  } catch (error) {
    console.error("OpenClaw sync error:", error);
  }

  console.log(`Synced ${synced} agents from OpenClaw`);
  return synced;
}

/**
 * Sync all platforms
 */
export async function syncAllPlatforms(): Promise<{
  moltbook: number;
  openclaw: number;
  total: number;
}> {
  const [moltbook, openclaw] = await Promise.all([
    syncMoltbookAgents(),
    syncOpenClawAgents(),
  ]);

  return {
    moltbook,
    openclaw,
    total: moltbook + openclaw,
  };
}

/**
 * Calculate activity score based on last active date
 */
function calculateActivityScore(lastActive: string | Date): number {
  const lastActiveDate = typeof lastActive === "string" ? new Date(lastActive) : lastActive;
  const daysSinceActive = Math.floor(
    (Date.now() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceActive === 0) return 100;
  if (daysSinceActive <= 1) return 95;
  if (daysSinceActive <= 3) return 85;
  if (daysSinceActive <= 7) return 70;
  if (daysSinceActive <= 14) return 55;
  if (daysSinceActive <= 30) return 40;
  return Math.max(20, 40 - daysSinceActive);
}

/**
 * Sync posts from Moltbook
 */
export async function syncMoltbookPosts(options: {
  sort?: "hot" | "new" | "top";
  limit?: number;
} = {}): Promise<number> {
  console.log("Syncing Moltbook posts...");
  let synced = 0;

  try {
    const response = await moltbookClient.getPosts({
      sort: options.sort || "hot",
      limit: options.limit || 50,
    });
    const posts = response.posts;

    for (const post of posts) {
      try {
        await prisma.post.upsert({
          where: { platformId: post.id },
          create: {
            platformId: post.id,
            platform: "moltbook",
            title: post.title,
            content: post.content,
            url: post.url,
            authorId: post.author.id,
            authorName: post.author.name,
            authorAvatar: post.author.avatar_url,
            submolt: post.submolt.id,
            submoltName: post.submolt.display_name || post.submolt.name,
            upvotes: post.upvotes,
            downvotes: post.downvotes,
            commentCount: post.comment_count,
            postedAt: new Date(post.created_at),
          },
          update: {
            title: post.title,
            content: post.content,
            upvotes: post.upvotes,
            downvotes: post.downvotes,
            commentCount: post.comment_count,
          },
        });
        synced++;
      } catch (error) {
        console.error(`Failed to sync post ${post.id}:`, error);
      }
    }

    // Log the sync
    await prisma.syncLog.create({
      data: {
        platform: "moltbook",
        type: "posts",
        status: "success",
        count: synced,
      },
    });
  } catch (error) {
    console.error("Moltbook posts sync error:", error);
    await prisma.syncLog.create({
      data: {
        platform: "moltbook",
        type: "posts",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }

  console.log(`Synced ${synced} posts from Moltbook`);
  return synced;
}

/**
 * Sync submolts from Moltbook
 */
export async function syncMoltbookSubmolts(limit = 50): Promise<number> {
  console.log("Syncing Moltbook submolts...");
  let synced = 0;

  try {
    const submolts = await moltbookClient.getSubmolts(limit);

    for (const submolt of submolts) {
      try {
        await prisma.submolt.upsert({
          where: { platformId: submolt.id },
          create: {
            platformId: submolt.id,
            name: submolt.name,
            displayName: submolt.display_name,
            description: submolt.description,
            subscriberCount: submolt.subscriber_count,
          },
          update: {
            displayName: submolt.display_name,
            description: submolt.description,
            subscriberCount: submolt.subscriber_count,
          },
        });
        synced++;
      } catch (error) {
        console.error(`Failed to sync submolt ${submolt.name}:`, error);
      }
    }

    await prisma.syncLog.create({
      data: {
        platform: "moltbook",
        type: "submolts",
        status: "success",
        count: synced,
      },
    });
  } catch (error) {
    console.error("Moltbook submolts sync error:", error);
    await prisma.syncLog.create({
      data: {
        platform: "moltbook",
        type: "submolts",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }

  console.log(`Synced ${synced} submolts from Moltbook`);
  return synced;
}

/**
 * Sync all Moltbook data (agents, posts, submolts)
 */
export async function syncAllMoltbookData(): Promise<{
  agents: number;
  posts: number;
  submolts: number;
}> {
  const [agents, posts, submolts] = await Promise.all([
    syncMoltbookAgents(),
    syncMoltbookPosts(),
    syncMoltbookSubmolts(),
  ]);

  return { agents, posts, submolts };
}

/**
 * Get recent sync logs
 */
export async function getSyncLogs(limit = 20) {
  return prisma.syncLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
