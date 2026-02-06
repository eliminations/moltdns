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

export {
  fetchaiClient,
  transformFetchAIAgent,
  type FetchAIAgent,
} from "./fetchai";

export {
  rentahumanClient,
  transformRentAHumanAgent,
  type RentAHumanProfile,
} from "./rentahuman";

export {
  virtualsClient,
  transformVirtualsAgent,
  type VirtualsAgent,
} from "./virtuals";

export {
  autogptClient,
  transformAutoGPTAgent,
  type AutoGPTAgent,
} from "./autogpt";

export {
  crewaiClient,
  transformCrewAIAgent,
  type CrewAIAgent,
} from "./crewai";

export {
  elizaosClient,
  transformElizaOSAgent,
  type ElizaOSAgent,
} from "./elizaos";

export {
  olasClient,
  transformOlasAgent,
  type OlasAgent,
} from "./olas";

export {
  nearaiClient,
  transformNEARAIAgent,
  type NEARAIAgent,
} from "./nearai";

import { moltbookClient, transformMoltbookAgent } from "./moltbook";
import { openclawClient, transformOpenClawAgent } from "./openclaw";
import { fetchaiClient, transformFetchAIAgent } from "./fetchai";
import { rentahumanClient, transformRentAHumanAgent } from "./rentahuman";
import { virtualsClient, transformVirtualsAgent } from "./virtuals";
import { autogptClient, transformAutoGPTAgent } from "./autogpt";
import { crewaiClient, transformCrewAIAgent } from "./crewai";
import { elizaosClient, transformElizaOSAgent } from "./elizaos";
import { olasClient, transformOlasAgent } from "./olas";
import { nearaiClient, transformNEARAIAgent } from "./nearai";
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
 * Fetch and sync agents from Fetch.ai Agentverse
 */
export async function syncFetchAIAgents(limit = 50): Promise<number> {
  console.log("Syncing Fetch.ai agents...");
  let synced = 0;

  try {
    const response = await fetchaiClient.searchAgents({
      sort: "popular",
      limit,
      filters: { state: "active" },
    });

    const agents = response.agents;

    for (const agent of agents) {
      try {
        const transformed = transformFetchAIAgent(agent);

        const interactionScore = Math.min(100, 30 + Math.log10(agent.interaction_count + 1) * 15);

        const breakdown: TrustBreakdown = {
          verificationScore: agent.state === "active" ? 70 : 30,
          activityConsistency: calculateActivityScore(agent.updated_at),
          communityFeedback: interactionScore,
          codeAuditScore: agent.protocol_digest ? 55 : 35,
          transparencyScore: agent.description.length > 50 ? 65 : 35,
        };

        const trustScore = calculateTrustScore(breakdown);

        await prisma.agent.upsert({
          where: {
            platform_platformId: {
              platform: "fetchai",
              platformId: agent.address,
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
        console.error(`Failed to sync Fetch.ai agent ${agent.name}:`, error);
      }
    }

    await prisma.syncLog.create({
      data: {
        platform: "fetchai",
        type: "agents",
        status: "success",
        count: synced,
      },
    });
  } catch (error) {
    console.error("Fetch.ai sync error:", error);
    await prisma.syncLog.create({
      data: {
        platform: "fetchai",
        type: "agents",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }

  console.log(`Synced ${synced} agents from Fetch.ai`);
  return synced;
}

/**
 * Fetch and sync agents from RentAHuman
 */
export async function syncRentAHumanAgents(limit = 50): Promise<number> {
  console.log("Syncing RentAHuman agents...");
  let synced = 0;

  try {
    const response = await rentahumanClient.getHumans({ limit });
    const humans = response.humans;

    for (const human of humans) {
      try {
        const transformed = transformRentAHumanAgent(human);

        const taskScore = Math.min(100, 30 + Math.log10(human.completed_tasks + 1) * 20);
        const skillScore = Math.min(100, human.skills.length * 15 + 20);

        const breakdown: TrustBreakdown = {
          verificationScore: human.crypto_wallets.length > 0 ? 75 : 40,
          activityConsistency: calculateActivityScore(human.updated_at),
          communityFeedback: Math.min(100, human.rating * 20),
          codeAuditScore: skillScore,
          transparencyScore: human.bio && human.bio.length > 30 ? 70 : 35,
        };

        // Bonus for completed tasks
        if (human.completed_tasks > 5) breakdown.communityFeedback = Math.min(100, breakdown.communityFeedback + 10);

        const trustScore = calculateTrustScore(breakdown);

        await prisma.agent.upsert({
          where: {
            platform_platformId: {
              platform: "rentahuman",
              platformId: human.id,
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
        console.error(`Failed to sync RentAHuman agent ${human.name}:`, error);
      }
    }

    await prisma.syncLog.create({
      data: {
        platform: "rentahuman",
        type: "agents",
        status: "success",
        count: synced,
      },
    });
  } catch (error) {
    console.error("RentAHuman sync error:", error);
    await prisma.syncLog.create({
      data: {
        platform: "rentahuman",
        type: "agents",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }

  console.log(`Synced ${synced} agents from RentAHuman`);
  return synced;
}

/**
 * Fetch and sync agents from Virtuals Protocol
 */
export async function syncVirtualsAgents(limit = 50): Promise<number> {
  console.log("Syncing Virtuals Protocol agents...");
  let synced = 0;

  try {
    const response = await virtualsClient.getAgents({ limit, sort: "market_cap" });

    if (!response.success || !response.data) {
      throw new Error("Failed to fetch Virtuals agents");
    }

    const agents = response.data;

    for (const agent of agents) {
      try {
        const transformed = transformVirtualsAgent(agent);

        const holderScore = Math.min(100, 30 + Math.log10(agent.total_holders + 1) * 15);
        const mcapScore = Math.min(100, 20 + Math.log10(agent.market_cap + 1) * 8);

        const breakdown: TrustBreakdown = {
          verificationScore: agent.status === "graduated" ? 85 : (agent.bonding_curve_progress > 50 ? 60 : 35),
          activityConsistency: calculateActivityScore(agent.updated_at),
          communityFeedback: holderScore,
          codeAuditScore: mcapScore,
          transparencyScore: agent.description.length > 50 ? 65 : 35,
        };

        const trustScore = calculateTrustScore(breakdown);

        await prisma.agent.upsert({
          where: {
            platform_platformId: {
              platform: "virtuals",
              platformId: agent.id,
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
        console.error(`Failed to sync Virtuals agent ${agent.name}:`, error);
      }
    }

    await prisma.syncLog.create({
      data: {
        platform: "virtuals",
        type: "agents",
        status: "success",
        count: synced,
      },
    });
  } catch (error) {
    console.error("Virtuals sync error:", error);
    await prisma.syncLog.create({
      data: {
        platform: "virtuals",
        type: "agents",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }

  console.log(`Synced ${synced} agents from Virtuals Protocol`);
  return synced;
}

/**
 * Fetch and sync agents from AutoGPT Marketplace
 */
export async function syncAutoGPTAgents(limit = 50): Promise<number> {
  console.log("Syncing AutoGPT agents...");
  let synced = 0;

  try {
    const response = await autogptClient.getMarketplaceAgents({
      per_page: limit,
      sort: "popular",
    });

    const agents = response.agents;

    for (const agent of agents) {
      try {
        const transformed = transformAutoGPTAgent(agent);

        const downloadScore = Math.min(100, 30 + Math.log10(agent.downloads + 1) * 15);

        const breakdown: TrustBreakdown = {
          verificationScore: agent.is_featured ? 80 : 45,
          activityConsistency: calculateActivityScore(agent.updated_at),
          communityFeedback: Math.min(100, agent.rating * 20),
          codeAuditScore: agent.keywords.length > 3 ? 55 : 35,
          transparencyScore: agent.description.length > 100 ? 70 : 40,
        };

        // Bonus for reviews
        if (agent.review_count > 5) breakdown.communityFeedback = Math.min(100, breakdown.communityFeedback + 10);

        const trustScore = calculateTrustScore(breakdown);

        await prisma.agent.upsert({
          where: {
            platform_platformId: {
              platform: "autogpt",
              platformId: agent.id,
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
        console.error(`Failed to sync AutoGPT agent ${agent.name}:`, error);
      }
    }

    await prisma.syncLog.create({
      data: {
        platform: "autogpt",
        type: "agents",
        status: "success",
        count: synced,
      },
    });
  } catch (error) {
    console.error("AutoGPT sync error:", error);
    await prisma.syncLog.create({
      data: {
        platform: "autogpt",
        type: "agents",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }

  console.log(`Synced ${synced} agents from AutoGPT`);
  return synced;
}

/**
 * Fetch and sync agents from CrewAI Marketplace
 */
export async function syncCrewAIAgents(limit = 50): Promise<number> {
  console.log("Syncing CrewAI agents...");
  let synced = 0;

  try {
    const response = await crewaiClient.getPublicAgents({
      limit,
      sort: "popular",
    });

    const agents = response.agents;

    for (const agent of agents) {
      try {
        const transformed = transformCrewAIAgent(agent);

        const runScore = Math.min(100, 30 + Math.log10(agent.runs + 1) * 15);

        const breakdown: TrustBreakdown = {
          verificationScore: agent.runs > 100 ? 75 : (agent.runs > 10 ? 55 : 35),
          activityConsistency: calculateActivityScore(agent.updated_at),
          communityFeedback: Math.min(100, agent.rating * 20),
          codeAuditScore: agent.tools.length > 3 ? 60 : 35,
          transparencyScore: agent.description.length > 100 ? 70 : 40,
        };

        if (agent.review_count > 5) breakdown.communityFeedback = Math.min(100, breakdown.communityFeedback + 10);

        const trustScore = calculateTrustScore(breakdown);

        await prisma.agent.upsert({
          where: {
            platform_platformId: {
              platform: "crewai",
              platformId: agent.id,
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
        console.error(`Failed to sync CrewAI agent ${agent.name}:`, error);
      }
    }

    await prisma.syncLog.create({
      data: {
        platform: "crewai",
        type: "agents",
        status: "success",
        count: synced,
      },
    });
  } catch (error) {
    console.error("CrewAI sync error:", error);
    await prisma.syncLog.create({
      data: {
        platform: "crewai",
        type: "agents",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }

  console.log(`Synced ${synced} agents from CrewAI`);
  return synced;
}

/**
 * Fetch and sync agents from ElizaOS
 */
export async function syncElizaOSAgents(limit = 50): Promise<number> {
  console.log("Syncing ElizaOS agents...");
  let synced = 0;

  try {
    const response = await elizaosClient.getAgents({
      limit,
      sort: "popular",
    });

    const agents = response.agents;

    for (const agent of agents) {
      try {
        const transformed = transformElizaOSAgent(agent);

        const followerScore = Math.min(100, 30 + Math.log10(agent.follower_count + 1) * 15);
        const messageScore = Math.min(100, 30 + Math.log10(agent.message_count + 1) * 10);

        const breakdown: TrustBreakdown = {
          verificationScore: agent.is_verified ? 85 : (agent.token_address ? 65 : 35),
          activityConsistency: calculateActivityScore(agent.updated_at),
          communityFeedback: Math.max(followerScore, messageScore),
          codeAuditScore: agent.plugins.length > 3 ? 60 : 35,
          transparencyScore: agent.bio.length > 0 && agent.topics.length > 0 ? 70 : 35,
        };

        const trustScore = calculateTrustScore(breakdown);

        await prisma.agent.upsert({
          where: {
            platform_platformId: {
              platform: "elizaos",
              platformId: agent.id,
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
        console.error(`Failed to sync ElizaOS agent ${agent.name}:`, error);
      }
    }

    await prisma.syncLog.create({
      data: {
        platform: "elizaos",
        type: "agents",
        status: "success",
        count: synced,
      },
    });
  } catch (error) {
    console.error("ElizaOS sync error:", error);
    await prisma.syncLog.create({
      data: {
        platform: "elizaos",
        type: "agents",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }

  console.log(`Synced ${synced} agents from ElizaOS`);
  return synced;
}

/**
 * Fetch and sync agents from Olas/Autonolas
 */
export async function syncOlasAgents(limit = 50): Promise<number> {
  console.log("Syncing Olas agents...");
  let synced = 0;

  try {
    const response = await olasClient.getAgents({ limit });

    if (!response.success || !response.data) {
      throw new Error("Failed to fetch Olas agents");
    }

    const agents = response.data;

    for (const agent of agents) {
      try {
        const transformed = transformOlasAgent(agent);

        const breakdown: TrustBreakdown = {
          verificationScore: agent.state === "active" ? 85 : (agent.state === "deployed" ? 70 : 40),
          activityConsistency: calculateActivityScore(agent.updated_at),
          communityFeedback: Math.min(100, 30 + agent.slots * 10),
          codeAuditScore: agent.code_uri ? 65 : 30,
          transparencyScore: agent.description && agent.description.length > 50 ? 70 : 35,
        };

        if (agent.components > 5) breakdown.codeAuditScore = Math.min(100, breakdown.codeAuditScore + 15);

        const trustScore = calculateTrustScore(breakdown);

        await prisma.agent.upsert({
          where: {
            platform_platformId: {
              platform: "olas",
              platformId: agent.id,
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
        console.error(`Failed to sync Olas agent ${agent.name}:`, error);
      }
    }

    await prisma.syncLog.create({
      data: {
        platform: "olas",
        type: "agents",
        status: "success",
        count: synced,
      },
    });
  } catch (error) {
    console.error("Olas sync error:", error);
    await prisma.syncLog.create({
      data: {
        platform: "olas",
        type: "agents",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }

  console.log(`Synced ${synced} agents from Olas`);
  return synced;
}

/**
 * Fetch and sync agents from NEAR AI
 */
export async function syncNEARAIAgents(limit = 50): Promise<number> {
  console.log("Syncing NEAR AI agents...");
  let synced = 0;

  try {
    const response = await nearaiClient.getAgents({
      limit,
      sort: "popular",
    });

    const agents = response.agents;

    for (const agent of agents) {
      try {
        const transformed = transformNEARAIAgent(agent);

        const starScore = Math.min(100, 30 + Math.log10(agent.star_count + 1) * 20);
        const runScore = Math.min(100, 30 + Math.log10(agent.run_count + 1) * 15);

        const breakdown: TrustBreakdown = {
          verificationScore: agent.star_count > 10 ? 70 : (agent.run_count > 50 ? 60 : 35),
          activityConsistency: Math.max(calculateActivityScore(agent.updated_at), runScore),
          communityFeedback: starScore,
          codeAuditScore: agent.tags.length > 3 ? 55 : 35,
          transparencyScore: agent.description && agent.description.length > 50 ? 70 : 35,
        };

        if (agent.fork_count > 5) breakdown.communityFeedback = Math.min(100, breakdown.communityFeedback + 10);

        const trustScore = calculateTrustScore(breakdown);

        await prisma.agent.upsert({
          where: {
            platform_platformId: {
              platform: "nearai",
              platformId: agent.id,
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
        console.error(`Failed to sync NEAR AI agent ${agent.name}:`, error);
      }
    }

    await prisma.syncLog.create({
      data: {
        platform: "nearai",
        type: "agents",
        status: "success",
        count: synced,
      },
    });
  } catch (error) {
    console.error("NEAR AI sync error:", error);
    await prisma.syncLog.create({
      data: {
        platform: "nearai",
        type: "agents",
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }

  console.log(`Synced ${synced} agents from NEAR AI`);
  return synced;
}

/**
 * Sync all platforms
 */
export async function syncAllPlatforms(): Promise<{
  moltbook: number;
  openclaw: number;
  fetchai: number;
  rentahuman: number;
  virtuals: number;
  autogpt: number;
  crewai: number;
  elizaos: number;
  olas: number;
  nearai: number;
  total: number;
}> {
  const [moltbook, openclaw, fetchai, rentahuman, virtuals, autogpt, crewai, elizaos, olas, nearai] = await Promise.all([
    syncMoltbookAgents(),
    syncOpenClawAgents(),
    syncFetchAIAgents(),
    syncRentAHumanAgents(),
    syncVirtualsAgents(),
    syncAutoGPTAgents(),
    syncCrewAIAgents(),
    syncElizaOSAgents(),
    syncOlasAgents(),
    syncNEARAIAgents(),
  ]);

  const total = moltbook + openclaw + fetchai + rentahuman + virtuals + autogpt + crewai + elizaos + olas + nearai;

  return {
    moltbook,
    openclaw,
    fetchai,
    rentahuman,
    virtuals,
    autogpt,
    crewai,
    elizaos,
    olas,
    nearai,
    total,
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
