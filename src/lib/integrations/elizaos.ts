/**
 * ElizaOS Integration
 *
 * ElizaOS (formerly ai16z Eliza) is a multi-agent simulation framework
 * for creating autonomous AI personalities on social media.
 *
 * GitHub: https://github.com/elizaOS/eliza
 * Registry: https://elizaos.com
 */

const ELIZAOS_API_BASE = "https://api.elizaos.com/v1";

export interface ElizaOSAgent {
  id: string;
  name: string;
  description: string;
  bio: string[];
  lore: string[];
  model_provider: string;
  clients: string[];
  plugins: string[];
  style: { all: string[]; chat: string[]; post: string[] };
  topics: string[];
  adjectives: string[];
  token_address: string | null;
  follower_count: number;
  message_count: number;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  avatar_url: string | null;
}

export interface ElizaOSListResponse {
  agents: ElizaOSAgent[];
  total: number;
  page: number;
  limit: number;
}

class ElizaOSClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.ELIZAOS_API_URL || ELIZAOS_API_BASE;
  }

  private async fetch<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "AgentUber/1.0",
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`ElizaOS API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get public agents from ElizaOS registry
   */
  async getAgents(options: {
    limit?: number;
    page?: number;
    sort?: "popular" | "recent" | "followers";
  } = {}): Promise<ElizaOSListResponse> {
    const params = new URLSearchParams({
      limit: String(options.limit || 50),
      page: String(options.page || 1),
      sort: options.sort || "popular",
    });

    return this.fetch<ElizaOSListResponse>(
      `/agents?${params.toString()}`
    );
  }

  /**
   * Get a specific agent by ID
   */
  async getAgent(agentId: string): Promise<ElizaOSAgent> {
    const response = await this.fetch<{ agent: ElizaOSAgent }>(
      `/agents/${agentId}`
    );
    if (!response.agent) {
      throw new Error(`ElizaOS agent ${agentId} not found`);
    }
    return response.agent;
  }

  /**
   * Search agents by keyword
   */
  async searchAgents(query: string, limit = 25): Promise<ElizaOSAgent[]> {
    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
    });

    const response = await this.fetch<ElizaOSListResponse>(
      `/agents/search?${params.toString()}`
    );
    return response.agents ?? [];
  }
}

/**
 * Transform ElizaOS agent to our internal format
 */
export function transformElizaOSAgent(agent: ElizaOSAgent) {
  return {
    name: agent.name,
    description: agent.bio.join(" ") || agent.description,
    avatar: agent.avatar_url,
    platform: "elizaos" as const,
    platformId: agent.id,
    platformUrl: `https://elizaos.com/agents/${agent.id}`,
    category: agent.topics[0] || "social",
    tags: [...agent.topics.slice(0, 3), ...agent.clients].filter(Boolean),
    capabilities: agent.plugins,
    popularity: agent.follower_count + agent.message_count,
    lastActive: new Date(agent.updated_at),
    platformCreatedAt: new Date(agent.created_at),
    verified: agent.is_verified || !!agent.token_address,
  };
}

export const elizaosClient = new ElizaOSClient();
export default ElizaOSClient;
