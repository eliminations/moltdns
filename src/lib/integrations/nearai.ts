/**
 * NEAR AI Integration
 *
 * NEAR AI provides infrastructure for building and deploying
 * AI agents on the NEAR Protocol blockchain.
 *
 * Hub: https://app.near.ai
 * Docs: https://docs.near.ai
 */

const NEARAI_API_BASE = "https://api.near.ai/v1";

export interface NEARAIAgent {
  id: string;
  name: string;
  description: string;
  account_id: string;
  model: string;
  category: string;
  tags: string[];
  run_count: number;
  star_count: number;
  fork_count: number;
  is_public: boolean;
  version: string;
  created_at: string;
  updated_at: string;
  avatar_url: string | null;
}

export interface NEARAIListResponse {
  agents: NEARAIAgent[];
  total: number;
  offset: number;
  limit: number;
}

class NEARAIClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEARAI_API_URL || NEARAI_API_BASE;
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
      throw new Error(`NEAR AI API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get public agents from NEAR AI hub
   */
  async getAgents(options: {
    limit?: number;
    offset?: number;
    sort?: "popular" | "recent" | "stars";
    category?: string;
  } = {}): Promise<NEARAIListResponse> {
    const params = new URLSearchParams({
      limit: String(options.limit || 50),
      offset: String(options.offset || 0),
      sort: options.sort || "popular",
      is_public: "true",
    });

    if (options.category) params.set("category", options.category);

    return this.fetch<NEARAIListResponse>(
      `/agents?${params.toString()}`
    );
  }

  /**
   * Get a specific agent by ID
   */
  async getAgent(agentId: string): Promise<NEARAIAgent> {
    const response = await this.fetch<{ agent: NEARAIAgent }>(
      `/agents/${agentId}`
    );
    if (!response.agent) {
      throw new Error(`NEAR AI agent ${agentId} not found`);
    }
    return response.agent;
  }

  /**
   * Search agents by keyword
   */
  async searchAgents(query: string, limit = 25): Promise<NEARAIAgent[]> {
    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
      is_public: "true",
    });

    const response = await this.fetch<NEARAIListResponse>(
      `/agents/search?${params.toString()}`
    );
    return response.agents ?? [];
  }
}

/**
 * Transform NEAR AI agent to our internal format
 */
export function transformNEARAIAgent(agent: NEARAIAgent) {
  return {
    name: agent.name,
    description: agent.description,
    avatar: agent.avatar_url,
    platform: "nearai" as const,
    platformId: agent.id,
    platformUrl: `https://app.near.ai/agents/${agent.account_id}/${agent.name}`,
    category: agent.category || "general",
    tags: agent.tags.slice(0, 5),
    capabilities: agent.tags,
    popularity: agent.run_count + agent.star_count,
    lastActive: new Date(agent.updated_at),
    platformCreatedAt: new Date(agent.created_at),
    verified: agent.star_count > 10 || agent.run_count > 50,
  };
}

export const nearaiClient = new NEARAIClient();
export default NEARAIClient;
