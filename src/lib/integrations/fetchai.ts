/**
 * Fetch.ai Agentverse Integration
 *
 * Agentverse is Fetch.ai's agent discovery and marketplace platform.
 * Agents register in the Almanac for discovery and can transact on-chain.
 *
 * Search API: POST https://agentverse.ai/v1/search/agents
 */

const FETCHAI_SEARCH_BASE = "https://agentverse.ai/v1/search";

export interface FetchAIAgent {
  address: string;
  name: string;
  description: string;
  state: "active" | "inactive" | "paused";
  category: string;
  agent_type: string;
  protocol_digest: string;
  interaction_count: number;
  created_at: string;
  updated_at: string;
}

export interface FetchAISearchResponse {
  agents: FetchAIAgent[];
  total: number;
  offset: number;
  limit: number;
}

export interface FetchAIInteractionHistory {
  address: string;
  history: { date: string; count: number }[];
  total: number;
}

class FetchAIClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.FETCHAI_API_URL || FETCHAI_SEARCH_BASE;
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
      throw new Error(`Fetch.ai API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Search agents on Agentverse
   */
  async searchAgents(options: {
    search_text?: string;
    sort?: "relevance" | "recent" | "popular";
    filters?: {
      state?: "active" | "inactive";
      category?: string;
      agent_type?: string;
      protocol_digest?: string;
    };
    offset?: number;
    limit?: number;
  } = {}): Promise<FetchAISearchResponse> {
    return this.fetch<FetchAISearchResponse>("/agents", {
      method: "POST",
      body: JSON.stringify({
        search_text: options.search_text || "",
        sort: options.sort || "popular",
        filters: options.filters || {},
        direction: "desc",
        offset: options.offset || 0,
        limit: options.limit || 50,
      }),
    });
  }

  /**
   * Get interaction history for an agent
   */
  async getAgentInteractions(address: string): Promise<FetchAIInteractionHistory> {
    return this.fetch<FetchAIInteractionHistory>(
      `/agents/interactions/${address}`
    );
  }

  /**
   * Search agent functions/capabilities
   */
  async searchFunctions(options: {
    search_text?: string;
    function_type?: string;
    limit?: number;
  } = {}): Promise<{ functions: { id: string; name: string; description: string; agent_address: string }[] }> {
    return this.fetch("/functions", {
      method: "POST",
      body: JSON.stringify({
        search_text: options.search_text || "",
        filters: options.function_type ? { function_type: options.function_type } : {},
        limit: options.limit || 50,
      }),
    });
  }
}

/**
 * Transform Fetch.ai agent to our internal format
 */
export function transformFetchAIAgent(agent: FetchAIAgent) {
  return {
    name: agent.name || `Agent ${agent.address.slice(0, 8)}`,
    description: agent.description,
    avatar: null,
    platform: "fetchai" as const,
    platformId: agent.address,
    platformUrl: `https://agentverse.ai/agents/${agent.address}`,
    category: agent.category || "general",
    tags: [agent.category, agent.agent_type].filter(Boolean),
    capabilities: [agent.protocol_digest].filter(Boolean),
    popularity: agent.interaction_count,
    lastActive: new Date(agent.updated_at),
    platformCreatedAt: new Date(agent.created_at),
    verified: agent.state === "active",
  };
}

export const fetchaiClient = new FetchAIClient();
export default FetchAIClient;
